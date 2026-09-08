-- Panel admin: el embudo de leads contaba filas descargadas y Supabase corta
-- toda consulta en 1.000 filas. Esta funcion agrega EN LA BASE (sin tope) las
-- visitas, correos y aperturas por recurso, con filtro de fechas opcional.
-- Es security invoker: corre con los permisos de quien llama, asi que las
-- politicas RLS de eventos y leads_recursos siguen mandando (solo el admin
-- obtiene filas; cualquier otro usuario recibe el resultado vacio).

create or replace function public.embudo_leads(
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (guide_id uuid, visitas bigint, correos bigint, aperturas bigint)
language sql stable
as $$
  with ev as (
    select e.guide_id as gid,
           count(*) filter (where e.tipo = 'visita_landing_recurso') as visitas,
           count(*) filter (where e.tipo = 'apertura_recurso_publico') as aperturas
    from public.eventos e
    where e.tipo in ('visita_landing_recurso', 'apertura_recurso_publico')
      and (p_desde is null or e.creado_en >= p_desde)
      and (p_hasta is null or e.creado_en < p_hasta)
    group by e.guide_id
  ), ld as (
    select l.guide_id as gid, count(*) as correos
    from public.leads_recursos l
    where (p_desde is null or l.creada_en >= p_desde)
      and (p_hasta is null or l.creada_en < p_hasta)
    group by l.guide_id
  )
  select coalesce(ev.gid, ld.gid),
         coalesce(ev.visitas, 0),
         coalesce(ld.correos, 0),
         coalesce(ev.aperturas, 0)
  from ev full outer join ld on ev.gid = ld.gid;
$$;

revoke execute on function public.embudo_leads(timestamptz, timestamptz) from anon;
grant execute on function public.embudo_leads(timestamptz, timestamptz) to authenticated;

-- Verificacion (corriendo como admin en el SQL editor esto usa service role,
-- que ve todo): debe mostrar los totales REALES, hoy ~3.282 correos en total
-- y el metodo de las 3 notas con mas de mil visitas.
select coalesce(sum(visitas),0) as visitas, coalesce(sum(correos),0) as correos,
       coalesce(sum(aperturas),0) as aperturas
from public.embudo_leads(null, null);
