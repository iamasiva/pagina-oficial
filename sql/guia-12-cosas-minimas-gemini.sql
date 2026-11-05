-- Guía 58: 12 cosas mínimas que ya deberías hacer con Gemini (2026-09-10).
-- Archivos ya subidos a Storage. Se inserta DESPUBLICADA (publicada = false):
-- no aparece en el catálogo ni en las vitrinas, pero el link directo
-- /r/12-cosas-minimas-gemini y el visor sí funcionan para revisarla.
-- El día del video: admin > editar la guía > marcar "Publicada" > guardar
-- (o correr el UPDATE del final). Los links de redes van después con UPDATE.

insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values
(
  '12 cosas mínimas que ya deberías hacer con Gemini',
  'Abres Gemini, preguntas algo, lees y cierras. Eso es usarlo como buscador. Estas son las 12 cosas mínimas que ya deberías estar haciendo con él, cada una con dónde está, cómo se hace en 3 pasos y un prompt listo para copiar.',
  0, true, false, false,
  '{"Gemini","PRODUCTIVIDAD"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1789080223000_12-cosas-minimas-gemini.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1789072554000_12-cosas-minimas-gemini.jpg',
  '12-cosas-minimas-gemini'
);

-- Verificación: debe devolver la guía con su slug y publicada = false
select titulo, slug, es_premium, publicada from public.guides where slug = '12-cosas-minimas-gemini';

-- El día del video (si prefieres SQL en vez del admin):
-- update public.guides set publicada = true where slug = '12-cosas-minimas-gemini';
