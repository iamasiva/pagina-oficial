// POST /api/reclamar
// Engancha al usuario autenticado las compras hechas como invitado con su
// mismo correo (el que el pagador escribió en Wompi). Idempotente: se puede
// llamar en cada inicio de sesión sin efectos dobles.
import { adminClient, userFromRequest } from './_lib.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const user = await userFromRequest(req);
    if (!user?.email) return res.status(401).json({ error: 'Inicia sesión para reclamar' });

    // Solo un correo VERIFICADO hereda compras. Sin esto, alguien podía
    // registrar el correo de la víctima (que compró como invitado) y quedarse
    // con lo que ella pagó. La verificación la exige Supabase Auth (Confirm
    // email ON); aquí se comprueba en el servidor por si acaso.
    if (!user.email_confirmed_at) {
      return res.status(403).json({ error: 'Confirma tu correo para reclamar tus compras', reclamadas: 0 });
    }

    // Correo del token, normalizado. Se compara por IGUALDAD exacta, nunca como
    // patrón: antes el correo entraba a un ILIKE y un registro con comodín
    // ("%@gmail.com") reclamaba en masa compras ajenas.
    const correo = String(user.email).trim().toLowerCase();

    const db = adminClient();
    // El comodín del ILIKE es solo para insensibilidad de mayúsculas; los
    // metacaracteres del correo se escapan, y además cada fila se confirma por
    // igualdad exacta antes de tocarla (candado doble).
    const patron = correo.replace(/([%_\\])/g, '\\$1');
    const { data: huerfanas, error } = await db
      .from('purchases')
      .select('id, email_comprador')
      .is('user_id', null)
      .ilike('email_comprador', patron);
    if (error) throw new Error(error.message);

    let reclamadas = 0;
    for (const compra of huerfanas ?? []) {
      // Candado exacto: la fila debe ser del MISMO correo, no de un parecido.
      if (String(compra.email_comprador ?? '').trim().toLowerCase() !== correo) continue;
      const { error: e } = await db
        .from('purchases')
        .update({ user_id: user.id })
        .eq('id', compra.id);
      // Un choque con el índice único significa que ya posee ese producto
      // (por ejemplo, bundle + compra individual previa): se deja sin reclamar.
      if (!e) reclamadas++;
    }

    return res.status(200).json({ reclamadas });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
