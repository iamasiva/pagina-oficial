-- Guía 72: 5 cosas para trabajar con IA en 2027 (20 nov 2026). Correr en Supabase > SQL Editor.
-- Recurso gratuito del video "5 cosas para trabajar con IA en 2027" (palabra clave: INGENIERÍA).
-- Archivos ya subidos a Storage. Sergio pidió dejarla publicada de una vez: sale en el
-- catálogo y la landing /r/5-cosas-ia-2027 queda viva.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
select '5 cosas para trabajar con IA en 2027',
  'Las empresas ya no buscan solo a quien chatea con la IA, sino a quien sabe conectarla a sus sistemas. Haz 5 ejercicios con una tienda de práctica: MCP, RAG, memoria, evals y harness, sin saber programar.',
  0, true, false, true,
  '{"Desarrollo","LLM","Formación"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1795212328000_5-cosas-ia-2027.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1795212352000_5-cosas-ia-2027.jpg',
  '5-cosas-ia-2027'
where not exists (select 1 from public.guides where slug = '5-cosas-ia-2027');

-- Verificación: debe salir una fila con publicada = true
select titulo, slug, es_premium, publicada from public.guides where slug = '5-cosas-ia-2027';
