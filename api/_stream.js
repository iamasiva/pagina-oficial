// Firma y rutas de Cloudflare Stream, compartidas por el ticket del reproductor
// (bootcamp-ticket) y el detector de señal (bootcamp-senal). El UID de cada
// Live Input y la llave de firma solo viven aquí, en variables de Vercel:
// CF_STREAM_CUSTOMER_CODE (customer-xxxx), CF_STREAM_KEY_ID y CF_STREAM_JWK
// (llave creada en Stream > Keys), CF_STREAM_LIVE_INPUT_1, _2, _3.
import { createPrivateKey, sign } from 'node:crypto';

export const VIGENCIA_SEG = 4 * 3600; // cubre una clase de 2 h con margen; el cliente puede pedir otro

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

export function firmarToken(uid, vigencia = VIGENCIA_SEG) {
  const kid = process.env.CF_STREAM_KEY_ID;
  const jwk = process.env.CF_STREAM_JWK;
  if (!kid || !jwk) throw new Error('Falta la llave de firma de Cloudflare Stream');
  const ahora = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', kid };
  const payload = { sub: uid, kid, exp: ahora + vigencia, nbf: ahora - 60, accessRules: [{ type: 'any', action: 'allow' }] };
  const datos = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const llave = createPrivateKey({ key: JSON.parse(Buffer.from(jwk, 'base64').toString('utf8')), format: 'jwk' });
  const firma = sign('RSA-SHA256', Buffer.from(datos), llave);
  return `${datos}.${b64url(firma)}`;
}

// Rutas firmadas del reproductor y del manifiesto de una clase; null si la
// clase no tiene Live Input configurado.
export function rutasDeClase(numero, vigencia = VIGENCIA_SEG) {
  const uid = String(process.env[`CF_STREAM_LIVE_INPUT_${numero}`] ?? '').trim();
  // Acepta "customer-xxxx", "customer-xxxx.cloudflarestream.com" o la URL completa
  const customer = String(process.env.CF_STREAM_CUSTOMER_CODE ?? '').trim()
    .replace(/^https?:\/\//, '').replace(/\.cloudflarestream\.com.*$/i, '').replace(/\/.*$/, '');
  if (!uid || !customer) return null;
  const token = firmarToken(uid, vigencia);
  return {
    iframe: `https://${customer}.cloudflarestream.com/${token}/iframe`,
    // Con el manifiesto se sabe si ya hay señal (200) o todavía no (204)
    manifest: `https://${customer}.cloudflarestream.com/${token}/manifest/video.m3u8`,
  };
}

// true = ya hay transmisión; false = el Live Input existe pero nadie emite; null = no se pudo saber
export async function haySenal(manifest) {
  try {
    const r = await fetch(manifest, { cache: 'no-store' });
    return r.status === 200 ? true : r.status === 204 ? false : null;
  } catch (_) { return null; }
}
