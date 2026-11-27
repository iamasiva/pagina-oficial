-- Básico "Crea tu propio asistente con las skills de Gemini" (27 nov 2026).
-- REGISTRO: este cambio YA está aplicado en la base. No hay que correr nada.
-- La guía vieja "Crea tu propio asistente de IA con Gemini Gems" se reescribió como básico de skills
-- porque Google convirtió las Gems en skills (habilidades). Es la misma fila, con título, descripción,
-- contenido, portada y slug nuevos. La fila no tenía slug: ahora tiene landing en /r/skills-de-gemini.
-- Este es el cambio equivalente, por si hay que repetirlo en Supabase > SQL Editor:
update public.guides set
  titulo = 'Crea tu propio asistente con las skills de Gemini',
  descripcion = 'Si cada vez que abres Gemini le explicas lo mismo, estás repitiendo trabajo. Una skill guarda tus instrucciones una sola vez. Aquí creas la primera paso a paso, con animaciones, y la pruebas en un chat. Las Gems ahora son skills.',
  contenido_url = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1795793899000_skills-de-gemini.html',
  portada_url = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1795796622000_skills-de-gemini.jpg',
  slug = 'skills-de-gemini'
where id = '69e1d0ce-01f7-4432-b988-9edb78f663b2';

-- Verificación: debe salir una fila publicada con el slug skills-de-gemini
select titulo, slug, es_premium, publicada from public.guides where id = '69e1d0ce-01f7-4432-b988-9edb78f663b2';

-- Para volver a la versión vieja (la de Gems), correr en Supabase > SQL Editor:
-- update public.guides set
--   titulo = 'Crea tu propio asistente de IA con Gemini Gems',
--   descripcion = 'Si repites las mismas instrucciones cada vez que abres Gemini, estás perdiendo tiempo. Una Gem se configura una vez y queda lista para siempre, con tu tono, tus documentos y tu forma de trabajar. Aquí aprendes a crearla y ves ejemplos listos para copiar.',
--   contenido_url = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1786124402452_crea-tu-propio-asistente-de-ia-con-gemini-gems.html',
--   portada_url = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1786124402452_crea-tu-propio-asistente-de-ia-con-gemini-gems.jpg',
--   slug = null
-- where id = '69e1d0ce-01f7-4432-b988-9edb78f663b2';
