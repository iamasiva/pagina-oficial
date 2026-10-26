// GET /api/bootcamp-ticket?clase=1
// Ticket de reproducción del directo (fase 2 del plan maestro). Quien tiene
// sesión, compra aprobada del bootcamp (o es admin) y la clase está en sala o
// en vivo, recibe la URL del reproductor de Cloudflare Stream con un token
// firmado y corto. El UID del Live Input y la llave de firma solo viven aquí.
//
// Variables de entorno (Vercel): CF_STREAM_CUSTOMER_CODE (customer-xxxx),
// CF_STREAM_KEY_ID y CF_STREAM_JWK (llave de firma creada en Stream > Keys),
// CF_STREAM_LIVE_INPUT_1, _2, _3 (UID de cada Live Input).
import { createPrivateKey, sign } from 'node:crypto';
import { adminClient, userFromRequest } from './_lib.js';

const PRODUCT_ID = '6c01d354-e05d-47be-a6d6-3075abcc16d3';
const VIGENCIA_SEG = 4 * 3600; // cubre una clase de 2 h con margen; el cliente puede pedir otro

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

function firmarToken(uid) {
  const kid = process.env.CF_STREAM_KEY_ID;
  const jwk = process.env.CF_STREAM_JWK;
  if (!kid || !jwk) throw new Error('Falta la llave de firma de Cloudflare Stream');
  const ahora = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', kid };
  const payload = { sub: uid, kid, exp: ahora + VIGENCIA_SEG, nbf: ahora - 60, accessRules: [{ type: 'any', action: 'allow' }] };
  const datos = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const llave = createPrivateKey({ key: JSON.parse(Buffer.from(jwk, 'base64').toString('utf8')), format: 'jwk' });
  const firma = sign('RSA-SHA256', Buffer.from(datos), llave);
  return `${datos}.${b64url(firma)}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
    res.setHeader('Cache-Control', 'no-store');

    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión para ver la clase' });

    const numero = Number(req.query.clase);
    if (!Number.isInteger(numero) || numero < 1 || numero > 9) return res.status(400).json({ error: 'Clase inválida' });

    const db = adminClient();
    const [{ data: perfil }, { data: compra }, { data: config }, { data: clase }] = await Promise.all([
      db.from('profiles').select('es_admin').eq('id', user.id).maybeSingle(),
      db.from('purchases').select('id').eq('user_id', user.id).eq('product_id', PRODUCT_ID).eq('estado', 'APROBADA').limit(1).maybeSingle(),
      db.from('bootcamp_config').select('admin_only, video_enabled').eq('product_id', PRODUCT_ID).maybeSingle(),
      db.from('bootcamp_clases').select('numero, estado').eq('product_id', PRODUCT_ID).eq('numero', numero).maybeSingle(),
    ]);
    const esAdmin = !!perfil?.es_admin;
    if (!esAdmin) {
      if (!compra) return res.status(403).json({ error: 'Esta clase es para compradores del bootcamp' });
      if (!config || config.admin_only) return res.status(403).json({ error: 'El bootcamp todavía no está abierto' });
    }
    if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });
    if (!config?.video_enabled) return res.status(409).json({ error: 'El video no está habilitado todavía' });
    if (!esAdmin && !['lobby', 'live'].includes(clase.estado)) return res.status(409).json({ error: 'La clase no está en vivo' });

    const uid = String(process.env[`CF_STREAM_LIVE_INPUT_${numero}`] ?? '').trim();
    // Acepta "customer-xxxx", "customer-xxxx.cloudflarestream.com" o la URL completa
    const customer = String(process.env.CF_STREAM_CUSTOMER_CODE ?? '').trim()
      .replace(/^https?:\/\//, '').replace(/\.cloudflarestream\.com.*$/i, '').replace(/\/.*$/, '');
    if (!uid || !customer) return res.status(503).json({ error: 'La señal de esta clase no está configurada' });

    const token = firmarToken(uid);
    return res.status(200).json({
      iframe: `https://${customer}.cloudflarestream.com/${token}/iframe`,
      // Con el manifiesto el navegador sabe si ya hay señal (200) o todavía no (204)
      manifest: `https://${customer}.cloudflarestream.com/${token}/manifest/video.m3u8`,
      expira_en: VIGENCIA_SEG,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
