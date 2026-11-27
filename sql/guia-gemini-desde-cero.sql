-- Básico "Gemini desde cero" (27 nov 2026). Correr en Supabase > SQL Editor.
-- Primer básico construido con el ciclo planificar, ejecutar, revisar (plan 01).
-- Archivos ya subidos a Storage. Entra DESPUBLICADA (regla de siempre): no sale en el catálogo,
-- pero /r/gemini-desde-cero y ver-recurso.html?r=gemini-desde-cero funcionan por enlace directo.
-- El slug no se cambia nunca: las demás guías van a enlazar a este básico.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
select 'Gemini desde cero',
  'Abrir una IA por primera vez intimida: nadie te dice por dónde empezar ni qué es cada botón. Aquí entras a Gemini, tienes tu primera conversación útil y aprendes dónde está cada cosa, paso a paso y con animaciones.',
  0, true, false, false,
  '{"Gemini","Formación"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1795808829000_gemini-desde-cero.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1795800127000_gemini-desde-cero.jpg',
  'gemini-desde-cero'
where not exists (select 1 from public.guides where slug = 'gemini-desde-cero');

-- Verificación: debe salir una fila con publicada = false
select titulo, slug, es_premium, publicada from public.guides where slug = 'gemini-desde-cero';

-- Cuando quieras que salga en el catálogo, correr también en Supabase > SQL Editor:
-- update public.guides set publicada = true where slug = 'gemini-desde-cero';
