-- Bootcamp Gemini de 0 a 100: producto creado el 23 oct 2026 por service role
-- (DML), INACTIVO y sin Hotmart hasta que Sergio lo active. Queda aquí como
-- registro; no hace falta correrlo. La landing es bootcamp.html (solo admin).
-- tipo: la restricción products_tipo_check acepta 'workshop' (no 'curso' ni 'bootcamp').
-- NO está en bundle_componentes a propósito: pago.html y el webhook tratan esa
-- tabla como "pack por piezas" (descuentan lo ya pagado por cada pieza y dan por
-- comprado el pack a quien ya tiene las tres). Las herramientas de regalo se
-- entregan con una regla aparte, pendiente de definir en el webhook.
insert into public.products (id, tipo, nombre, precio_usd_centavos, activo, guide_id, precio_promo_usd_centavos, hotmart_id, hotmart_url, hotmart_ofertas)
values ('6c01d354-e05d-47be-a6d6-3075abcc16d3', 'workshop', 'Bootcamp Gemini de 0 a 100', 9700, false, null, null, null, null, null)
on conflict (id) do nothing;

-- Para activar la venta (cuando exista el producto en Hotmart):
-- hotmart_id 8811480 y hotmart_url https://pay.hotmart.com/D108197653Q ya guardados (26 oct). Para abrir la venta:
-- update public.products set activo = true where id = '6c01d354-e05d-47be-a6d6-3075abcc16d3';
-- update public.bootcamp_config set admin_only = false where product_id = '6c01d354-e05d-47be-a6d6-3075abcc16d3';
-- update public.guides set publicada = true where slug = 'bootcamp-gemini-de-0-a-100';
