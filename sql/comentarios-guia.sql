-- ═══ Comentarios en las guías ═══
-- Correr en el editor SQL de Supabase (con las pestañas del sitio cerradas).
-- Escritura solo por el servidor (vía /api/comentario, que valida y frena el
-- spam). Lectura para cualquier usuario con sesión. Borrado solo admin.

create table if not exists public.comentarios_guia (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nombre text,
  texto text not null,
  creado_en timestamptz not null default now()
);

create index if not exists comentarios_guia_por_guia
  on public.comentarios_guia (guide_id, creado_en desc);

alter table public.comentarios_guia enable row level security;

-- Sin política de INSERT para clientes: el navegador no puede escribir aquí
-- directo, todo pasa por el servidor.
create policy "usuarios leen comentarios" on public.comentarios_guia
  for select to authenticated using (true);

create policy "admin borra comentarios" on public.comentarios_guia
  for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));
