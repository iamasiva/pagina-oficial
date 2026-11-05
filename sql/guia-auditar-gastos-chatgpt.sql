-- Guía 59: Audita tus gastos con ChatGPT (2026-09-14). Recurso del video de
-- Martín "Le pasé mis gastos reales a ChatGPT" (palabra clave GASTOS).
-- Archivos ya subidos a Storage. Se inserta DESPUBLICADA (publicada = false):
-- no aparece en el catálogo ni en las vitrinas, pero el link directo
-- /r/auditar-gastos-chatgpt y el visor sí funcionan para revisarla.
-- El día del video: admin > editar la guía > marcar "Publicada" > guardar
-- (o correr el UPDATE del final). Los links de redes van después con UPDATE.

insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values
(
  'Audita tus gastos con ChatGPT',
  'No sabes a dónde se va tu plata cada mes, y tu banco ya tiene el archivo con la respuesta. Estos son los 4 prompts exactos para que ChatGPT lea tus movimientos, los separe en tres grupos y te arme un presupuesto realista, sin quitarte lo que disfrutas.',
  0, true, false, false,
  '{"ChatGPT","Finanzas","PRODUCTIVIDAD"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1789437560000_auditar-gastos-chatgpt.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1789437560000_auditar-gastos-chatgpt.jpg',
  'auditar-gastos-chatgpt'
);

-- Verificación: debe devolver la guía con su slug y publicada = false
select titulo, slug, es_premium, publicada from public.guides where slug = 'auditar-gastos-chatgpt';

-- El día del video (si prefieres SQL en vez del admin):
-- update public.guides set publicada = true where slug = 'auditar-gastos-chatgpt';
