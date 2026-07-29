// GET /api/contenido?guide=<uuid>
// Entrega verificada del contenido. Las guías gratis devuelven su URL pública
// de siempre. Las premium exigen compra APROBADA (o ser admin) y se sirven
// con una URL firmada temporal desde el bucket privado — la verificación es
// 100% server-side, tal como exige el plan.
import { adminClient, userFromRequest } from './_lib.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión' });

    const guideId = req.query.guide;
    if (!guideId) return res.status(400).json({ error: 'Falta la guía' });

    const db = adminClient();
    const { data: guide } = await db.from('guides').select('*').eq('id', guideId).single();
    if (!guide || !guide.contenido_url) return res.status(404).json({ error: 'Guía no encontrada' });

    // Gratuitas: URL pública tal cual.
    if (!guide.es_premium) return res.status(200).json({ url: guide.contenido_url });

    // Premium: compra APROBADA o admin.
    const { data: perfil } = await db.from('profiles').select('es_admin').eq('id', user.id).single();
    if (!perfil?.es_admin) {
      const { data: compra } = await db
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('guide_id', guideId)
        .eq('estado', 'APROBADA')
        .maybeSingle();
      if (!compra) return res.status(403).json({ error: 'No has comprado este recurso' });
    }

    // Para guías premium, contenido_url guarda la RUTA dentro del bucket privado
    // "contenido-premium" (no una URL pública).
    const { data: firmada, error } = await db.storage
      .from('contenido-premium')
      .createSignedUrl(guide.contenido_url, 3600);
    if (error) throw new Error(error.message);

    return res.status(200).json({ url: firmada.signedUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
