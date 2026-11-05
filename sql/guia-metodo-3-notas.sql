-- Guía 56: El método de las 3 notas para Gemini Notebook (2026-09-05).
-- Archivos ya subidos a Storage. Al insertarla queda publicada en el catálogo
-- y con la landing /r/metodo-3-notas viva (los links de ManyChat apuntan ahí).
-- Los links de redes se agregan después con UPDATE cuando el video esté publicado.

insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values
(
  'El método de las 3 notas para Gemini Notebook',
  'Tu cuaderno de Gemini Notebooks te omite datos, responde con la fuente equivocada y te diluye las respuestas. No es por la cantidad de fuentes, es por el desorden. Este método de 3 notas por categoría lo arregla en 5 pasos.',
  0, true, false, true,
  '{"Gemini","NotebookLM","PRODUCTIVIDAD"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1788620832000_metodo-3-notas.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1788620832000_metodo-3-notas.jpg',
  'metodo-3-notas'
);

-- Verificación: debe devolver la guía con su slug y las dos URLs
select titulo, slug, es_premium, publicada from public.guides where slug = 'metodo-3-notas';
