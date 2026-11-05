-- Guía 60: Convierte a Gemini en tu profesor personal (2026-09-17). Recurso del
-- video "4 formas de aprender gratis con Google" (palabra clave PROFE).
-- Archivos ya subidos a Storage. Se inserta DESPUBLICADA (publicada = false):
-- no aparece en el catálogo ni en las vitrinas, pero el link directo
-- /r/gemini-profesor-personal y el visor sí funcionan para revisarla.
-- El día del video: admin > editar la guía > marcar "Publicada" > guardar
-- (o correr el UPDATE del final). Los links de redes van después con UPDATE.

insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values
(
  'Convierte a Gemini en tu profesor personal',
  'Puedes compartirle la pantalla a Gemini, seguir el video perfecto y salir sin aprender nada, porque la IA te lo hizo todo. Esta guía enseña cómo hablarle a las cuatro formas de aprender gratis con Google, con los prompts y las frases exactas.',
  0, true, false, false,
  '{"Gemini","Formación","NotebookLM"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1789650581000_gemini-profesor-personal.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1789650581000_gemini-profesor-personal.jpg',
  'gemini-profesor-personal'
);

-- Verificación: debe devolver la guía con su slug y publicada = false
select titulo, slug, es_premium, publicada from public.guides where slug = 'gemini-profesor-personal';

-- El día del video (si prefieres SQL en vez del admin):
-- update public.guides set publicada = true where slug = 'gemini-profesor-personal';
