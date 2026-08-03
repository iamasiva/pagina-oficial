// GET /api/checkout?product=<uuid>
// Requiere sesión (Authorization: Bearer <jwt de Supabase>).
// Calcula el monto en COP con la TRM del día (precio maestro en USD, cobro
// exacto: sin colchón ni redondeo), firma la transacción y devuelve la URL
// del checkout de Wompi. La firma usa un secreto que solo existe aquí.
import crypto from 'node:crypto';
import { adminClient, userFromRequest, trmDelDia } from './_lib.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión para comprar' });

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

    const { data: previa } = await db
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('estado', 'APROBADA')
      .maybeSingle();
    if (previa) return res.status(409).json({ error: 'Ya tienes este producto' });

    const trm = await trmDelDia();
    // centavos USD × TRM = centavos COP. Cobro exacto al centavo.
    const amountInCents = Math.round(product.precio_usd_centavos * trm);
    const currency = 'COP';
    const reference = `${productId}__${user.id}__${Date.now()}`;

    const integrity = crypto
      .createHash('sha256')
      .update(`${reference}${amountInCents}${currency}${process.env.WOMPI_INTEGRITY_SECRET}`)
      .digest('hex');

    // Registro PENDIENTE: deja auditoría de la TRM y el monto ofrecidos.
    const { error: insertError } = await db.from('purchases').insert({
      user_id: user.id,
      product_id: productId,
      guide_id: product.guide_id,
      estado: 'PENDIENTE',
      gateway: 'wompi',
      referencia: reference,
      monto_centavos: amountInCents,
      moneda: currency,
      monto_usd_centavos: product.precio_usd_centavos,
      trm_aplicada: trm,
      consintio_acceso: new Date().toISOString(),
    });
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
