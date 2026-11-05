-- ═══ Tendencias con decaimiento (21 sep 2026) ═══
-- Correr en el editor SQL de Supabase. Reemplaza la vista de conteo de 30 días.
-- drop + create porque cambia el tipo de la columna (bigint -> numeric) y
-- create or replace no lo permite. app.html tolera el segundo sin vista.

-- Puntaje de Tendencias con decaimiento (vida media 3 días): cada apertura
-- vale 1 hoy, 0,5 a los 3 días, 0,25 a los 6 y casi nada a los 30. Lo nuevo
-- sube el mismo día y un viral baja solo cuando se enfría, sin bordes de
-- ventana. Solo conteos agregados (sin datos de nadie): guide_id + puntaje.
-- La columna se sigue llamando aperturas porque app.html la lee con ese nombre.
-- Las aperturas de recursos premium cuentan para la guía de su producto.
drop view if exists public.tendencias_guias;
create view public.tendencias_guias as
  select coalesce(a.guide_id, p.guide_id) as guide_id,
         round(sum(power(0.5, extract(epoch from (now() - a.abierta_en)) / (3 * 86400)))::numeric, 2) as aperturas
  from public.aperturas a
  left join public.products p on p.id = a.product_id
  where coalesce(a.guide_id, p.guide_id) is not null
    and a.abierta_en > now() - interval '30 days'
  group by 1;

grant select on public.tendencias_guias to anon, authenticated;

-- Verificación: los primeros deben ser los que más se abren estos días
select g.titulo, t.aperturas as puntaje from public.tendencias_guias t join public.guides g on g.id = t.guide_id order by t.aperturas desc limit 10;
