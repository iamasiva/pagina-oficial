-- Guía 66: Gemini 4 Argon: todo lo que debes saber para aprovecharlo (14 oct 2026). Archivos ya subidos a Storage.
-- Queda SIN publicar (publicada = false): no sale en catálogo ni vitrinas, pero /r/gemini-4-argon y el visor
-- funcionan por link directo para revisarla. El día del video se enciende desde el admin (editar guía > "Publicada")
-- o con el UPDATE comentado al final.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values ('Gemini 4 Argon: todo lo que debes saber para aprovecharlo',
  'Google lanzó Gemini 4 Argon y la mayoría va a seguir usándolo como un chat más, sin tocar lo nuevo: encargos largos que trabaja solo mientras haces otra cosa, imágenes que se convierten en apps, skills que lo hacen trabajar a tu manera y conexiones con otras aplicaciones. Esta guía explica qué cambió, con fechas y fuentes, qué mejoró según Google y lo que probamos nosotros, y te deja 7 técnicas con plantillas listas para copiar y un generador de encargos para el modo Task. Gratis y sin programar.',
  0, true, false, false,
  '{"Gemini","LLM","PRODUCTIVIDAD"}',
  'https://api.iamasiva.co/storage/v1/object/public/contenido/1791984719000_gemini-4-argon.html',
  'https://api.iamasiva.co/storage/v1/object/public/portadas/1791984719000_gemini-4-argon.jpg',
  'gemini-4-argon');
select titulo, slug, es_premium, publicada from public.guides where slug = 'gemini-4-argon';

-- El día del video:
-- update public.guides set publicada = true where slug = 'gemini-4-argon';
