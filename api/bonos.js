// GET  /api/bonos                        → lista de bonos otorgados (solo admin)
// POST /api/bonos { accion, correos, productos } → otorgar | retirar (solo admin)
//
// Un bono es una compra APROBADA con gateway 'bono' y monto 0: habilita el
// producto igual que una compra real. Si el correo aún no tiene cuenta, la
// fila queda huérfana (user_id null) y /api/reclamar la engancha sola cuando
// esa persona se registre con ese correo. Retirar solo borra filas 'bono':
// las compras reales jamás se tocan.
import { adminClient, userFromRequest } from './_lib.js';

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  try {
    const db = adminClient();
    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión' });
    const { data: perfil } = await db.from('profiles').select('es_admin').eq('id', user.id).maybeSingle();
    if (!perfil?.es_admin) return res.status(403).json({ error: 'Solo el admin' });

    if (req.method === 'GET') {
      const { data, error } = await db.from('purchases')
        .select('id, product_id, user_id, email_comprador, purchased_at')
        .eq('gateway', 'bono')
        .order('purchased_at', { ascending: false });
      if (error) throw new Error(error.message);
      return res.status(200).json({ bonos: data ?? [] });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const accion = req.body?.accion;
    const correos = [...new Set((req.body?.correos ?? [])
      .map(c => String(c).trim().toLowerCase())
      .filter(c => CORREO_RE.test(c)))].slice(0, 500);
    const productosPedidos = (req.body?.productos ?? []).map(String);
    if (!correos.length) return res.status(400).json({ error: 'No hay correos válidos' });

    if (accion === 'otorgar') {
      if (!productosPedidos.length) return res.status(400).json({ error: 'Elige al menos un producto' });
      const { data: productos } = await db.from('products').select('id, guide_id, tipo, nombre').eq('activo', true);
      const validos = (productos ?? []).filter(p =>
        productosPedidos.includes(p.id) && p.tipo !== 'bundle' && !/bundle/i.test(p.nombre));
      if (!validos.length) return res.status(400).json({ error: 'Productos inválidos' });

      let otorgados = 0, saltados = 0;
      for (const correo of correos) {
        const { data: dueno } = await db.from('profiles').select('id').ilike('email', correo).maybeSingle();
        for (const p of validos) {
          // Si ya lo posee (compra real o bono previo), se salta
          if (dueno) {
            const { data: ya } = await db.from('purchases').select('id')
              .eq('user_id', dueno.id).eq('product_id', p.id).eq('estado', 'APROBADA').maybeSingle();
            if (ya) { saltados++; continue; }
          } else {
            const { data: ya } = await db.from('purchases').select('id')
              .is('user_id', null).eq('product_id', p.id).eq('gateway', 'bono')
              .ilike('email_comprador', correo).maybeSingle();
            if (ya) { saltados++; continue; }
          }
          const { error } = await db.from('purchases').insert({
            user_id: dueno?.id ?? null,
            email_comprador: correo,
            product_id: p.id,
            guide_id: p.guide_id,
            estado: 'APROBADA',
            gateway: 'bono',
            referencia: `bono__${p.id.slice(0, 8)}__${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            monto_centavos: 0,
            moneda: 'COP',
            monto_usd_centavos: 0,
            purchased_at: new Date().toISOString(),
          });
          if (error) saltados++; else otorgados++;
        }
      }
      return res.status(200).json({ otorgados, saltados });
    }

    if (accion === 'retirar') {
      let retirados = 0;
      for (const correo of correos) {
        let q = db.from('purchases').delete().eq('gateway', 'bono').ilike('email_comprador', correo);
        if (productosPedidos.length) q = q.in('product_id', productosPedidos);
        const { data, error } = await q.select('id');
        if (!error) retirados += (data ?? []).length;
      }
      return res.status(200).json({ retirados });
    }

    return res.status(400).json({ error: 'Acción desconocida' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
