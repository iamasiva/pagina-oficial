// GET /api/estado-compra?ref=<referencia>
// Estado de una compra para la página de confirmación, sin exigir sesión:
// la referencia solo la conoce quien hizo el pago (viaja en su navegador).
// Devuelve únicamente lo necesario para pintar la confirmación.
import { adminClient } from './_lib.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

    const ref = String(req.query.ref ?? '');
    if (!ref || ref.length < 20 || ref.length > 160) {
      return res.status(400).json({ error: 'Referencia inválida' });
    }

    const db = adminClient();
    const { data: compra, error } = await db
      .from('purchases')
      .select('estado, product_id, user_id')
      .eq('referencia', ref)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });

    return res.status(200).json({
      estado: compra.estado,
      product_id: compra.product_id,
      de_invitado: compra.user_id === null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
