-- Bonos de un producto: al aprobarse la compra de product_id, el webhook de
-- Hotmart regala bono_id (compra APROBADA, gateway 'bono', monto 0, misma
-- transacción; un reembolso la retira). NO es un pack: no toca el precio ni
-- pago.html. Solo la lee el servidor. DDL: la corre Sergio.
create table if not exists public.producto_bonos (
  product_id uuid not null references public.products(id) on delete cascade,  -- el que se compra
  bono_id    uuid not null references public.products(id) on delete cascade,  -- el que se regala
  orden      int  not null default 0,
  primary key (product_id, bono_id)
);

alter table public.producto_bonos enable row level security;
-- Sin políticas: el navegador no lee ni escribe; el service role del servidor sí.

-- Bootcamp Gemini de 0 a 100 regala las tres herramientas
insert into public.producto_bonos (product_id, bono_id, orden) values
  ('6c01d354-e05d-47be-a6d6-3075abcc16d3', '656f61d7-37b2-4e9c-8cf3-67065484493c', 1),  -- 557 Configuraciones
  ('6c01d354-e05d-47be-a6d6-3075abcc16d3', '0f0d6926-5328-4e3e-89a4-92b36ef13996', 2),  -- 400 Skills
  ('6c01d354-e05d-47be-a6d6-3075abcc16d3', '2c296299-d9a4-4409-bc99-67b4999e47f8', 3)   -- 200 Diseños
on conflict (product_id, bono_id) do nothing;
