// Sube las 200 previews de "200 diseños" a un bucket PÚBLICO de Storage.
// Decisión de Sergio (2026-08-02): las previews son muestra visual, el prompt
// es lo que se vende — bucket público para galería rápida con CDN.
// Uso local:  node scripts/subir-previews-200.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SUPABASE_URL = 'https://iyiygnfaxiejtlgkkivs.supabase.co';
// Acepta un directorio alterno (ej. la copia optimizada con sips) como argumento.
const PREVIEWS_DIR = process.argv[2] ||
  '/Users/sergiolizcano/Desktop/PROYECTOS/PROYECTOS IA MASIVA/VERSIONES FINALES RECURSOS/200 diseños para presentaciones/pilot/previews';
const BUCKET = 'previews-200';

function serviceKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  const creds = readFileSync(new URL('../credenciales_privadas.txt', import.meta.url), 'utf8');
  const linea = creds.split('\n').find((l) => l.toLowerCase().includes('service role'));
  const key = linea?.split(':').slice(1).join(':').trim();
  if (!key) throw new Error('No encontré la service role key');
  return key;
}

const db = createClient(SUPABASE_URL, serviceKey(), { auth: { persistSession: false } });

async function main() {
  const { error: eBucket } = await db.storage.createBucket(BUCKET, { public: true });
  if (eBucket && !/already exists/i.test(eBucket.message)) throw new Error('Creando bucket: ' + eBucket.message);
  console.log(`Bucket ${BUCKET} listo (público).`);

  const archivos = readdirSync(PREVIEWS_DIR).filter((f) => f.endsWith('.jpg')).sort();
  if (archivos.length !== 200) throw new Error(`Esperaba 200 previews, hay ${archivos.length}`);

  let subidos = 0;
  for (const nombre of archivos) {
    const buffer = readFileSync(join(PREVIEWS_DIR, nombre));
    const { error } = await db.storage.from(BUCKET).upload(nombre, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) throw new Error(`${nombre}: ${error.message}`);
    subidos++;
    process.stdout.write(`\r${subidos}/200`);
  }

  const { data: lista, error: eList } = await db.storage.from(BUCKET).list('', { limit: 300 });
  if (eList) throw new Error('Verificando: ' + eList.message);
  console.log(`\nListo. Archivos en el bucket: ${lista.length}`);
  console.log(`URL base: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`);
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1); });
