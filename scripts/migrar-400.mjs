// Migración: dataset embebido en el index.html de "400 gemas" → premium_items.
// Uso local:  node scripts/migrar-400.mjs
// El objeto completo de cada gema se guarda en data (sin pérdida): la página
// fiel reconstruye el array original con filas.map(f => f.data).
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const SUPABASE_URL = 'https://iyiygnfaxiejtlgkkivs.supabase.co';
const HTML_PATH =
  '/Users/sergiolizcano/Desktop/PROYECTOS/PROYECTOS IA MASIVA/VERSIONES FINALES RECURSOS/400 gemas para gemini/index.html';
const PRODUCT_NOMBRE = '400 Gemas para Gemini';

function serviceKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  const creds = readFileSync(new URL('../credenciales_privadas.txt', import.meta.url), 'utf8');
  const linea = creds.split('\n').find((l) => l.toLowerCase().includes('service role'));
  const key = linea?.split(':').slice(1).join(':').trim();
  if (!key) throw new Error('No encontré la service role key');
  return key;
}

// Extrae el array `const gems = [...]` del HTML por líneas (el archivo tiene
// líneas base64 gigantes en el body — nunca leerlo entero con herramientas de texto).
function extraerGems() {
  const lineas = readFileSync(HTML_PATH, 'utf8').split('\n');
  const inicio = lineas.findIndex((l) => l.trim().startsWith('const gems = ['));
  if (inicio === -1) throw new Error('No encontré "const gems = ["');
  let fin = -1;
  for (let i = inicio + 1; i < lineas.length; i++) {
    if (lineas[i].trim() === '];') { fin = i; break; }
  }
  if (fin === -1) throw new Error('No encontré el cierre del array gems');
  const texto = lineas.slice(inicio, fin + 1).join('\n')
    .replace(/^\s*const gems =\s*/, '')
    .replace(/;\s*$/, '');
  const gems = JSON.parse(texto);
  if (!Array.isArray(gems) || !gems.length) throw new Error('El array gems quedó vacío');
  return gems;
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
  const gems = extraerGems();
  console.log(`Gemas extraídas del HTML: ${gems.length}`);
  const campos = new Set();
  gems.forEach((g) => Object.keys(g).forEach((k) => campos.add(k)));
  console.log('Campos detectados:', [...campos].sort().join(', '));

  const productId = await ensureProduct();
  const filas = gems.map((g) => ({
    product_id: productId,
    item_num: g.id,
    code: null,
    nombre: g.nombre,
    categoria: g.categoria ?? null,
    subcategoria: g.subcategoria ?? null,
    familia: g.herramienta ?? null,
    icono: null,
    descripcion: g.descripcion_corta ?? null,
    data: g,   // la gema completa, sin pérdida
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
