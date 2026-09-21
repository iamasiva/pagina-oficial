-- ═══ Hotmart: pasarela nueva (preparado 2026-09-17) ═══
-- Correr con las pestañas del sitio cerradas. Nada de esto cambia el cobro
-- actual: mientras products.hotmart_url esté vacío, todo sigue por Wompi.

-- 1) Qué producto de Hotmart es cada producto nuestro, y su link de checkout.
--    hotmart_id: el ID numérico del producto en Hotmart (o su ucode).
--    hotmart_url: el link de pago del producto (https://pay.hotmart.com/...).
alter table public.products add column if not exists hotmart_id text unique;
alter table public.products add column if not exists hotmart_url text;
-- Ofertas de precio fijo del pack para completar por la diferencia: [{centavos, url, nombre}]
alter table public.products add column if not exists hotmart_ofertas jsonb;

-- 2) Bitácora de todo lo que manda Hotmart (para depurar sin adivinar).
--    Solo escribe el servidor; nadie del navegador la lee.
create table if not exists public.hotmart_eventos (
  id bigint generated always as identity primary key,
  recibido_en timestamptz not null default now(),
  evento text not null,
  hotmart_evento_id text,
  transaccion text,
  correo text,
  producto_hotmart text,
  resultado text,
  cuerpo jsonb
);
alter table public.hotmart_eventos enable row level security;
create index if not exists hotmart_eventos_transaccion on public.hotmart_eventos (transaccion);

-- Verificación
select column_name from information_schema.columns
where table_name = 'products' and column_name in ('hotmart_id', 'hotmart_url');
select relname, relrowsecurity from pg_class where relname = 'hotmart_eventos';

-- ═══ Cuando Hotmart verifique la cuenta y existan los productos ═══
-- Un UPDATE por producto. Hasta que se corra, ese producto sigue por Wompi.
-- update public.products set hotmart_id = '<ID EN HOTMART>', hotmart_url = 'https://pay.hotmart.com/<CODIGO>' where id = '656f61d7-37b2-4e9c-8cf3-67065484493c'; -- 557
-- update public.products set hotmart_id = '<ID EN HOTMART>', hotmart_url = 'https://pay.hotmart.com/<CODIGO>' where id = '0f0d6926-5328-4e3e-89a4-92b36ef13996'; -- 400
-- update public.products set hotmart_id = '<ID EN HOTMART>', hotmart_url = 'https://pay.hotmart.com/<CODIGO>' where id = '2c296299-d9a4-4409-bc99-67b4999e47f8'; -- 200
-- update public.products set hotmart_id = '<ID EN HOTMART>', hotmart_url = 'https://pay.hotmart.com/<CODIGO>' where id = '8dd3d7fa-f9f1-41dd-9539-098cb4c68e11'; -- Pack

-- Para volver a Wompi en un producto (interruptor de emergencia):
-- update public.products set hotmart_url = null where id = '<uuid>';
