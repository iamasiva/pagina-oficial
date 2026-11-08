-- Bootcamp: transcripción en PDF de cada clase y progreso de los ejercicios (8 nov 2026).
-- Correr completo en Supabase > SQL Editor.

-- 1) Enlace del PDF de la transcripción en cada clase. El botón "Descargar transcripción"
--    de bootcamp-clase.html aparece cuando la clase tiene este enlace.
--    La tabla ya tiene RLS y grants (sql/bootcamp-clases.sql); una columna nueva no necesita más.
alter table public.bootcamp_clases add column if not exists transcripcion_url text;

-- 2) Progreso de los recursos con ejercicios que se chulean (ejercicios-clase-1, -2, -3).
--    Una fila por ejercicio terminado: el progreso queda en la cuenta del alumno,
--    igual en el celular y en el computador, y nunca vuelve a cero.
create table if not exists public.user_recurso_progreso (
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recurso   text not null,   -- slug de la guía (ejercicios-clase-1, ...)
  item      text not null,   -- id del ejercicio dentro del recurso
  hecho_en  timestamptz not null default now(),
  primary key (user_id, recurso, item)
);

grant select, insert, update, delete on public.user_recurso_progreso to authenticated;
grant select, insert, update, delete on public.user_recurso_progreso to service_role;

alter table public.user_recurso_progreso enable row level security;
drop policy if exists "progreso: propio" on public.user_recurso_progreso;
create policy "progreso: propio" on public.user_recurso_progreso
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Verificación: debe listar authenticated y service_role con sus permisos
select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'user_recurso_progreso';
