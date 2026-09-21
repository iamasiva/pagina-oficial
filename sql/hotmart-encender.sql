-- ═══ Hotmart: encender los 4 productos (21 sep 2026) ═══
-- Con hotmart_url puesto, pago.html y /api/checkout mandan a Hotmart.
-- Con null, el producto vuelve a Wompi (interruptor de emergencia).
-- Correr con las pestañas del sitio cerradas. Antes de correrlo, tener
-- HOTMART_HOTTOK en Vercel y el redeploy hecho: si no, las compras se
-- aprueban en Hotmart pero el webhook las rechaza (403) hasta que exista.

-- 1) Primero SOLO el 200, para hacer la compra de prueba:
update public.products set hotmart_id = '8567213', hotmart_url = 'https://pay.hotmart.com/C107706689S' where id = '2c296299-d9a4-4409-bc99-67b4999e47f8'; -- 200 Diseños

-- 2) Cuando la prueba del 200 pase (compra, acceso y webhook en verde), los otros tres
-- (quitar los guiones):
-- update public.products set hotmart_id = '8566654', hotmart_url = 'https://pay.hotmart.com/Y107705332E' where id = '0f0d6926-5328-4e3e-89a4-92b36ef13996'; -- 400 Gemas
-- update public.products set hotmart_id = '8566717', hotmart_url = 'https://pay.hotmart.com/Q107705500C' where id = '656f61d7-37b2-4e9c-8cf3-67065484493c'; -- 557 Configuraciones
-- update public.products set hotmart_id = '8566736', hotmart_url = 'https://pay.hotmart.com/M107705559E' where id = '8dd3d7fa-f9f1-41dd-9539-098cb4c68e11'; -- Pack Gemini 3x

-- 3) Completar el pack por la diferencia, también por Hotmart. El pack tiene
-- seis ofertas de precio fijo (Fijación de precios y ofertas > Nuevo precio),
-- una por cada diferencia posible. /api/checkout elige la del monto que le
-- falta a la persona (exacto, o el más cercano hasta 3 USD); sin oferta
-- cercana, ese caso sigue por Wompi. Cambiar precios = agregar/quitar aquí.
alter table public.products add column if not exists hotmart_ofertas jsonb;
update public.products set hotmart_ofertas = '[
  {"centavos": 3000, "url": "https://pay.hotmart.com/M107705559E?off=s0zkdfj7", "nombre": "Completar pack 30"},
  {"centavos": 2300, "url": "https://pay.hotmart.com/M107705559E?off=gcbx9hia", "nombre": "Completar pack 23"},
  {"centavos": 1800, "url": "https://pay.hotmart.com/M107705559E?off=5bivke60", "nombre": "Completar pack 18"},
  {"centavos": 600, "url": "https://pay.hotmart.com/M107705559E?off=u4qoo74z", "nombre": "Completar pack 6"},
  {"centavos": 500, "url": "https://pay.hotmart.com/M107705559E?off=m7ce6bgi", "nombre": "Completar pack 5"},
  {"centavos": 100, "url": "https://pay.hotmart.com/M107705559E?off=f6cb4wd5", "nombre": "Completar pack 1"}
]'::jsonb where id = '8dd3d7fa-f9f1-41dd-9539-098cb4c68e11'; -- Pack Gemini 3x

-- Verificación
select nombre, hotmart_id, hotmart_url, jsonb_array_length(coalesce(hotmart_ofertas, '[]'::jsonb)) as ofertas from public.products order by nombre;

-- Apagar un producto (vuelve a Wompi):
-- update public.products set hotmart_url = null where id = '<uuid>';
