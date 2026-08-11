// POST /api/comentario
// Recibe el comentario de un usuario con sesión sobre una guía y lo guarda en
// comentarios_guia. La lectura la hace el navegador directo (RLS); el borrado
// solo el admin. El nombre se congela al momento de comentar para que la
// lista no dependa de leer perfiles ajenos.
import { adminClient, userFromRequest } from './_lib.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión para comentar' });

    const guideId = String(req.body?.guide_id ?? '');
    if (!UUID.test(guideId)) return res.status(400).json({ error: 'Guía inválida' });

    const texto = String(req.body?.texto ?? '').trim().slice(0, 600);
    if (texto.length < 2) return res.status(400).json({ error: 'Escribe tu comentario primero' });

    const db = adminClient();

    // La guía debe existir y estar publicada
    const { data: guia } = await db.from('guides').select('id').eq('id', guideId).eq('publicada', true).maybeSingle();
    if (!guia) return res.status(404).json({ error: 'Guía no encontrada' });

    // Freno anti-spam: máximo 10 comentarios por usuario por día
    const hace24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await db.from('comentarios_guia')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('creado_en', hace24h);
    if ((count ?? 0) >= 10) return res.status(429).json({ error: 'Ya comentaste varias veces hoy. ¡Gracias! Mañana puedes seguir.' });

    // Nombre visible: el del perfil; si no hay, la parte antes del @ del correo
    const { data: perfil } = await db.from('profiles').select('nombre').eq('id', user.id).maybeSingle();
    const nombre = (perfil?.nombre || user.user_metadata?.nombre || (user.email ?? '').split('@')[0] || 'Anónimo').slice(0, 60);

    const { data: fila, error } = await db.from('comentarios_guia')
      .insert({ guide_id: guideId, user_id: user.id, nombre, texto })
      .select('id, nombre, texto, creado_en')
      .single();
    if (error) throw new Error(error.message);

    return res.status(200).json({ ok: true, comentario: fila });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
