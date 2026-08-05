-- ═══ Categorías administrables (con tipo) + filtro de fechas del panel ═══
-- Correr completo en el editor SQL de Supabase (con las pestañas del sitio cerradas).

-- ── Categorías: el admin las gestiona desde el formulario de guías ──
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  tipo text not null default 'area' check (tipo in ('herramienta', 'area')),
  creada_en timestamptz not null default now()
);

alter table public.categorias enable row level security;

create policy "categorias visibles" on public.categorias
  for select to anon, authenticated using (true);

create policy "admin gestiona categorias" on public.categorias
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));

insert into public.categorias (nombre, tipo) values
  ('LLM', 'herramienta'),
  ('NotebookLM', 'herramienta'),
  ('Imagen y diseño', 'area'),
  ('Video y animación', 'area'),
  ('Audio, voz y música', 'area'),
  ('Investigación', 'area'),
  ('Coding', 'area'),
  ('Automatización', 'area'),
  ('Marketing', 'area'),
  ('Atención al cliente', 'area'),
  ('Finanzas', 'area'),
  ('Desarrollo', 'area'),
  ('Análisis de datos', 'area'),
  ('Creación de contenido', 'area')
on conflict (nombre) do nothing;

-- ── Panel con fechas: mismas funciones, ahora aceptan desde/hasta ──
-- Las fechas se interpretan como días de Colombia (America/Bogota) y el
-- "hasta" es inclusivo. Sin fechas: todo el tiempo, como antes.

drop function if exists public.panel_aperturas();
drop function if exists public.panel_aperturas(date, date);
create or replace function public.panel_aperturas(p_desde date default null, p_hasta date default null)
returns table (guide_id uuid, titulo text, ultimas24h bigint, dias7 bigint, dias30 bigint, total bigint, favoritos bigint)
language sql
security definer
set search_path = public
as $$
  select g.id, g.titulo,
         count(a.id) filter (where a.abierta_en > now() - interval '24 hours'),
         count(a.id) filter (where a.abierta_en > now() - interval '7 days'),
         count(a.id) filter (where a.abierta_en > now() - interval '30 days'),
         count(a.id),
         (select count(*) from public.user_guia_favoritos f where f.guide_id = g.id)
  from public.guides g
  left join public.products p on p.guide_id = g.id
  left join public.aperturas a on (a.guide_id = g.id or a.product_id = p.id)
    and (p_desde is null or a.abierta_en >= (p_desde::timestamp at time zone 'America/Bogota'))
    and (p_hasta is null or a.abierta_en < ((p_hasta + 1)::timestamp at time zone 'America/Bogota'))
  where exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.es_admin)
  group by g.id, g.titulo
  order by 6 desc;
$$;

grant execute on function public.panel_aperturas(date, date) to authenticated;

drop function if exists public.panel_resumen();
drop function if exists public.panel_resumen(date, date);
create or replace function public.panel_resumen(p_desde date default null, p_hasta date default null)
returns json
language sql
security definer
set search_path = public
as $$
  with limites as (
    select
      case when p_desde is null then null else (p_desde::timestamp at time zone 'America/Bogota') end as d,
      case when p_hasta is null then null else ((p_hasta + 1)::timestamp at time zone 'America/Bogota') end as h
  )
  select case when exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.es_admin)
  then json_build_object(
    'visitas_sitio',   (select count(*) from public.eventos e, limites l where e.tipo = 'visita_sitio' and (l.d is null or e.creado_en >= l.d) and (l.h is null or e.creado_en < l.h)),
    'registros',       (select count(*) from public.profiles pf, limites l where (l.d is null or pf.created_at >= l.d) and (l.h is null or pf.created_at < l.h)),
    'visitas_landing', (select count(*) from public.eventos e, limites l where e.tipo = 'visita_landing' and (l.d is null or e.creado_en >= l.d) and (l.h is null or e.creado_en < l.h)),
    'clics_comprar',   (select count(*) from public.eventos e, limites l where e.tipo = 'clic_comprar' and (l.d is null or e.creado_en >= l.d) and (l.h is null or e.creado_en < l.h)),
    'ventas',          (select count(*) from public.purchases c, limites l where c.estado = 'APROBADA' and c.gateway <> 'bundle' and (l.d is null or c.purchased_at >= l.d) and (l.h is null or c.purchased_at < l.h)),
    'ventas_usd_centavos', (select coalesce(sum(c.monto_usd_centavos), 0) from public.purchases c, limites l where c.estado = 'APROBADA' and c.gateway <> 'bundle' and (l.d is null or c.purchased_at >= l.d) and (l.h is null or c.purchased_at < l.h)),
    'ventas_cop_centavos', (select coalesce(sum(c.monto_centavos), 0) from public.purchases c, limites l where c.estado = 'APROBADA' and c.gateway <> 'bundle' and (l.d is null or c.purchased_at >= l.d) and (l.h is null or c.purchased_at < l.h)),
    'productos', (select coalesce(json_agg(fila), '[]'::json) from (
        select p.id, p.nombre,
          (select count(*) from public.eventos e, limites l where e.tipo = 'visita_landing' and e.product_id = p.id and (l.d is null or e.creado_en >= l.d) and (l.h is null or e.creado_en < l.h)) as visitas,
          (select count(*) from public.eventos e, limites l where e.tipo = 'clic_comprar' and e.product_id = p.id and (l.d is null or e.creado_en >= l.d) and (l.h is null or e.creado_en < l.h)) as clics,
          (select count(*) from public.purchases c, limites l where c.product_id = p.id and c.estado = 'APROBADA' and c.gateway <> 'bundle' and (l.d is null or c.purchased_at >= l.d) and (l.h is null or c.purchased_at < l.h)) as compras,
          (select coalesce(sum(c.monto_usd_centavos), 0) from public.purchases c, limites l where c.product_id = p.id and c.estado = 'APROBADA' and c.gateway <> 'bundle' and (l.d is null or c.purchased_at >= l.d) and (l.h is null or c.purchased_at < l.h)) as usd_centavos
        from public.products p
        where p.activo
        order by p.nombre
      ) fila),
    'canales', (select coalesce(json_agg(fila), '[]'::json) from (
        select canal,
               sum(visitas)::bigint as visitas,
               sum(clics)::bigint as clics,
               sum(ventas)::bigint as ventas
        from (
          select coalesce(nullif(e.utm_source, ''), 'directo') as canal,
                 count(*) filter (where e.tipo in ('visita_sitio', 'visita_landing')) as visitas,
                 count(*) filter (where e.tipo = 'clic_comprar') as clics,
                 0 as ventas
          from public.eventos e, limites l
          where (l.d is null or e.creado_en >= l.d) and (l.h is null or e.creado_en < l.h)
          group by 1
          union all
          select coalesce(nullif(c.utm_source, ''), 'directo'), 0, 0, count(*)
          from public.purchases c, limites l
          where c.estado = 'APROBADA' and c.gateway <> 'bundle'
            and (l.d is null or c.purchased_at >= l.d) and (l.h is null or c.purchased_at < l.h)
          group by 1
        ) t
        group by canal
        order by sum(ventas) desc, sum(visitas) desc
      ) fila)
  ) else null end
  from limites lim;
$$;

grant execute on function public.panel_resumen(date, date) to authenticated;
