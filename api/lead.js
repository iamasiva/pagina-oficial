// POST /api/lead
// Captura el correo de la landing de un recurso gratuito (sin sesión), guarda
// el lead y envía el recurso por correo vía Brevo. El correo de entrega lleva
// el link al visor público del recurso.
import { adminClient } from './_lib.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function correoEntrega(guia, enlace) {
  const portada = guia.imagen_url
    ? `<tr><td style="padding:0 0 18px;"><img src="${guia.imagen_url}" alt="" width="520" style="width:100%;max-width:520px;border-radius:12px;display:block;"></td></tr>`
    : '';
  return `
  <div style="background:#f5f4f0;padding:28px 14px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px 24px;">
      <tr><td style="padding:0 0 16px;font-size:15px;font-weight:bold;color:#0B1E6D;letter-spacing:.04em;">IA MASIVA</td></tr>
      <tr><td style="padding:0 0 8px;font-size:22px;font-weight:bold;color:#111827;line-height:1.25;">Aquí está tu recurso</td></tr>
      <tr><td style="padding:0 0 18px;font-size:15px;color:#374151;line-height:1.5;">Nos pediste <strong>${guia.titulo}</strong> y te lo dejamos listo, completo y sin registros. Un clic y es tuyo:</td></tr>
      ${portada}
      <tr><td style="padding:0 0 22px;">
        <a href="${enlace}" style="display:inline-block;background:#2F6BFF;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:12px;">Ver mi recurso</a>
      </td></tr>
      <tr><td style="padding:0 0 6px;border-top:1px solid #e5e7eb;"></td></tr>
      <tr><td style="padding:10px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">Este es solo uno de los recursos gratuitos de IA MASIVA. Cuando quieras, explora la biblioteca completa en <a href="https://iamasiva.co" style="color:#2F6BFF;text-decoration:none;font-weight:bold;">iamasiva.co</a></td></tr>
    </table>
  </div>`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const email = String(req.body?.email ?? '').trim().toLowerCase().slice(0, 200);
    const slug = String(req.body?.slug ?? '').trim().slice(0, 100);
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Escribe un correo válido' });
    if (!slug) return res.status(400).json({ error: 'Recurso no indicado' });

    const db = adminClient();
    const { data: guia } = await db.from('guides')
      .select('id, titulo, imagen_url, es_gratis')
      .eq('slug', slug).single();
    if (!guia?.es_gratis) return res.status(404).json({ error: 'Recurso no encontrado' });

    // Freno anti-abuso: máximo 10 solicitudes por correo al día
    const hace24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await db.from('leads_recursos')
      .select('id', { count: 'exact', head: true })
      .eq('email', email).gte('creada_en', hace24h);
    if ((count ?? 0) >= 10) return res.status(429).json({ error: 'Ya hiciste varios envíos hoy con este correo' });

    const fila = { email, guide_id: guia.id, slug };
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) {
      const v = req.body?.[k];
      if (typeof v === 'string' && v.trim()) fila[k] = v.trim().slice(0, 120);
    }

    // Si ya pidió este recurso no se duplica el lead, pero el correo SÍ se reenvía
    const { error } = await db.from('leads_recursos')
      .upsert(fila, { onConflict: 'email,guide_id' });
    if (error) throw new Error(error.message);

    const enlace = `https://iamasiva.co/ver-recurso.html?r=${encodeURIComponent(slug)}`;
    const envio = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'IA MASIVA', email: 'comunidad@iamasiva.co' },
        replyTo: { email: 'contacto@iamasiva.co' },
        to: [{ email }],
        subject: `Tu recurso: ${guia.titulo}`,
        htmlContent: correoEntrega(guia, enlace),
      }),
    });
    if (!envio.ok) {
      const detalle = await envio.text().catch(() => '');
      throw new Error('No se pudo enviar el correo. ' + detalle.slice(0, 200));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
