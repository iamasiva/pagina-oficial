-- ═══ Atribución de canal (UTM): de dónde llega cada visita, clic y venta ═══
-- Correr completo en el editor SQL de Supabase (con las pestañas del sitio cerradas).

alter table public.eventos
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

alter table public.purchases
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

-- Resumen del panel, ahora con la tabla por canal (sin UTM = "directo").
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
      ) fila),
    'canales', (select coalesce(json_agg(fila), '[]'::json) from (
        select canal,
               sum(visitas)::bigint as visitas,
               sum(clics)::bigint as clics,
               sum(ventas)::bigint as ventas
        from (
          select coalesce(nullif(utm_source, ''), 'directo') as canal,
                 count(*) filter (where tipo in ('visita_sitio', 'visita_landing')) as visitas,
                 count(*) filter (where tipo = 'clic_comprar') as clics,
                 0 as ventas
          from public.eventos
          group by 1
          union all
          select coalesce(nullif(utm_source, ''), 'directo'), 0, 0, count(*)
          from public.purchases
          where estado = 'APROBADA' and gateway <> 'bundle'
          group by 1
        ) t
        group by canal
        order by sum(ventas) desc, sum(visitas) desc
      ) fila)
  ) else null end;
$$;

grant execute on function public.panel_resumen() to authenticated;
