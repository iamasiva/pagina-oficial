-- Básico "Google Flow desde cero" (27 nov 2026). Plan 03 del ciclo planificar, ejecutar, revisar.
-- NO es un alta: reemplaza en la misma fila a la guía vieja "Genera imágenes y videos gratis con Google Flow"
-- (id 736a6a8e-3aa6-4454-8924-ffbcb9f34730, publicada, sin slug). Archivos ya subidos a Storage.
-- Este cambio lo aplica quien revisa, por REST, después de aprobar. Este archivo queda como registro.
-- Si se quisiera hacer a mano, sería en Supabase > SQL Editor.
-- El slug nuevo no se cambia nunca: las demás guías van a enlazar a este básico.
update public.guides set
  titulo = 'Google Flow desde cero',
  slug = 'google-flow-desde-cero',
  descripcion = 'Ves imágenes y videos hechos con IA por todas partes y crees que eso es para expertos o que hay que pagar. Google Flow te da créditos gratis cada día. Aquí haces tu primera imagen, la pones en movimiento y aprendes cuánto cuesta cada cosa antes de pedirla.',
  categorias = '{"Google Flow","Video y animación","Imagen y diseño","Formación"}',
  contenido_url = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1795812459000_google-flow-desde-cero.html',
  portada_url = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1795812459000_google-flow-desde-cero.jpg'
where id = '736a6a8e-3aa6-4454-8924-ffbcb9f34730';

-- Verificación
select titulo, slug, publicada, contenido_url from public.guides where id = '736a6a8e-3aa6-4454-8924-ffbcb9f34730';

-- Para volver atrás (valores del 27 nov 2026, antes del cambio):
-- update public.guides set
--   titulo = 'Genera imágenes y videos gratis con Google Flow',
--   slug = null,
--   descripcion = 'Google juntó sus mejores modelos de imagen y video en un mismo estudio, y se puede usar gratis todos los días. Aquí aprendes a generar imágenes, crear videos con sonido a partir de texto y darle movimiento a tus propias fotos.',
--   categorias = '{"Google Flow","Imagen y diseño","Video y animación"}',
--   contenido_url = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1786124387196_genera-imagenes-y-videos-gratis-con-google-flow.html',
--   portada_url = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1786124387196_genera-imagenes-y-videos-gratis-con-google-flow.jpg'
-- where id = '736a6a8e-3aa6-4454-8924-ffbcb9f34730';
