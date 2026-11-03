// GET /api/bootcamp-ticket?clase=1
// Ticket de reproducción del directo (fase 2 del plan maestro). Quien tiene
// sesión, compra aprobada del bootcamp (o es admin) y la clase está en sala o
// en vivo, recibe la URL del reproductor de Cloudflare Stream con un token
// firmado y corto. La firma y las rutas viven en _stream.js (compartidas con
// el detector de señal bootcamp-senal.js).
import { adminClient, userFromRequest } from './_lib.js';
import { rutasDeClase, VIGENCIA_SEG } from './_stream.js';

const PRODUCT_ID = '6c01d354-e05d-47be-a6d6-3075abcc16d3';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
    res.setHeader('Cache-Control', 'no-store');

    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión para ver la clase' });

    const numero = Number(req.query.clase);
    if (!Number.isInteger(numero) || numero < 1 || numero > 9) return res.status(400).json({ error: 'Clase inválida' });

    const db = adminClient();
    const [{ data: perfil }, { data: compra }, { data: config }, { data: clase }, { data: equipo }] = await Promise.all([
      db.from('profiles').select('es_admin').eq('id', user.id).maybeSingle(),
      db.from('purchases').select('id').eq('user_id', user.id).eq('product_id', PRODUCT_ID).eq('estado', 'APROBADA').limit(1).maybeSingle(),
      db.from('bootcamp_config').select('admin_only, video_enabled').eq('product_id', PRODUCT_ID).maybeSingle(),
      db.from('bootcamp_clases').select('numero, estado').eq('product_id', PRODUCT_ID).eq('numero', numero).maybeSingle(),
      // Equipo de ensayo (bootcamp_equipo): ve la señal en cualquier estado, sin compra
      db.from('bootcamp_equipo').select('email').eq('product_id', PRODUCT_ID).eq('email', String(user.email ?? '').toLowerCase()).maybeSingle(),
    ]);
    const esAdmin = !!perfil?.es_admin;
    const acceso = esAdmin || !!equipo;
    if (!acceso) {
      if (!compra) return res.status(403).json({ error: 'Esta clase es para compradores del bootcamp' });
      if (!config || config.admin_only) return res.status(403).json({ error: 'El bootcamp todavía no está abierto' });
    }
    if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });
    if (!config?.video_enabled) return res.status(409).json({ error: 'El video no está habilitado todavía' });
    if (!acceso && !['lobby', 'live'].includes(clase.estado)) return res.status(409).json({ error: 'La clase no está en vivo' });

    const rutas = rutasDeClase(numero);
    if (!rutas) return res.status(503).json({ error: 'La señal de esta clase no está configurada' });
    return res.status(200).json({
      iframe: rutas.iframe,
      // Con el manifiesto el navegador sabe si ya hay señal (200) o todavía no (204)
      manifest: rutas.manifest,
      expira_en: VIGENCIA_SEG,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
