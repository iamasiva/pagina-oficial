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

    const db = adminClient();
    const { data: huerfanas, error } = await db
      .from('purchases')
      .select('id, product_id')
      .is('user_id', null)
      .ilike('email_comprador', user.email);
    if (error) throw new Error(error.message);

    let reclamadas = 0;
    for (const compra of huerfanas ?? []) {
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
