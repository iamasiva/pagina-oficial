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

// El bundle desbloquea sus tres componentes al aprobarse (lo hace el webhook).
export const BUNDLE = {
  productId: '8dd3d7fa-f9f1-41dd-9539-098cb4c68e11',
  componentes: [
    '656f61d7-37b2-4e9c-8cf3-67065484493c', // 557 Configuraciones
    '0f0d6926-5328-4e3e-89a4-92b36ef13996', // 400 Gemas
    '2c296299-d9a4-4409-bc99-67b4999e47f8', // 200 Diseños
  ],
};

// TRM oficial (Superfinanciera) vía datos abiertos del gobierno. Gratis, sin llave.
// La TRM solo cambia en días hábiles: cache por día en memoria de la función.
let trmCache = { fecha: null, valor: null };

export async function trmDelDia() {
  const hoy = new Date().toISOString().slice(0, 10);
  if (trmCache.fecha === hoy && trmCache.valor) return trmCache.valor;

  const res = await fetch(
    'https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=1'
  );
  if (!res.ok) throw new Error('No se pudo consultar la TRM oficial');
  const [fila] = await res.json();
  const valor = parseFloat(fila?.valor);
  if (!valor || valor <= 0) throw new Error('TRM inválida');

  trmCache = { fecha: hoy, valor };
  return valor;
}
