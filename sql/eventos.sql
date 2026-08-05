-- ═══ Eventos del embudo de ventas: visitas, clics de compra y resumen del panel ═══
-- Correr completo en el editor SQL de Supabase (con las pestañas del sitio cerradas).

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('visita_sitio','visita_landing','clic_comprar')),
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now()
);

create index if not exists eventos_tipo_idx on public.eventos (tipo, creado_en desc);
create index if not exists eventos_producto_idx on public.eventos (product_id, creado_en desc) where product_id is not null;

alter table public.eventos enable row level security;

-- Cualquier visitante (incluso sin cuenta) registra eventos; nunca a nombre de otro
create policy "registrar evento" on public.eventos
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- Solo el admin los lee
create policy "admin lee eventos" on public.eventos
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));

-- Resumen del embudo para el panel del admin. Las "ventas" son compras
-- APROBADAS pagadas de verdad (el desbloqueo interno del bundle no cuenta).
create or replace function public.panel_resumen()
returns json
language sql
security definer
set search_path = public
as $$
  select case when exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.es_admin)
  then json_build_object(
    'visitas_sitio',   (select count(*) from public.eventos where tipo = 'visita_sitio'),
    'registros',       (select count(*) from public.profiles),
    'visitas_landing', (select count(*) from public.eventos where tipo = 'visita_landing'),
    'clics_comprar',   (select count(*) from public.eventos where tipo = 'clic_comprar'),
    'ventas',          (select count(*) from public.purchases where estado = 'APROBADA' and gateway <> 'bundle'),
    'productos', (select coalesce(json_agg(fila), '[]'::json) from (
        select p.id, p.nombre,
          (select count(*) from public.eventos e where e.tipo = 'visita_landing' and e.product_id = p.id) as visitas,
          (select count(*) from public.eventos e where e.tipo = 'clic_comprar' and e.product_id = p.id) as clics,
          (select count(*) from public.purchases c where c.product_id = p.id and c.estado = 'APROBADA' and c.gateway <> 'bundle') as compras
        from public.products p
        where p.activo
        order by p.nombre
      ) fila)
  ) else null end;
$$;

grant execute on function public.panel_resumen() to authenticated;
