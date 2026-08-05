// POST /api/sugerencia
// Recibe la sugerencia de un usuario con sesión. La guarda en la tabla
// sugerencias (red de seguridad: jamás se pierde una idea) y, si hay
// credenciales de Gmail configuradas, la envía a creativoiamasiva@gmail.com.
import { adminClient, userFromRequest } from './_lib.js';

const DESTINO = 'creativoiamasiva@gmail.com';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión para sugerir' });

    const texto = String(req.body?.texto ?? '').trim().slice(0, 2000);
    if (texto.length < 5) return res.status(400).json({ error: 'Sugerencia demasiado corta' });

    const db = adminClient();

    // Freno anti-spam: máximo 5 sugerencias por usuario por día
    const hace24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await db.from('sugerencias')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('creada_en', hace24h);
    if ((count ?? 0) >= 5) return res.status(429).json({ error: 'Ya enviaste varias hoy. ¡Gracias! Mañana puedes enviar más.' });

    const { error } = await db.from('sugerencias').insert({
      user_id: user.id,
      email: user.email ?? null,
      texto,
    });
    if (error) throw new Error(error.message);

    // Correo: solo si las credenciales están configuradas en Vercel.
    // Si falla, la sugerencia igual quedó guardada.
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const { default: nodemailer } = await import('nodemailer');
        const transporte = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        });
        await transporte.sendMail({
          from: `"IA MASIVA · Sugerencias" <${process.env.GMAIL_USER}>`,
          to: DESTINO,
          subject: 'Nueva sugerencia de recurso',
          text: `De: ${user.email ?? 'usuario sin correo'}\n\n${texto}`,
        });
      } catch (_) { /* la tabla es la fuente de verdad */ }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
