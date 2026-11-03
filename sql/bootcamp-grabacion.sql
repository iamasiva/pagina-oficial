-- Grabación de cada clase del bootcamp en la propia página (YouTube no listado, embebido),
-- además de la lección en Hotmart. La corre Sergio en el editor SQL de Supabase.
-- La tabla ya tiene RLS y grants (sql/bootcamp-clases.sql); una columna nueva no necesita más.
alter table public.bootcamp_clases add column if not exists grabacion_url text;
comment on column public.bootcamp_clases.grabacion_url is 'Link de YouTube (no listado) de la grabación; la página de clase lo embebe cuando el estado es evergreen_ready';
