-- Guía 73: 4 herramientas gratis para desarrollar con IA (20 nov 2026). Correr en Supabase > SQL Editor.
-- Recurso gratuito del video "4 herramientas gratis para desarrollo con IA" (palabra clave: DESARROLLO).
-- Archivos ya subidos a Storage. Sergio pidió dejarla publicada de una vez: sale en el
-- catálogo y la landing /r/4-herramientas-desarrollo-ia queda viva.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
select '4 herramientas gratis para desarrollar con IA',
  'Programar con IA sin plan, con código viejo o sin revisar la seguridad sale caro después. Instala 4 herramientas gratis y úsalas en un proyecto de práctica: planear, construir, auditar la seguridad y encontrar skills.',
  0, true, false, true,
  '{"Desarrollo","Coding","Automatización"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1795212328000_4-herramientas-desarrollo-ia.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1795212328000_4-herramientas-desarrollo-ia.jpg',
  '4-herramientas-desarrollo-ia'
where not exists (select 1 from public.guides where slug = '4-herramientas-desarrollo-ia');

-- Verificación: debe salir una fila con publicada = true
select titulo, slug, es_premium, publicada from public.guides where slug = '4-herramientas-desarrollo-ia';
