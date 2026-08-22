// API de Conversiones de Meta (CAPI): envío de eventos desde el servidor.
// Los archivos que empiezan con "_" no se exponen como endpoints en Vercel.
//
// El mismo evento viaja también por el píxel del navegador con el MISMO
// event_id (la referencia de la compra): Meta deduplica y se queda con uno.
// Regla de oro: un fallo aquí JAMAS rompe al que llama (fallo silencioso).
import crypto from 'node:crypto';

const GRAPH_VERSION = 'v25.0';

// Solo el email viaja hasheado (SHA-256 de trim + minúsculas), como pide Meta.
// fbp/fbc/ip/ua van en claro por diseño de la API.
function hashEmail(email) {
  const limpio = String(email ?? '').trim().toLowerCase();
  if (!limpio) return null;
  return crypto.createHash('sha256').update(limpio).digest('hex');
}

// Devuelve true si Meta aceptó el evento; false ante cualquier problema.
export async function enviarEventoMeta({ eventName, eventId, email, fbp, fbc, ip, ua, sourceUrl, customData }) {
  try {
    const pixelId = process.env.META_PIXEL_ID;
    const token = process.env.META_CAPI_TOKEN;
    if (!pixelId || !token) {
      console.error('Meta CAPI: faltan META_PIXEL_ID o META_CAPI_TOKEN, evento no enviado');
      return false;
    }

    // Campos de matching: solo se incluyen los que traen valor.
    const userData = {};
    const emHash = hashEmail(email);
    if (emHash) userData.em = [emHash];
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;
    if (ip) userData.client_ip_address = ip;
    if (ua) userData.client_user_agent = ua;

    const evento = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      user_data: userData,
    };
    if (sourceUrl) evento.event_source_url = sourceUrl;
    if (customData) evento.custom_data = customData;

    const cuerpo = { data: [evento] };
    // Solo mientras se verifica la instalación: los eventos caen en
    // "Prueba de eventos" del Events Manager en vez del flujo real.
    if (process.env.META_TEST_EVENT_CODE) cuerpo.test_event_code = process.env.META_TEST_EVENT_CODE;

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
        // Si Meta se demora, se suelta: el webhook debe responderle rápido a Wompi.
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) {
      console.error('Meta CAPI: respuesta de error', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Meta CAPI: fallo al enviar', err.message);
    return false;
  }
}
