// Migración: pilot/prompts.json de "200 diseños" → premium_items.
// Uso local:  node scripts/migrar-200.mjs
// El objeto completo de cada diseño se guarda en data (sin pérdida): la página
// fiel reconstruye el array original con filas.map(f => f.data).
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const SUPABASE_URL = 'https://iyiygnfaxiejtlgkkivs.supabase.co';
const JSON_PATH =
  '/Users/sergiolizcano/Desktop/PROYECTOS/PROYECTOS IA MASIVA/VERSIONES FINALES RECURSOS/200 diseños para presentaciones/pilot/prompts.json';
const PRODUCT_NOMBRE = '200 Diseños para Presentaciones en NotebookLM';

function serviceKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  const creds = readFileSync(new URL('../credenciales_privadas.txt', import.meta.url), 'utf8');
  const linea = creds.split('\n').find((l) => l.toLowerCase().includes('service role'));
  const key = linea?.split(':').slice(1).join(':').trim();
  if (!key) throw new Error('No encontré la service role key');
  return key;
}

const db = createClient(SUPABASE_URL, serviceKey(), { auth: { persistSession: false } });

async function ensureProduct() {
  const { data: existente } = await db.from('products').select('id').eq('nombre', PRODUCT_NOMBRE).maybeSingle();
  if (existente) return existente.id;
  const { data, error } = await db
    .from('products')
    .insert({ tipo: 'guia', nombre: PRODUCT_NOMBRE, precio_usd_centavos: 0, activo: false })
    .select('id')
    .single();
  if (error) throw new Error('Creando producto: ' + error.message);
  console.log('Producto creado (INACTIVO, precio pendiente):', data.id);
  return data.id;
}

async function main() {
  const disenos = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  if (!Array.isArray(disenos) || disenos.length !== 200) throw new Error(`Esperaba 200 diseños, hay ${disenos?.length}`);
  console.log(`Diseños leídos: ${disenos.length}`);

  const productId = await ensureProduct();
  console.log('PRODUCT_ID:', productId);
  const filas = disenos.map((d) => ({
    product_id: productId,
    item_num: d.catalog_number,
    code: d.id,
    nombre: d.nombre_es,
    categoria: d.categorias?.[0] ?? null,
    subcategoria: null,
    familia: 'notebooklm',
    icono: null,
    descripcion: null,
    data: d,   // el diseño completo, sin pérdida
  }));

  const LOTE = 50;
  for (let i = 0; i < filas.length; i += LOTE) {
    const lote = filas.slice(i, i + LOTE);
    const { error } = await db.from('premium_items').upsert(lote, { onConflict: 'product_id,item_num' });
    if (error) throw new Error(`Lote ${i / LOTE + 1}: ${error.message}`);
    process.stdout.write(`\r${Math.min(i + LOTE, filas.length)}/${filas.length}`);
  }

  const { count } = await db.from('premium_items').select('*', { count: 'exact', head: true }).eq('product_id', productId);
  console.log(`\nListo. Filas en premium_items para este producto: ${count}`);
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
