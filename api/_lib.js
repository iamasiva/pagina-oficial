// Utilidades compartidas de las funciones serverless.
// Los archivos que empiezan con "_" no se exponen como endpoints en Vercel.
import { createClient } from '@supabase/supabase-js';

// Cliente con llave de servicio: solo vive en el servidor, salta RLS.
export function adminClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

// Identifica al usuario a partir del header "Authorization: Bearer <jwt>"
// que el navegador envía con su sesión de Supabase.
export async function userFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await anon.auth.getUser(token);
  if (error) return null;
  return data.user;
}

// Composición de packs: ya NO está cableada. Vive en la tabla
// bundle_componentes (un pack contiene estos productos). Crear un pack nuevo es
// insertar filas ahí, sin tocar código.

// Los componentes de un pack, en orden. [] si el producto no es un pack.
export async function componentesDelPack(db, bundleId) {
  const { data } = await db
    .from('bundle_componentes')
    .select('componente_id, orden')
    .eq('bundle_id', bundleId)
    .order('orden');
  return (data ?? []).map((r) => r.componente_id);
}

// Todos los packs con sus componentes, como { bundleId: [comp1, comp2, ...] }.
// Una sola consulta: sirve para saber qué productos son packs y qué traen.
export async function mapaDePacks(db) {
  const { data } = await db
    .from('bundle_componentes')
    .select('bundle_id, componente_id, orden')
    .order('orden');
  const mapa = {};
  for (const r of data ?? []) (mapa[r.bundle_id] ??= []).push(r.componente_id);
  return mapa;
}

// TRM oficial (Superfinanciera) vía datos abiertos del gobierno. Gratis, sin llave.
// La TRM solo cambia en días hábiles: cache por día en memoria de la función.
let trmCache = { fecha: null, valor: null };

export async function trmDelDia() {
  const hoy = new Date().toISOString().slice(0, 10);
  if (trmCache.fecha === hoy && trmCache.valor) return trmCache.valor;

  try {
    const res = await fetch(
      'https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=1'
    );
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const [fila] = await res.json();
    const valor = parseFloat(fila?.valor);
    if (!valor || valor <= 0) throw new Error('TRM inválida');

    trmCache = { fecha: hoy, valor };
    // Respaldo durable: la última TRM oficial buena sobrevive arranques en frío
    try { await adminClient().from('trm_respaldo').upsert({ id: 1, valor, fecha: hoy }); } catch (_) {}
    return valor;
  } catch (err) {
    // datos.gov.co caído: la venta no se detiene, se cobra con la última TRM
    // OFICIAL conocida (la TRM rige por días y casi no se mueve entre uno y otro).
    if (trmCache.valor) return trmCache.valor;
    try {
      const { data } = await adminClient().from('trm_respaldo').select('valor, fecha').eq('id', 1).maybeSingle();
      const dias = data?.fecha ? (Date.parse(hoy) - Date.parse(data.fecha)) / 86400000 : 99;
      if (data?.valor > 0 && dias <= 10) return data.valor;
    } catch (_) {}
    throw new Error('No se pudo consultar la TRM oficial');
  }
}
