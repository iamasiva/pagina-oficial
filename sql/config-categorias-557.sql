-- 557 Configuraciones: categorías propias de "Mis configuraciones" (4 nov 2026)
--
-- Hasta hoy la categoría era solo un texto dentro de cada configuración guardada
-- (user_configs.categoria), así que una categoría sin configuraciones no podía
-- existir y no había botón para crearla. Con esta tabla el alumno crea sus
-- categorías con el botón "Crear categoría" y quedan aunque estén vacías.
-- Las configuraciones siguen guardando el nombre en user_configs.categoria.
-- Mismo patrón que user_diseno_categorias del 200 (sql/disenos-categorias-200.sql).
-- DDL: la corre Sergio en el editor SQL de Supabase. Idempotente.

create table if not exists public.user_config_categorias (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id  uuid not null,
  nombre      text not null,
  creado_en   timestamptz not null default now(),
  check (char_length(btrim(nombre)) between 1 and 60),
  unique (user_id, product_id, nombre)
);

alter table public.user_config_categorias enable row level security;

drop policy if exists "categorias propias" on public.user_config_categorias;
create policy "categorias propias" on public.user_config_categorias
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Desde el 30 oct 2026 las tablas nuevas no entran a la API sin GRANT explícito
grant select, insert, update, delete on public.user_config_categorias to authenticated;
grant select, insert, update, delete on public.user_config_categorias to service_role;

-- Verificación: la tabla existe, tiene RLS y los dos roles tienen permisos
select relname, relrowsecurity from pg_class where relname = 'user_config_categorias';
select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'user_config_categorias';
