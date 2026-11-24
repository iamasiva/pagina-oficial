-- Guía 74: Recrea cualquier app o página web con Craft Anything (24 nov 2026). Correr en Supabase > SQL Editor.
-- Recurso gratuito del video "Recrea cualquier app o página web con IA y gratis" (palabra clave: CRAFT).
-- Archivos ya subidos a Storage. Entra DESPUBLICADA (regla de siempre): no sale en el catálogo,
-- pero /r/craft-anything y el visor funcionan por enlace directo, así que ManyChat ya sirve.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
select 'Recrea cualquier app o página web con Craft Anything',
  '¿La app que te gusta es de pago o no hace justo lo que necesitas? Craft Anything la estudia y construye tu propia versión con la IA que ya pagas. Aquí tienes la instalación y el uso, paso a paso y con animaciones.',
  0, true, false, false,
  '{"Desarrollo","Coding","Codex"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1795564515000_craft-anything.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1795564554000_craft-anything.jpg',
  'craft-anything'
where not exists (select 1 from public.guides where slug = 'craft-anything');

-- Verificación: debe salir una fila con publicada = false
select titulo, slug, es_premium, publicada from public.guides where slug = 'craft-anything';

-- El día del video, para que salga en el catálogo, correr también en Supabase > SQL Editor:
-- update public.guides set publicada = true where slug = 'craft-anything';
