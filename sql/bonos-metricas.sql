-- ═══ Métricas limpias con bonos: los bonos (gateway bono, monto 0) NO cuentan
-- como ventas ni dinero en el panel. Correr en el editor SQL de Supabase.

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
    'ventas',          (select count(*) from public.purchases c, limites l where c.estado = 'APROBADA' and c.gateway not in ('bundle', 'bono') and (l.d is null or c.purchased_at >= l.d) and (l.h is null or c.purchased_at < l.h)),
    'ventas_usd_centavos', (select coalesce(sum(c.monto_usd_centavos), 0) from public.purchases c, limites l where c.estado = 'APROBADA' and c.gateway not in ('bundle', 'bono') and (l.d is null or c.purchased_at >= l.d) and (l.h is null or c.purchased_at < l.h)),
    'ventas_cop_centavos', (select coalesce(sum(c.monto_centavos), 0) from public.purchases c, limites l where c.estado = 'APROBADA' and c.gateway not in ('bundle', 'bono') and (l.d is null or c.purchased_at >= l.d) and (l.h is null or c.purchased_at < l.h)),
    'productos', (select coalesce(json_agg(fila), '[]'::json) from (
        select p.id, p.nombre,
          (select count(*) from public.eventos e, limites l where e.tipo = 'visita_landing' and e.product_id = p.id and (l.d is null or e.creado_en >= l.d) and (l.h is null or e.creado_en < l.h)) as visitas,
          (select count(*) from public.eventos e, limites l where e.tipo = 'clic_comprar' and e.product_id = p.id and (l.d is null or e.creado_en >= l.d) and (l.h is null or e.creado_en < l.h)) as clics,
          (select count(*) from public.purchases c, limites l where c.product_id = p.id and c.estado = 'APROBADA' and c.gateway not in ('bundle', 'bono') and (l.d is null or c.purchased_at >= l.d) and (l.h is null or c.purchased_at < l.h)) as compras,
          (select coalesce(sum(c.monto_usd_centavos), 0) from public.purchases c, limites l where c.product_id = p.id and c.estado = 'APROBADA' and c.gateway not in ('bundle', 'bono') and (l.d is null or c.purchased_at >= l.d) and (l.h is null or c.purchased_at < l.h)) as usd_centavos
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
          where c.estado = 'APROBADA' and c.gateway not in ('bundle', 'bono')
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
