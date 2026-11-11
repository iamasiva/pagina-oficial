// GET /api/contenido?guide=<uuid>
// GET /api/contenido?transcripcion=<n>   (PDF de la transcripción de una clase del bootcamp)
// Entrega verificada del contenido. Las guías gratis devuelven su URL pública
// de siempre. Las premium exigen compra APROBADA (o ser admin) y se sirven
// con una URL firmada temporal desde el bucket privado: la verificación es
// 100% server-side, tal como exige el plan.
import { adminClient, userFromRequest } from './_lib.js';

// Recursos del Bootcamp Gemini de 0 a 100: guías premium marcadas con la categoría
// "Recurso del bootcamp" (ejercicios de cada clase, 42 formatos, 61 instrucciones, mapa,
// 25 agentes). Las desbloquea la compra APROBADA del bootcamp (no una compra propia).
// Desde el 10 nov 2026 su archivo vive en el bucket PRIVADO "contenido-premium"
// (contenido_url guarda la ruta) y se entrega con URL firmada; si una fila todavía guarda
// una URL pública completa, se entrega tal cual.
const PRODUCTO_BOOTCAMP = '6c01d354-e05d-47be-a6d6-3075abcc16d3';
const esRecursoBootcamp = (g) => (g.categorias || []).includes('Recurso del bootcamp');
// Por defecto abren el día de la clase 1; estos se entregan el día de su clase.
const CLASE_APERTURA = { '25-agentes-de-ia': 3 };
const BUCKET_PRIVADO = 'contenido-premium';
const SEGUNDOS_ENLACE = 600; // el visor descarga el archivo al instante; el enlace no sirve para compartir
const esUrl = (v) => /^https?:\/\//i.test(String(v || ''));

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión' });

    // Transcripción de una clase del bootcamp (PDF). Solo para quien tiene el bootcamp
    // (compra APROBADA), el equipo de ensayo o un admin. El archivo vive en el bucket
    // privado y se entrega con una URL firmada de pocos minutos, con nombre de descarga.
    if (req.query.transcripcion !== undefined) {
      const n = Number(req.query.transcripcion);
      if (!Number.isInteger(n) || n < 1 || n > 20) return res.status(400).json({ error: 'Clase no válida' });
      const dbT = adminClient();
      const { data: clase } = await dbT.from('bootcamp_clases').select('numero, transcripcion_url').eq('product_id', PRODUCTO_BOOTCAMP).eq('numero', n).maybeSingle();
      if (!clase?.transcripcion_url) return res.status(404).json({ error: 'Esta clase todavía no tiene transcripción' });
      const { data: perfilT } = await dbT.from('profiles').select('es_admin, email').eq('id', user.id).single();
      let permitido = !!perfilT?.es_admin;
      if (!permitido) {
        const correo = String(user.email || perfilT?.email || '').trim().toLowerCase();
        if (correo) {
          const { data: eq } = await dbT.from('bootcamp_equipo').select('email').eq('product_id', PRODUCTO_BOOTCAMP).eq('email', correo).limit(1).maybeSingle();
          permitido = !!eq;
        }
      }
      if (!permitido) {
        const { data: compra } = await dbT.from('purchases').select('id').eq('user_id', user.id).eq('product_id', PRODUCTO_BOOTCAMP).eq('estado', 'APROBADA').limit(1).maybeSingle();
        permitido = !!compra;
      }
      if (!permitido) return res.status(403).json({ error: 'La transcripción es para estudiantes del Bootcamp Gemini de 0 a 100' });
      const nombre = `Transcripción clase ${n} - Bootcamp Gemini de 0 a 100.pdf`;
      const ruta = clase.transcripcion_url;
      if (esUrl(ruta)) return res.status(200).json({ url: `${ruta}${ruta.includes('?') ? '&' : '?'}download=${encodeURIComponent(nombre)}` });
      const { data: firmadaT, error: errorT } = await dbT.storage.from(BUCKET_PRIVADO).createSignedUrl(ruta, SEGUNDOS_ENLACE, { download: nombre });
      if (errorT) throw new Error(errorT.message);
      return res.status(200).json({ url: firmadaT.signedUrl });
    }

    const guideId = req.query.guide;
    if (!guideId) return res.status(400).json({ error: 'Falta la guía' });

    const db = adminClient();
    const { data: guide } = await db.from('guides').select('*').eq('id', guideId).single();
    if (!guide || !guide.contenido_url) return res.status(404).json({ error: 'Guía no encontrada' });

    // Gratuitas: URL pública tal cual.
    if (!guide.es_premium) return res.status(200).json({ url: guide.contenido_url });

    // Premium: compra APROBADA o admin. El equipo de ensayo del bootcamp (tabla
    // bootcamp_equipo, se maneja desde la consola) entra a los recursos del bootcamp
    // sin compra y antes del primer día, igual que en recurso-bootcamp.html.
    const { data: perfil } = await db.from('profiles').select('es_admin, email').eq('id', user.id).single();
    let esEquipo = false;
    if (!perfil?.es_admin && esRecursoBootcamp(guide)) {
      const correo = String(user.email || perfil?.email || '').trim().toLowerCase();
      if (correo) {
        const { data: eq } = await db.from('bootcamp_equipo').select('email').eq('product_id', PRODUCTO_BOOTCAMP).eq('email', correo).limit(1).maybeSingle();
        esEquipo = !!eq;
      }
    }
    if (!perfil?.es_admin && !esEquipo) {
      const { data: compra } = esRecursoBootcamp(guide)
        ? await db.from('purchases').select('id').eq('user_id', user.id).eq('product_id', PRODUCTO_BOOTCAMP).eq('estado', 'APROBADA').limit(1).maybeSingle()
        : await db.from('purchases').select('id').eq('user_id', user.id).eq('guide_id', guideId).eq('estado', 'APROBADA').limit(1).maybeSingle();
      if (!compra) return res.status(403).json({ error: esRecursoBootcamp(guide) ? 'Este recurso es del Bootcamp Gemini de 0 a 100' : 'No has comprado este recurso' });
    }

    // Recurso del bootcamp: se habilita a medianoche de Bogotá del día de su clase de
    // apertura (la 1 si no dice otra cosa) para los compradores; los admins y el equipo
    // de ensayo siempre. Después se entrega como cualquier premium: URL firmada del bucket
    // privado (o la URL pública tal cual si la fila todavía guarda una).
    if (esRecursoBootcamp(guide)) {
      if (!perfil?.es_admin && !esEquipo) {
        const claseApertura = CLASE_APERTURA[guide.slug] || 1;
        const { data: clase } = await db.from('bootcamp_clases').select('inicio_utc').eq('product_id', PRODUCTO_BOOTCAMP).eq('numero', claseApertura).maybeSingle();
        if (clase?.inicio_utc) {
          const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(clase.inicio_utc));
          if (Date.now() < new Date(dia + 'T05:00:00Z').getTime()) return res.status(403).json({ error: claseApertura === 1 ? 'Los recursos del bootcamp se habilitan el primer día del evento' : `Este recurso se entrega en la clase ${claseApertura}` });
        }
      }
      if (esUrl(guide.contenido_url)) return res.status(200).json({ url: guide.contenido_url });
    }

    // Para guías premium, contenido_url guarda la RUTA dentro del bucket privado
    // "contenido-premium" (no una URL pública).
    const { data: firmada, error } = await db.storage
      .from(BUCKET_PRIVADO)
      .createSignedUrl(guide.contenido_url, SEGUNDOS_ENLACE);
    if (error) throw new Error(error.message);

    return res.status(200).json({ url: firmada.signedUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
