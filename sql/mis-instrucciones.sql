-- "Mis instrucciones" de las bibliotecas del bootcamp (hoy: 61 instrucciones
-- para imágenes). Cada alumno guarda las instrucciones que le crea la skill,
-- pegando el bloque de código que ella le entrega, y las ordena en sus propias
-- categorías. Cada fila es privada de su dueño (RLS por auth.uid()).
-- DDL: la corre Sergio en el editor SQL de Supabase. Idempotente.

create table if not exists public.user_instruccion_categorias (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recurso    text not null,                       -- slug de la guía (61-instrucciones-para-imagenes)
  nombre     text not null,
  creado_en  timestamptz not null default now(),
  check (char_length(btrim(nombre)) between 1 and 60)
);

create table if not exists public.user_instrucciones (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recurso        text not null,
  categoria_id   uuid references public.user_instruccion_categorias(id) on delete set null,
  titulo         text not null,
  datos          jsonb not null,                  -- {desc, attachment, entrega{kind,detail,tool,action}, instructions{es,en}}
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (char_length(btrim(titulo)) between 1 and 120)
);

create index if not exists user_instrucciones_user_recurso_idx
  on public.user_instrucciones (user_id, recurso, creado_en desc);
create index if not exists user_instruccion_categorias_user_recurso_idx
  on public.user_instruccion_categorias (user_id, recurso);

alter table public.user_instruccion_categorias enable row level security;
alter table public.user_instrucciones enable row level security;

drop policy if exists "categorias propias" on public.user_instruccion_categorias;
create policy "categorias propias" on public.user_instruccion_categorias
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "instrucciones propias" on public.user_instrucciones;
create policy "instrucciones propias" on public.user_instrucciones
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.user_instruccion_categorias to authenticated;
grant select, insert, update, delete on public.user_instrucciones to authenticated;

-- Verificación: las dos tablas existen y tienen RLS activo (relrowsecurity = true).
select relname, relrowsecurity from pg_class
 where relname in ('user_instruccion_categorias', 'user_instrucciones');
