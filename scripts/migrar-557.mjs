// Migración: configs_updated.json (557 configuraciones) → tabla premium_items.
// Uso local únicamente:  node scripts/migrar-557.mjs
// Lee la service role key de credenciales_privadas.txt (línea "Service role key: ...")
// o de la variable de entorno SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const SUPABASE_URL = 'https://iyiygnfaxiejtlgkkivs.supabase.co';
const CARPETA =
  '/Users/sergiolizcano/Desktop/PROYECTOS/PROYECTOS IA MASIVA/VERSIONES FINALES RECURSOS/1000 configuraciones cuadernos notebooklm y gemini';
const JSON_PATH = `${CARPETA}/configs_updated.json`;
const GRUPOS_CSV = `${CARPETA}/grupos_configuraciones_base.csv`;
const PRODUCT_NOMBRE = '557 Configuraciones para NotebookLM y Gemini';

// Parser CSV mínimo con soporte de campos entre comillas.
function parseCsv(texto) {
  const filas = [];
  let fila = [], campo = '', entreComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') entreComillas = false;
      else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
  const [encabezado, ...datos] = filas;
  return datos.filter(f => f.length === encabezado.length)
    .map(f => Object.fromEntries(encabezado.map((h, i) => [h, f[i]])));
}

// config_id → { grupo, rol base, audiencia } según la curaduría (1000 → 557 grupos)
function mapaGrupos() {
  const filas = parseCsv(readFileSync(GRUPOS_CSV, 'utf8'));
  const mapa = new Map();
  for (const f of filas) {
    mapa.set(Number(f.config_id), {
      grupo_num: Number(f.grupo_id),
      rol_base: f.rol_base,
      audiencia: f.audiencia_nicho,
    });
  }
  return mapa;
}

function serviceKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  const creds = readFileSync(new URL('../credenciales_privadas.txt', import.meta.url), 'utf8');
  const linea = creds.split('\n').find((l) => l.toLowerCase().includes('service role'));
  const key = linea?.split(':').slice(1).join(':').trim();
  if (!key) throw new Error('No encontré la service role key (ni en env ni en credenciales_privadas.txt)');
  return key;
}

const db = createClient(SUPABASE_URL, serviceKey(), { auth: { persistSession: false } });

// 1. Asegurar el producto (precio placeholder 0 + INACTIVO: no se puede comprar
//    hasta que se definan precios en la sesión de valoración).
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

// 2. Transformar el JSON a filas de premium_items, cruzando la curaduría.
function filas(productId) {
  const raw = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const grupos = mapaGrupos();
  let sinGrupo = 0;
  const resultado = Object.values(raw).map((c) => {
    const g = grupos.get(c.id);
    if (!g) sinGrupo++;
    return {
      product_id: productId,
      item_num: c.id,
      code: c.code ?? null,
      nombre: c.name,
      categoria: c.category_es ?? c.category ?? null,
      subcategoria: c.subcategory_es ?? c.subcategory ?? null,
      familia: c.family ?? null,
      icono: c.icon ?? null,
      descripcion: c.description_es ?? c.description ?? null,
      grupo_num: g?.grupo_num ?? null,
      rol_base: g?.rol_base ?? null,
      audiencia: g?.audiencia ?? null,
      data: {
        config_template: c.config_template ?? null,
        defaults: c.defaults ?? null,
        description_en: c.description_en ?? null,
        sensitivity: c.sensitivity ?? null,
      },
    };
  });
  if (sinGrupo) console.warn(`⚠ ${sinGrupo} configuraciones sin grupo en el CSV de curaduría`);
  return resultado;
}

// 3. Upsert por lotes (reejecutable sin duplicar: choca en product_id+item_num).
async function main() {
  const productId = await ensureProduct();
  const items = filas(productId);
  console.log(`Migrando ${items.length} configuraciones...`);

  const LOTE = 50;
  for (let i = 0; i < items.length; i += LOTE) {
    const lote = items.slice(i, i + LOTE);
    const { error } = await db.from('premium_items').upsert(lote, { onConflict: 'product_id,item_num' });
    if (error) throw new Error(`Lote ${i / LOTE + 1}: ${error.message}`);
    process.stdout.write(`\r${Math.min(i + LOTE, items.length)}/${items.length}`);
  }

  const { count } = await db
    .from('premium_items')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);
  console.log(`\nListo. Filas en premium_items para este producto: ${count}`);
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
