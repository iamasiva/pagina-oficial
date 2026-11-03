// GET /api/bootcamp-senal?clase=1[&solo=1]
// Detector de señal. Mira en el servidor si el Live Input de la clase ya está
// emitiendo y, si la clase está en sala abierta (lobby) y hay señal, la pasa a
// "en vivo" sola: Sergio solo da "Empezar transmisión" en StreamYard y no
// tiene que avisar a nadie. Lo llama la página de la clase cuando ve la
// primera señal, y también sirve para vigilarla desde afuera (curl cada 20 s).
// Con solo=1 únicamente informa, sin cambiar nada. No toca ningún otro estado:
// terminar la clase sigue siendo manual, desde la consola.
import { adminClient } from './_lib.js';
import { rutasDeClase, haySenal } from './_stream.js';

const PRODUCT_ID = '6c01d354-e05d-47be-a6d6-3075abcc16d3';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
    res.setHeader('Cache-Control', 'no-store');

    const numero = Number(req.query.clase);
    if (!Number.isInteger(numero) || numero < 1 || numero > 9) return res.status(400).json({ error: 'Clase inválida' });
    const solo = String(req.query.solo ?? '') === '1';

    const db = adminClient();
    const { data: clase, error } = await db.from('bootcamp_clases').select('numero, estado').eq('product_id', PRODUCT_ID).eq('numero', numero).maybeSingle();
    if (error) throw new Error(error.message);
    if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });

    // Solo vale la pena mirar la señal con la sala abierta o en vivo (salvo que se pida solo informar)
    if (!solo && !['lobby', 'live'].includes(clase.estado)) {
      return res.status(200).json({ numero, estado: clase.estado, senal: null, cambiado: false });
    }
    const rutas = rutasDeClase(numero, 300);
    if (!rutas) return res.status(503).json({ error: 'La señal de esta clase no está configurada' });
    const senal = await haySenal(rutas.manifest);

    let estado = clase.estado, cambiado = false;
    if (!solo && senal === true && clase.estado === 'lobby') {
      // Candado en el WHERE: si otra llamada ya la puso en vivo, esta no hace nada
      const { data: filas, error: e } = await db.from('bootcamp_clases')
        .update({ estado: 'live', actualizado_en: new Date().toISOString() })
        .eq('product_id', PRODUCT_ID).eq('numero', numero).eq('estado', 'lobby').select('numero');
      if (e) throw new Error(e.message);
      if (filas?.length) { estado = 'live'; cambiado = true; }
    }
    return res.status(200).json({ numero, estado, senal, cambiado });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
