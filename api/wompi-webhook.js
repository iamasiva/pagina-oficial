// POST /api/wompi-webhook
// Recibe los eventos de Wompi. Verifica la firma SHA256 con el secreto de
// eventos antes de confiar en nada. Solo el servidor escribe estados de
// compra — el navegador jamás toca esta tabla.
import crypto from 'node:crypto';
import { adminClient, componentesDelPack } from './_lib.js';

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
        .select('id, estado, user_id, product_id, consintio_acceso, email_comprador')
        .eq('referencia', tx.reference)
        .maybeSingle();

      // Idempotencia: una compra ya APROBADA no se toca (Wompi reintenta eventos).
      if (compra && compra.estado !== 'APROBADA') {
        const cambios = { estado, gateway_transaction_id: tx.id };
        // El correo que el pagador escribió en Wompi: con él se reclama la
        // compra de invitado al crear la cuenta.
        if (tx.customer_email) cambios.email_comprador = tx.customer_email;
        if (estado === 'APROBADA') cambios.purchased_at = new Date().toISOString();

        const { error } = await db.from('purchases').update(cambios).eq('id', compra.id);
        if (error) {
          // Choque con el índice de "una sola compra aprobada por producto":
          // pago duplicado real. Se marca ERROR para revisión/reembolso manual.
          await db.from('purchases')
            .update({ estado: 'ERROR', gateway_transaction_id: tx.id })
            .eq('id', compra.id);
        } else if (estado === 'APROBADA') {
          // ¿El producto comprado es un pack? La tabla lo dice. Si lo es,
          // desbloquea sus componentes: una compra APROBADA por cada uno
          // (monto 0, gateway 'bundle'). Si el usuario ya tenía alguno, ese
          // componente se salta — el índice único lo protege igual.
          const componentes = await componentesDelPack(db, compra.product_id);
          for (const [i, componente] of componentes.entries()) {
            // Con dueño conocido se evita duplicar lo ya comprado; el invitado
            // recibe los tres y el reclamo posterior descarta duplicados.
            if (compra.user_id) {
              const { data: ya } = await db.from('purchases').select('id')
                .eq('user_id', compra.user_id).eq('product_id', componente)
                .eq('estado', 'APROBADA').maybeSingle();
              if (ya) continue;
            }
            await db.from('purchases').insert({
              user_id: compra.user_id,
              email_comprador: tx.customer_email ?? compra.email_comprador ?? null,
              product_id: componente,
              estado: 'APROBADA',
              gateway: 'bundle',
              referencia: `${tx.reference}__c${i + 1}`,
              monto_centavos: 0,
              moneda: 'COP',
              monto_usd_centavos: 0,
              purchased_at: new Date().toISOString(),
              gateway_transaction_id: tx.id,
              consintio_acceso: compra.consintio_acceso,
            });
          }
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    // Un 500 hace que Wompi reintente (30min, 3h, 24h) — correcto ante fallas transitorias.
    return res.status(500).json({ error: err.message });
  }
}
