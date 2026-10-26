# Fase 3: compra y acceso por las dos puertas

## Flujo A: compra desde IA MASIVA (ya existía)

1. Tarjeta del catálogo o `bootcamp.html` → `pago.html?p=<id del bootcamp>` (consentimiento, referencia propia `sck`) → checkout de Hotmart del producto.
2. Hotmart aprueba → webhook `PURCHASE_APPROVED` → `api/hotmart-webhook.js` encuentra la fila PENDIENTE por `sck` (o por usuario y producto en las últimas 48 h) y la pasa a APROBADA.
3. Nuevo en esta fase: lee `producto_bonos` y crea una compra APROBADA por cada regalo (557, 400, 200) con `gateway = 'bono'`, monto 0 y la misma `gateway_transaction_id`. Si el comprador ya tenía alguna herramienta, esa no se duplica.
4. `confirmacion.html` y `app.html` mandan a `recurso-bootcamp.html` (mapa PAGINAS / PAGINAS_PRODUCTO).

## Flujo B: compra directa en Hotmart (ya existía, verificado)

1. El webhook identifica el producto por `products.hotmart_id` (o por el mapa HOTMART_PRODUCTOS) y al comprador por correo (`profiles.email`, comparación exacta).
2. Con cuenta: la compra queda a su nombre. Sin cuenta: compra de invitado (`user_id null`, `email_comprador`) y `api/reclamar.js` la engancha cuando se registra con ese correo confirmado. Los bonos siguen el mismo camino (también quedan como invitado y se reclaman juntos).
3. Nunca se da acceso por escribir un correo: el enganche exige sesión con correo confirmado igual al de la compra.

## Reembolso, contracargo y cancelación

`PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK` y `PURCHASE_CANCELED` pasan a ANULADA todas las filas con esa transacción: la compra, las piezas de pack y, desde esta fase, los bonos. Una herramienta comprada aparte (otra transacción) no se toca.

## Idempotencia

- Una transacción ya APROBADA devuelve "ya aprobada" sin crear nada (los reintentos de Hotmart no duplican bonos).
- Un comprador que ya tiene el producto choca con el índice de "una compra aprobada por producto" y queda en ERROR para revisar, como antes.
- Todo evento queda en `hotmart_eventos` con su resultado.

## Lo que falta configurar (Sergio)

- Crear el producto en Hotmart (precio $97) y poner `hotmart_id` y `hotmart_url` en la fila del bootcamp; activar `activo = true` cuando se abra la venta.
- Correr `sql/producto-bonos.sql` (tabla y las tres filas del bootcamp).
- El webhook ya está configurado en Hotmart para la cuenta; un producto nuevo entra por el mismo endpoint.

## Pruebas (arnés local contra la base real, usuario desechable, 26 oct 2026)

Arnés: copia local del webhook real con `_lib.js` sustituido solo en `bonosDelProducto` (la tabla aún no existía), base de producción, usuario desechable `*@test.iamasiva.co`, producto mapeado por HOTMART_PRODUCTOS. Todo se borró al terminar y se auditó en cero.

| Caso | Resultado del webhook | Filas en purchases |
|---|---|---|
| A. PURCHASE_APPROVED del bootcamp | "aprobada, 3 bono(s) nuevo(s) de 3" | bootcamp APROBADA (hotmart) + 557, 400 y 200 APROBADA (bono), a nombre del usuario |
| B. Mismo evento reenviado | "ya aprobada" | Sin cambios (4 filas) |
| C. PURCHASE_REFUNDED | "acceso retirado a 4 fila(s)" | Las 4 en ANULADA |
| D. Comprador que ya tenía el 557 | "aprobada, 2 bono(s) nuevo(s) de 3" | bootcamp + 400 y 200; el 557 previo intacto |
| E. Comprador sin cuenta (invitado) | "aprobada (invitado, se reclama al registrarse), 3 bono(s) nuevo(s) de 3" | 4 filas con user_id nulo y el correo, listas para `api/reclamar.js` |

## GATE 3

Cumplido en código y pruebas locales. Queda la prueba real de punta a punta cuando exista el producto en Hotmart: una compra de prueba desde `bootcamp.html` y otra desde el link directo de Hotmart.
