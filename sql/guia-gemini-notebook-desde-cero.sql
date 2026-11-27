-- Básico "Gemini Notebook desde cero" (27 nov 2026). Correr en Supabase > SQL Editor.
-- Segundo básico del ciclo planificar, ejecutar, revisar (plan 02).
-- Archivos ya subidos a Storage. Entra DESPUBLICADA (regla de siempre): no sale en el catálogo,
-- pero /r/gemini-notebook-desde-cero y ver-recurso.html?r=gemini-notebook-desde-cero funcionan por enlace directo.
-- El slug no se cambia nunca: las demás guías van a enlazar a este básico.
-- Ya corrido por Sergio el 27 nov 2026 (fila publicada). Tras la revisión, contenido_url apunta a la versión
-- corregida; el cambio se hizo por REST y este archivo queda como registro.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
select 'Gemini Notebook desde cero',
  'Le preguntas a una IA por tus propios documentos y te responde con lo que encontró en internet. Un cuaderno de Gemini Notebook responde solo con lo tuyo y te muestra de dónde lo sacó. Aquí creas el primero, paso a paso y con animaciones.',
  0, true, false, false,
  '{"Gemini","NotebookLM","Formación"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1795808829000_gemini-notebook-desde-cero.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1795808113000_gemini-notebook-desde-cero.jpg',
  'gemini-notebook-desde-cero'
where not exists (select 1 from public.guides where slug = 'gemini-notebook-desde-cero');

-- Verificación: debe salir una fila con publicada = false
select titulo, slug, es_premium, publicada from public.guides where slug = 'gemini-notebook-desde-cero';

-- Cuando quieras que salga en el catálogo, correr también en Supabase > SQL Editor:
-- update public.guides set publicada = true where slug = 'gemini-notebook-desde-cero';
