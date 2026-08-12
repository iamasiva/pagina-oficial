// POST /api/completar-pack
// Cuando lo ya invertido en piezas cubre el valor del pack, lo que falta se
// regala: se habilitan las piezas faltantes como compras APROBADAS de monto 0.
// Gateway 'bono' (referencia 'regalo-pack__...') para que las métricas de
// ventas no las cuenten. La condición del regalo se valida AQUÍ, nunca en el
// navegador.
import { adminClient, userFromRequest, BUNDLE } from './_lib.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión para reclamar tu regalo' });

    const db = adminClient();

    const { data: previas } = await db.from('purchases')
      .select('product_id')
      .eq('user_id', user.id)
      .in('product_id', BUNDLE.componentes)
      .eq('estado', 'APROBADA');
    const propios = [...new Set((previas ?? []).map(p => p.product_id))];
    if (!propios.length) return res.status(400).json({ error: 'El regalo es para quien ya tiene piezas del pack' });
    if (propios.length >= BUNDLE.componentes.length) return res.status(409).json({ error: 'Ya tienes los tres recursos del pack' });

    const { data: prods } = await db.from('products')
      .select('id, guide_id, precio_usd_centavos, precio_promo_usd_centavos')
      .in('id', [...BUNDLE.componentes, BUNDLE.productId]);
    const efectivo = (p) => p.precio_promo_usd_centavos ?? p.precio_usd_centavos;
    const pack = (prods ?? []).find(p => p.id === BUNDLE.productId);
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
      .eq('gateway', 'wompi');
    const invertido = (pagos ?? []).reduce((s, p) => s + (p.monto_usd_centavos ?? 0), 0);
    if (invertido < efectivo(pack)) {
      return res.status(400).json({ error: 'Tu inversión aún no cubre el valor del pack' });
    }

    const faltantes = BUNDLE.componentes.filter(id => !propios.includes(id));
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

    return res.status(200).json({ ok: true, habilitados: faltantes });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
