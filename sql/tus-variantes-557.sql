-- Mejora "Tus variantes" del 557: el usuario guarda sus situaciones una vez
-- y las reutiliza en cualquier configuracion del catalogo desde el desplegable
-- de variante. Cada fila es privada de su dueño (RLS por auth.uid()).

create table public.user_variantes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null,
  nombre text not null,
  situacion text not null,
  created_at timestamptz not null default now()
);

alter table public.user_variantes enable row level security;

create policy "variantes propias: leer" on public.user_variantes
  for select using (auth.uid() = user_id);
create policy "variantes propias: crear" on public.user_variantes
  for insert with check (auth.uid() = user_id);
create policy "variantes propias: editar" on public.user_variantes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "variantes propias: borrar" on public.user_variantes
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_variantes to authenticated;

-- Verificacion: la tabla existe y RLS esta activo (rowsecurity = true)
select relname, relrowsecurity from pg_class where relname = 'user_variantes';
