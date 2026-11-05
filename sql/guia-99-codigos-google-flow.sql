-- Guía 57: 99 códigos para Google Flow (2026-09-10).
-- Archivos ya subidos a Storage. Se inserta DESPUBLICADA (publicada = false):
-- no aparece en el catálogo ni en las vitrinas, pero el link directo
-- /r/99-codigos-google-flow y el visor sí funcionan para revisarla.
-- El día del video: admin > editar la guía > marcar "Publicada" > guardar
-- (o correr el UPDATE del final). Los links de redes van después con UPDATE.

insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values
(
  '99 códigos para Google Flow',
  'Escribir "que la cámara gire" en Google Flow no es lo mismo que darle la instrucción exacta. Aquí tienes 99 códigos de cámara, luz, color y encuadre, cada uno con el prompt que Flow sí entiende, listos para copiar y combinar.',
  0, true, false, false,
  '{"Google Flow","Video y animación","Creación de contenido"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1789067513000_99-codigos-google-flow.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1789067513000_99-codigos-google-flow.jpg',
  '99-codigos-google-flow'
);

-- Verificación: debe devolver la guía con su slug y publicada = false
select titulo, slug, es_premium, publicada from public.guides where slug = '99-codigos-google-flow';

-- El día del video (si prefieres SQL en vez del admin):
-- update public.guides set publicada = true where slug = '99-codigos-google-flow';

-- 2026-09-11: v2 del HTML (lo copiado lleva el código al frente y el armador
-- arma una línea por código). Ya aplicado por API con service role:
-- update public.guides set contenido_url = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1789146952000_99-codigos-google-flow-v2.html' where slug = '99-codigos-google-flow';
