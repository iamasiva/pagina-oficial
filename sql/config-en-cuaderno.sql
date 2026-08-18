-- Mejoras 557 (pre-lanzamiento): correr UNA vez en el editor SQL de Supabase.
-- IMPORTANTE: cerrar las pestañas del sitio antes de correr (evita deadlock con ALTER).

-- 1) Cada cuaderno puede tener UNA configuración guardada asignada.
--    Si el usuario borra esa configuración, el cuaderno queda sin config (set null).
alter table public.user_cuadernos
  add column if not exists config_id uuid references public.user_configs(id) on delete set null;

-- 2) Los chats pueden existir sin link: los que importa el Arquitecto nacen
--    "pendientes" y el usuario pega el link cuando cree el chat real en Gemini.
alter table public.user_cuaderno_chats
  alter column url drop not null;
