-- ═══ Sugerencias de recursos de los usuarios ═══
-- Correr en el editor SQL de Supabase (con las pestañas del sitio cerradas).
-- Solo el servidor escribe (vía /api/sugerencia); solo el admin las lee.

create table if not exists public.sugerencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  texto text not null,
  creada_en timestamptz not null default now()
);

alter table public.sugerencias enable row level security;

-- Sin política de INSERT para clientes: el navegador no puede escribir aquí
-- directo, todo pasa por el servidor (que valida y frena el spam).
create policy "admin lee sugerencias" on public.sugerencias
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));
