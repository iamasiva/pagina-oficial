-- ═══ Aperturas de recursos: tendencias reales + panel del admin ═══
-- Correr completo en el editor SQL de Supabase (con las pestañas del sitio cerradas).

create table if not exists public.aperturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  guide_id uuid references public.guides(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  abierta_en timestamptz not null default now(),
  constraint apertura_con_destino check (guide_id is not null or product_id is not null)
);

create index if not exists aperturas_guide_idx on public.aperturas (guide_id, abierta_en desc);
create index if not exists aperturas_product_idx on public.aperturas (product_id, abierta_en desc);
create index if not exists aperturas_fecha_idx on public.aperturas (abierta_en desc);

alter table public.aperturas enable row level security;

-- Cada usuario registra solo sus propias aperturas
create policy "insertar apertura propia" on public.aperturas
  for insert to authenticated
  with check (user_id = auth.uid());

-- Solo el admin puede leerlas (para el panel)
create policy "admin lee aperturas" on public.aperturas
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));

-- Conteos SOLO agregados (sin datos de nadie) para ordenar Tendencias:
-- la vista corre como su dueño y expone únicamente guide_id + total de 30 días.
-- Las aperturas de recursos premium cuentan para la guía de su producto.
create or replace view public.tendencias_guias as
  select coalesce(a.guide_id, p.guide_id) as guide_id,
         count(*)::bigint as aperturas
  from public.aperturas a
  left join public.products p on p.id = a.product_id
  where coalesce(a.guide_id, p.guide_id) is not null
    and a.abierta_en > now() - interval '30 days'
  group by 1;

grant select on public.tendencias_guias to anon, authenticated;

-- Resumen para el panel del admin: por recurso, últimas 24 h / 7 días / 30 días / total.
-- security definer con verificación explícita de admin adentro: a cualquier
-- otro usuario le devuelve cero filas.
create or replace function public.panel_aperturas()
returns table (guide_id uuid, titulo text, ultimas24h bigint, dias7 bigint, dias30 bigint, total bigint)
language sql
security definer
set search_path = public
as $$
  select g.id, g.titulo,
         count(*) filter (where a.abierta_en > now() - interval '24 hours'),
         count(*) filter (where a.abierta_en > now() - interval '7 days'),
         count(*) filter (where a.abierta_en > now() - interval '30 days'),
         count(*)
  from public.aperturas a
  left join public.products p on p.id = a.product_id
  join public.guides g on g.id = coalesce(a.guide_id, p.guide_id)
  where exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.es_admin)
  group by g.id, g.titulo
  order by 5 desc;
$$;

grant execute on function public.panel_aperturas() to authenticated;
