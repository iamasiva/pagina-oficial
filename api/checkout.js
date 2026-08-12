// GET /api/checkout?product=<uuid>
// La sesión es OPCIONAL: cualquiera con el link puede comprar (fase X).
// Si viene sesión, la compra nace con dueño; si no, nace de invitado y se
// reclama después con el correo que el pagador escribió en Wompi.
// Calcula el monto en COP con la TRM del día (precio maestro en USD, cobro
// exacto: sin colchón ni redondeo), firma la transacción y devuelve la URL
// del checkout de Wompi. La firma usa un secreto que solo existe aquí.
import crypto from 'node:crypto';
import { adminClient, userFromRequest, trmDelDia } from './_lib.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

    const user = await userFromRequest(req);   // null = compra de invitado

    const productId = req.query.product;
    if (!productId) return res.status(400).json({ error: 'Falta el producto' });

    // Consentimiento expreso de acceso inmediato (renuncia al retracto:
    // Ley 1480 art. 47 exc. 1 / Directiva UE 2011/83 art. 16.m). Sin él no hay venta.
    if (req.query.consent !== '1') {
      return res.status(400).json({ error: 'Debes aceptar el acceso inmediato para continuar' });
    }

    const db = adminClient();
    const { data: product } = await db
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('activo', true)
      .single();
    if (!product) return res.status(404).json({ error: 'Producto no disponible' });

    if (user) {
      const { data: previa } = await db
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('estado', 'APROBADA')
        .maybeSingle();
      if (previa) return res.status(409).json({ error: 'Ya tienes este producto' });
    }

    const trm = await trmDelDia();
    // Si hay promoción activa se cobra el precio promocional; si no, el regular.
    let precioEfectivo = product.precio_promo_usd_centavos ?? product.precio_usd_centavos;

    // Completar el pack: quien ya tiene piezas paga solo lo que le falta para
    // llegar al valor del pack. Si su inversión ya lo cubre, el resto es un
    // regalo (/api/completar-pack) y aquí no hay nada que cobrar. El navegador
    // solo muestra este precio: la cifra que se cobra SIEMPRE se decide aquí.
    if (user && productId === BUNDLE.productId) {
      const { data: previas } = await db.from('purchases')
        .select('product_id')
        .eq('user_id', user.id)
        .in('product_id', BUNDLE.componentes)
        .eq('estado', 'APROBADA');
      const propios = [...new Set((previas ?? []).map(p => p.product_id))];
      if (propios.length >= BUNDLE.componentes.length) {
        return res.status(409).json({ error: 'Ya tienes los tres recursos del pack' });
      }
      if (propios.length) {
        const { data: comps } = await db.from('products')
          .select('id, precio_usd_centavos, precio_promo_usd_centavos')
          .in('id', propios);
        const yaInvertido = (comps ?? []).reduce((s, p) => s + (p.precio_promo_usd_centavos ?? p.precio_usd_centavos), 0);
        const restante = precioEfectivo - yaInvertido;
        if (restante <= 0) {
          return res.status(409).json({ error: 'Lo que te falta del pack te lo regalamos: acéptalo en la página de pago' });
        }
        precioEfectivo = restante;
      }
    }
    // centavos USD × TRM = centavos COP, redondeado a PESO COMPLETO:
    // las tarjetas vía Wompi rechazan montos con centavos
    // ("El método de pago escogido no soporta montos con centavos").
    const amountInCents = Math.round((precioEfectivo * trm) / 100) * 100;
    const currency = 'COP';
    const reference = `${productId}__${user ? user.id : 'guest'}__${Date.now()}`;

    const integrity = crypto
      .createHash('sha256')
      .update(`${reference}${amountInCents}${currency}${process.env.WOMPI_INTEGRITY_SECRET}`)
      .digest('hex');

    // Canal de origen de la venta (UTM del navegador del comprador).
    // Texto controlado por el visitante: se limpia y se acota.
    const limpiarUtm = (v) => {
      const t = String(v ?? '').trim().toLowerCase().slice(0, 60);
      return t || null;
    };
    const utm = {
      utm_source: limpiarUtm(req.query.utm_source),
      utm_medium: limpiarUtm(req.query.utm_medium),
      utm_campaign: limpiarUtm(req.query.utm_campaign),
    };

    // Registro PENDIENTE: deja auditoría de la TRM y el monto ofrecidos.
    const fila = {
      user_id: user?.id ?? null,
      product_id: productId,
      guide_id: product.guide_id,
      estado: 'PENDIENTE',
      gateway: 'wompi',
      referencia: reference,
      monto_centavos: amountInCents,
      moneda: currency,
      monto_usd_centavos: precioEfectivo,
      trm_aplicada: trm,
      consintio_acceso: new Date().toISOString(),
    };
    let { error: insertError } = await db.from('purchases').insert({ ...fila, ...utm });
    // Si las columnas UTM aún no existen, la venta jamás se pierde por eso.
    if (insertError) {
      ({ error: insertError } = await db.from('purchases').insert(fila));
    }
    if (insertError) throw new Error(insertError.message);

    const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
    const url = new URL('https://checkout.wompi.co/p/');
    url.searchParams.set('public-key', process.env.WOMPI_PUBLIC_KEY);
    url.searchParams.set('currency', currency);
    url.searchParams.set('amount-in-cents', String(amountInCents));
    url.searchParams.set('reference', reference);
    url.searchParams.set('signature:integrity', integrity);
    url.searchParams.set('redirect-url', `${origin}/confirmacion.html`);

    return res.status(200).json({ url: url.toString(), reference });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
