// POST /api/completar-pack
// Cuando lo ya invertido en piezas cubre el valor del pack, lo que falta se
// regala: se habilitan las piezas faltantes como compras APROBADAS de monto 0.
// Gateway 'bono' (referencia 'regalo-pack__...') para que las métricas de
// ventas no las cuenten. La condición del regalo se valida AQUÍ, nunca en el
// navegador.
import { adminClient, userFromRequest, componentesDelPack, bonosDelProducto, piezasConCredito } from './_lib.js';
import { agregarCompradorBrevo, PRODUCTO_BOOTCAMP } from './_correo-bootcamp.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión para reclamar tu regalo' });

    // Cuál pack se completa (con varios packs, hay que decirlo)
    const bundleId = String(req.query.bundle ?? req.body?.bundle ?? '');
    if (!UUID.test(bundleId)) return res.status(400).json({ error: 'Pack inválido' });

    const db = adminClient();

    // La tabla dice qué trae el pack; si no trae nada, puede ser un producto con
    // bonos (crédito por bonos, 6 nov 2026): se regala el producto entero y sus
    // bonos cuando lo ya pagado por las piezas cubre su precio.
    let componentes = await componentesDelPack(db, bundleId);
    const esPack = componentes.length > 0;
    if (!esPack) componentes = await piezasConCredito(db, bundleId);
    if (!componentes.length) return res.status(400).json({ error: 'Ese producto no es un pack' });

    const { data: previas } = await db.from('purchases')
      .select('product_id')
      .eq('user_id', user.id)
      .in('product_id', componentes)
      .eq('estado', 'APROBADA');
    const propios = [...new Set((previas ?? []).map(p => p.product_id))];
    if (!propios.length) return res.status(400).json({ error: 'El regalo es para quien ya tiene piezas del pack' });
    if (esPack && propios.length >= componentes.length) return res.status(409).json({ error: 'Ya tienes todos los recursos del pack' });
    if (!esPack) {
      const { data: yaTiene } = await db.from('purchases').select('id').eq('user_id', user.id).eq('product_id', bundleId).eq('estado', 'APROBADA').limit(1).maybeSingle();
      if (yaTiene) return res.status(409).json({ error: 'Ya tienes este producto' });
    }

    const { data: prods } = await db.from('products')
      .select('id, guide_id, precio_usd_centavos, precio_promo_usd_centavos')
      .in('id', [...new Set([...componentes, bundleId, ...(esPack ? [] : await bonosDelProducto(db, bundleId))])]);
    const efectivo = (p) => p.precio_promo_usd_centavos ?? p.precio_usd_centavos;
    const pack = (prods ?? []).find(p => p.id === bundleId);
    if (!pack) return res.status(500).json({ error: 'Pack no disponible' });

    // El regalo se decide por DINERO REALMENTE PAGADO, no por precio de lista.
    // Solo cuenta pago real (gateway wompi): las piezas regaladas (bono) o
    // incluidas en otro pack (bundle) no acumulan crédito, así nadie completa
    // el pack gratis a punta de bonos.
    const { data: pagos } = await db.from('purchases')
      .select('monto_usd_centavos')
      .eq('user_id', user.id)
      .in('product_id', propios)
      .eq('estado', 'APROBADA')
      .in('gateway', ['wompi', 'hotmart']);
    const invertido = (pagos ?? []).reduce((s, p) => s + (p.monto_usd_centavos ?? 0), 0);
    if (invertido < efectivo(pack)) {
      return res.status(400).json({ error: 'Tu inversión aún no cubre el valor del pack' });
    }

    // Pack: se habilitan las piezas que faltan. Producto con bonos: se habilita el
    // producto y los bonos que aún no tenga (el bono se entrega igual que al comprar).
    const bonos = esPack ? [] : await bonosDelProducto(db, bundleId);
    const faltantes = esPack
      ? componentes.filter(id => !propios.includes(id))
      : [bundleId, ...bonos.filter(id => !propios.includes(id))];
    const ahora = new Date().toISOString();
    for (const id of faltantes) {
      const prod = prods.find(x => x.id === id);
      const { error } = await db.from('purchases').insert({
        user_id: user.id,
        email_comprador: user.email ?? null,
        product_id: id,
        guide_id: prod?.guide_id ?? null,
        estado: 'APROBADA',
        gateway: 'bono',
        referencia: `regalo-pack__${user.id}__${id}`,
        monto_centavos: 0,
        moneda: 'COP',
        monto_usd_centavos: 0,
        consintio_acceso: ahora,
        purchased_at: ahora,
      });
      if (error) throw new Error(error.message);
    }

    // Si lo regalado incluye el bootcamp (el producto o un pack que lo trae),
    // la persona entra a la lista "Compradores bootcamp" de Brevo igual que con
    // una compra por Hotmart, para que le lleguen los correos de alumnos.
    // agregarCompradorBrevo nunca lanza error: un fallo de Brevo no frena la entrega.
    if (faltantes.includes(PRODUCTO_BOOTCAMP)) {
      const correo = String(user.email ?? '').trim().toLowerCase() || null;
      console.log('completar-pack:', await agregarCompradorBrevo({ correo }));
    }

    return res.status(200).json({ ok: true, habilitados: faltantes });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
