// GET /api/bootcamp-chat-ticket?clase=1
// Ticket del chat en vivo (fase 4). Mismas reglas que el video: sesión,
// compra aprobada del bootcamp (o admin), clase en sala o en vivo y chat no
// apagado. Devuelve la URL del WebSocket del Worker con un ticket HMAC de
// 3 horas que el Worker verifica sin tocar la base. El alias es el nombre del
// perfil (nunca el correo).
//
// Variables (Vercel): CHAT_TICKET_SECRET (el mismo que el Worker),
// CHAT_WS_URL (por ejemplo https://bootcamp-chat.<cuenta>.workers.dev).
import { createHmac } from 'node:crypto';
import { adminClient, userFromRequest } from './_lib.js';

const PRODUCT_ID = '6c01d354-e05d-47be-a6d6-3075abcc16d3';
const VIGENCIA_SEG = 3 * 3600;
const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

function alias(perfil, user) {
  const nombre = String(perfil?.nombre ?? user?.user_metadata?.nombre ?? '').trim();
  if (nombre) {
    const [primero, segundo] = nombre.split(/\s+/);
    return (primero + (segundo ? ' ' + segundo[0] + '.' : '')).slice(0, 24);
  }
  return 'Alumno';
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
    res.setHeader('Cache-Control', 'no-store');
    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión para entrar al chat' });
    const numero = Number(req.query.clase);
    if (!Number.isInteger(numero) || numero < 1 || numero > 9) return res.status(400).json({ error: 'Clase inválida' });

    const secreto = process.env.CHAT_TICKET_SECRET;
    const base = String(process.env.CHAT_WS_URL ?? '').trim().replace(/\/+$/, '');
    if (!secreto || !base) return res.status(503).json({ error: 'El chat no está configurado todavía' });

    const db = adminClient();
    const [{ data: perfil }, { data: compra }, { data: config }, { data: clase }, { data: equipo }] = await Promise.all([
      db.from('profiles').select('es_admin, nombre').eq('id', user.id).maybeSingle(),
      db.from('purchases').select('id').eq('user_id', user.id).eq('product_id', PRODUCT_ID).eq('estado', 'APROBADA').limit(1).maybeSingle(),
      db.from('bootcamp_config').select('admin_only, chat_mode').eq('product_id', PRODUCT_ID).maybeSingle(),
      db.from('bootcamp_clases').select('numero, estado').eq('product_id', PRODUCT_ID).eq('numero', numero).maybeSingle(),
      // Equipo de ensayo (bootcamp_equipo): entra al chat en cualquier estado, como alumno
      db.from('bootcamp_equipo').select('email').eq('product_id', PRODUCT_ID).eq('email', String(user.email ?? '').toLowerCase()).maybeSingle(),
    ]);
    const esAdmin = !!perfil?.es_admin;
    const acceso = esAdmin || !!equipo;
    if (!acceso) {
      if (!compra) return res.status(403).json({ error: 'El chat es para compradores del bootcamp' });
      if (!config || config.admin_only) return res.status(403).json({ error: 'El bootcamp todavía no está abierto' });
      if (!clase || !['lobby', 'live'].includes(clase.estado)) return res.status(409).json({ error: 'El chat se abre con la clase' });
      if (config.chat_mode === 'off') return res.status(409).json({ error: 'El chat está cerrado' });
    }
    if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });

    const ahora = Math.floor(Date.now() / 1000);
    const claims = { u: user.id, n: numero, r: esAdmin ? 'admin' : 'alumno', a: alias(perfil, user), iat: ahora, exp: ahora + VIGENCIA_SEG, j: b64url(require_nonce()) };
    const cuerpo = b64url(JSON.stringify(claims));
    const firma = b64url(createHmac('sha256', secreto).update(cuerpo).digest());
    const ticket = `${cuerpo}.${firma}`;
    const ws = base.replace(/^http/, 'ws') + `/sala/${numero}?t=${encodeURIComponent(ticket)}`;
    return res.status(200).json({ ws, rol: claims.r, alias: claims.a, modo: config?.chat_mode ?? 'normal', expira_en: VIGENCIA_SEG });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function require_nonce() {
  const b = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) b[i] = Math.floor(Math.random() * 256);
  return b;
}
