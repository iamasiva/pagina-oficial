// POST /api/wompi-webhook
// Recibe los eventos de Wompi. Verifica la firma SHA256 con el secreto de
// eventos antes de confiar en nada. Solo el servidor escribe estados de
// compra — el navegador jamás toca esta tabla.
import crypto from 'node:crypto';
import { adminClient } from './_lib.js';

// Resuelve rutas tipo "transaction.id" dentro del objeto data del evento.
function valorPorRuta(obj, ruta) {
  return ruta.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

const ESTADOS = {
  APPROVED: 'APROBADA',
  DECLINED: 'DECLINADA',
  VOIDED: 'ANULADA',
  ERROR: 'ERROR',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const evento = req.body;
    const { properties = [], checksum } = evento?.signature || {};

    const concatenado = properties.map((p) => valorPorRuta(evento.data, p)).join('');
    const esperado = crypto
      .createHash('sha256')
      .update(`${concatenado}${evento.timestamp}${process.env.WOMPI_EVENTS_SECRET}`)
      .digest('hex');

    if (!checksum || esperado.toLowerCase() !== String(checksum).toLowerCase()) {
      return res.status(403).json({ error: 'Firma inválida' });
    }

    if (evento.event === 'transaction.updated') {
      const tx = evento.data.transaction;
      const estado = ESTADOS[tx.status] || 'ERROR';

      const db = adminClient();
      const { data: compra } = await db
        .from('purchases')
        .select('id, estado')
        .eq('referencia', tx.reference)
        .maybeSingle();

      // Idempotencia: una compra ya APROBADA no se toca (Wompi reintenta eventos).
      if (compra && compra.estado !== 'APROBADA') {
        const cambios = { estado, gateway_transaction_id: tx.id };
        if (estado === 'APROBADA') cambios.purchased_at = new Date().toISOString();

        const { error } = await db.from('purchases').update(cambios).eq('id', compra.id);
        if (error) {
          // Choque con el índice de "una sola compra aprobada por producto":
          // pago duplicado real. Se marca ERROR para revisión/reembolso manual.
          await db.from('purchases')
            .update({ estado: 'ERROR', gateway_transaction_id: tx.id })
            .eq('id', compra.id);
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    // Un 500 hace que Wompi reintente (30min, 3h, 24h) — correcto ante fallas transitorias.
    return res.status(500).json({ error: err.message });
  }
}
