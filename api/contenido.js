// GET /api/contenido?guide=<uuid>
// Entrega verificada del contenido. Las guías gratis devuelven su URL pública
// de siempre. Las premium exigen compra APROBADA (o ser admin) y se sirven
// con una URL firmada temporal desde el bucket privado — la verificación es
// 100% server-side, tal como exige el plan.
import { adminClient, userFromRequest } from './_lib.js';

// Recursos del Bootcamp Gemini de 0 a 100: guías premium despublicadas marcadas con la
// categoría "Recurso del bootcamp". Las desbloquea la compra APROBADA del bootcamp (no una
// compra propia) y su contenido vive en el bucket público "contenido", como las gratuitas.
const PRODUCTO_BOOTCAMP = '6c01d354-e05d-47be-a6d6-3075abcc16d3';
const esRecursoBootcamp = (g) => (g.categorias || []).includes('Recurso del bootcamp');

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
      const { data: compra } = esRecursoBootcamp(guide)
        ? await db.from('purchases').select('id').eq('user_id', user.id).eq('product_id', PRODUCTO_BOOTCAMP).eq('estado', 'APROBADA').limit(1).maybeSingle()
        : await db.from('purchases').select('id').eq('user_id', user.id).eq('guide_id', guideId).eq('estado', 'APROBADA').limit(1).maybeSingle();
      if (!compra) return res.status(403).json({ error: esRecursoBootcamp(guide) ? 'Este recurso es del Bootcamp Gemini de 0 a 100' : 'No has comprado este recurso' });
    }

    // Recurso del bootcamp: URL pública tal cual (mismo bucket que las guías gratuitas)
    if (esRecursoBootcamp(guide)) return res.status(200).json({ url: guide.contenido_url });

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
