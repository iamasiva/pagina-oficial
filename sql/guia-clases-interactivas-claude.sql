-- Guía 75: Clases interactivas con voz en Claude Code (26 nov 2026). Correr en Supabase > SQL Editor.
-- Recurso gratuito del video "No le pidas resúmenes a Claude, pídele una clase" (palabra clave: CLASE).
-- Archivos ya subidos a Storage. Entra DESPUBLICADA (regla de siempre): no sale en el catálogo,
-- pero /r/clases-interactivas-claude y el visor funcionan por enlace directo, así que ManyChat ya sirve.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
select 'Clases interactivas con voz en Claude Code',
  'Un resumen se olvida en una semana; una clase que te explica, se detiene y te pone a resolver, se queda. Instala lo necesario para que Claude Code te arme clases con animaciones y voz natural gratis, en Mac o Windows.',
  0, true, false, false,
  '{"Claude","Formación","Creación de contenido"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1795743992000_clases-interactivas-claude.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1795743992000_clases-interactivas-claude.jpg',
  'clases-interactivas-claude'
where not exists (select 1 from public.guides where slug = 'clases-interactivas-claude');

-- Verificación: debe salir una fila con publicada = false
select titulo, slug, es_premium, publicada from public.guides where slug = 'clases-interactivas-claude';

-- El día del video, para que salga en el catálogo, correr también en Supabase > SQL Editor:
-- update public.guides set publicada = true where slug = 'clases-interactivas-claude';
