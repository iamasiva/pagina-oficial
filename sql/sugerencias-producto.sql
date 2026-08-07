-- ═══ Sugerencias de mejora POR PRODUCTO ("Ayúdanos a mejorar") ═══
-- Correr en el editor SQL de Supabase (con las pestañas del sitio cerradas).
-- Solo el servidor escribe (vía /api/sugerencia con product_id); solo el
-- admin las lee, y por ahora se consultan directo en Supabase (sin panel).

create table if not exists public.sugerencias_producto (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  product_id uuid not null references public.products(id) on delete cascade,
  texto text not null,
  creada_en timestamptz not null default now()
);

alter table public.sugerencias_producto enable row level security;

-- Sin política de INSERT para clientes: el navegador no puede escribir aquí
-- directo, todo pasa por el servidor (que valida y frena el spam).
create policy "admin lee sugerencias de producto" on public.sugerencias_producto
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));
