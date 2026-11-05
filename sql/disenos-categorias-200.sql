-- 200 Diseños: categorías propias de "Mis diseños" (29 oct 2026)
--
-- Hasta hoy la categoría era solo un texto dentro de cada diseño, así que una
-- categoría sin diseños no podía existir. Con esta tabla el alumno crea sus
-- categorías con el botón "Nueva categoría" y quedan aunque estén vacías.
-- Los diseños siguen guardando el nombre en user_disenos.categoria.
-- DDL: la corre Sergio en el editor SQL de Supabase. Idempotente.

create table if not exists public.user_diseno_categorias (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id  uuid not null,
  nombre      text not null,
  creado_en   timestamptz not null default now(),
  check (char_length(btrim(nombre)) between 1 and 60),
  unique (user_id, product_id, nombre)
);

alter table public.user_diseno_categorias enable row level security;

drop policy if exists "categorias propias" on public.user_diseno_categorias;
create policy "categorias propias" on public.user_diseno_categorias
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Desde el 30 oct 2026 las tablas nuevas no entran a la API sin GRANT explícito
grant select, insert, update, delete on public.user_diseno_categorias to authenticated;
grant select, insert, update, delete on public.user_diseno_categorias to service_role;
