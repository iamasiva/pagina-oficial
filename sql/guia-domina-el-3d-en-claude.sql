-- Guía 71: Domina el 3D en Claude (14 nov 2026). Correr en Supabase > SQL Editor.
-- Recurso gratuito del video "Visuales 3D para Claude nivel pro" (palabra clave: 3D).
-- Archivos ya subidos a Storage. Sergio pidió publicarla de una vez, así que entra
-- PUBLICADA: sale en el catálogo y la landing /r/domina-el-3d-en-claude queda viva.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
select 'Domina el 3D en Claude',
  'El 3D de Claude sirve para mucho más que videos, pero casi nadie sabe qué instalar ni cómo pedirlo. Aquí tienes el kit completo y cómo hacer videos, manuales, presentaciones y páginas web en 3D que se pueden mover y explorar.',
  0, true, false, true,
  '{"Claude","Imagen y diseño","Video y animación"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1794667064000_domina-el-3d-en-claude.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1794667064000_domina-el-3d-en-claude.jpg',
  'domina-el-3d-en-claude'
where not exists (select 1 from public.guides where slug = 'domina-el-3d-en-claude');

-- Verificación: debe salir una fila con publicada = true
select titulo, slug, es_premium, publicada from public.guides where slug = 'domina-el-3d-en-claude';

-- Si prefieres revisarla antes por enlace directo, despublícala con esto y vuelve a
-- encenderla cambiando false por true:
-- update public.guides set publicada = false where slug = 'domina-el-3d-en-claude';
