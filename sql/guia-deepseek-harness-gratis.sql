-- Guía 70: Usa DeepSeek Harness con modelos gratuitos (video del 11 nov 2026, palabra clave DEEPSEEK).
-- Correr en Supabase > SQL Editor (no en la terminal). Archivos ya subidos a Storage.
-- Entra DESPUBLICADA: no sale en el catálogo, pero /r/deepseek-harness-gratis y el visor
-- funcionan por link directo para revisarla.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values ('Usa DeepSeek Harness con modelos gratuitos',
  'Pagar varias suscripciones no es la única forma de trabajar con agentes de IA. Monta DeepSeek Harness con modelos gratuitos: varias APIs en un solo combo que se respaldan entre sí y 7 herramientas para construir, con su prompt.',
  0, true, false, false,
  '{"Deepseek","Automatización","LLM"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1794362824000_deepseek-harness-gratis.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1794361412000_deepseek-harness-gratis.jpg',
  'deepseek-harness-gratis');

select titulo, slug, es_premium, publicada from public.guides where slug = 'deepseek-harness-gratis';

-- El día del video (11 nov), para publicarla, correr también en Supabase > SQL Editor:
-- update public.guides set publicada = true where slug = 'deepseek-harness-gratis';
