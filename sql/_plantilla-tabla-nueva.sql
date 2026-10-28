-- PLANTILLA para cualquier tabla o función nueva en el esquema public.
--
-- Desde el 30 de octubre de 2026 Supabase ya no expone automáticamente las tablas
-- nuevas a la API (PostgREST, supabase-js, curl a /rest/v1). Sin un GRANT explícito,
-- la API responde 42501 "permission denied for table ..." para anon, authenticated y
-- también service_role (la clave secreta que usan el webhook y los scripts).
-- Las tablas que ya existían conservan sus permisos. Más detalle:
-- https://github.com/orgs/supabase/discussions/45329
--
-- Regla de la casa: GRANT + RLS + políticas van juntos en el mismo archivo.

-- 1) La tabla
create table if not exists public.mi_tabla (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dato       text not null,
  creado_en  timestamptz not null default now()
);

-- 2) Permisos de API (sin esto la tabla no existe para supabase-js ni para curl)
grant select, insert, update, delete on public.mi_tabla to authenticated;
grant select, insert, update, delete on public.mi_tabla to service_role;
-- grant select on public.mi_tabla to anon;   -- solo si la página pública debe leerla
-- Si la tabla usa serial o identity (no uuid), también la secuencia:
-- grant usage, select on all sequences in schema public to authenticated, service_role;

-- 3) RLS y políticas (los GRANT dicen si el rol entra; RLS dice qué filas ve)
alter table public.mi_tabla enable row level security;
drop policy if exists "mi_tabla: propias" on public.mi_tabla;
create policy "mi_tabla: propias" on public.mi_tabla
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) Funciones (RPC): también necesitan permiso explícito de ejecución
-- create or replace function public.mi_funcion(p uuid) returns boolean
-- language sql stable security definer set search_path = public as $$ select true $$;
-- revoke all on function public.mi_funcion(uuid) from public;
-- grant execute on function public.mi_funcion(uuid) to authenticated;

-- 5) Verificación rápida (debe listar la tabla con sus roles)
-- select grantee, privilege_type from information_schema.role_table_grants
--  where table_schema = 'public' and table_name = 'mi_tabla';
