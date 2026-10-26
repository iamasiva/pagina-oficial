# Fase 0: auditoría de lo que existe (26 oct 2026)

Base real sobre la que se monta el bootcamp. Nada de esto es supuesto: sale del repositorio y de la base de datos de producción.

## Plataforma

- Sitio: HTML, CSS y JS sin framework ni build. Un archivo por página (index.html, app.html, producto.html, recurso-557/400/200.html, admin.html, pago.html, confirmacion.html, bootcamp.html). Hosting Vercel (rama main = producción, deploy automático con cada push). Sin staging separado: la "puerta" de admin hace de staging dentro de producción.
- Backend: funciones serverless en `api/` (Vercel, Node, ESM): checkout, estado-compra, hotmart-webhook, wompi-webhook, reclamar, bonos, completar-pack, contenido, lead, comentario, sugerencia. Utilidades en `api/_lib.js`: `adminClient()` (service role), `userFromRequest(req)` (valida el JWT de Supabase que manda el navegador), `componentesDelPack`, `mapaDePacks`, `trmDelDia`, `ofertaPorMonto`.
- Base: Supabase (api.iamasiva.co). Tablas relevantes: `products` (id, tipo con check, nombre, precio_usd_centavos, precio_promo_usd_centavos, guide_id, activo, hotmart_id, hotmart_url, hotmart_ofertas), `guides` (las tarjetas del catálogo; una guía premium enlazada por products.guide_id es la tarjeta de un producto), `purchases` (user_id, email_comprador, product_id, guide_id, estado APROBADA/PENDIENTE/ANULADA/ERROR, gateway hotmart/wompi/bundle/bono, referencia, gateway_transaction_id, monto), `profiles` (es_admin, protegido por trigger: solo lo cambia el servidor), `bundle_componentes` (composición de packs: precio por piezas), `premium_items`, `aperturas`, `eventos`, `hotmart_eventos`, `app_config`, `hero_slides`, `leads_recursos`.
- Variables de entorno ya usadas por `api/`: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, HOTMART_HOTTOK, HOTMART_PRODUCTOS, BREVO_API_KEY, BREVO_LEADS_LIST_ID, META_PIXEL_ID, META_CAPI_TOKEN, META_TEST_EVENT_CODE, WOMPI_*. Solo nombres; los valores viven en Vercel.
- Rutas: `vercel.json` solo tiene redirects de bio (/ig, /tt, /yt, /lt) y la reescritura `/r/:slug` → recurso.html. Cualquier ruta nueva del bootcamp es una página o una reescritura ahí.

## Pagos y permisos (lo que el plan maestro da por hacer y lo que falta)

- Hotmart es la pasarela en producción desde el 21 sep 2026. `api/hotmart-webhook.js` recibe TODAS las compras de nuestros productos (vengan de la landing o de Hotmart directo): valida `X-HOTMART-HOTTOK`, identifica el producto por `products.hotmart_id` (o por el mapa HOTMART_PRODUCTOS), y en PURCHASE_APPROVED / PURCHASE_COMPLETE inserta la compra APROBADA. Vincula por referencia `sck` (usuario que salió de pago.html) y, si no, por correo (`perfilPorCorreo`). Sin cuenta: compra de invitado (user_id null) que `api/reclamar.js` engancha cuando la persona se registra con ese correo confirmado. PURCHASE_REFUNDED / CHARGEBACK / CANCELED revocan (estado ANULADA). Duplicados: fila en ERROR para revisar. Packs: por cada pieza de `bundle_componentes` crea una compra gateway 'bundle' a $0.
- Conclusión: el "flujo B" del plan (compra directa en Hotmart → derechos en IA MASIVA) ya existe. Lo que falta para el bootcamp es una sola regla: al aprobar la compra del bootcamp, regalar las 3 herramientas (557, 400, 200). No se puede hacer con `bundle_componentes` porque pago.html y el webhook la usan como precio por piezas (descuentan lo pagado y dan el pack por comprado a quien ya tiene las tres). Hace falta una tabla o mapa de "bonos de producto" leído solo por el webhook. Fase 3.
- Producto del bootcamp: fila en `products` id `6c01d354-e05d-47be-a6d6-3075abcc16d3`, tipo 'workshop', $97, INACTIVO, sin hotmart_id ni hotmart_url. El producto en Hotmart NO existe todavía: lo crea Sergio y se pega el link. La landing `bootcamp.html` (solo admin) ya manda al botón a `pago.html?p=<id>` cuando el producto esté activo con link.
- Precio evergreen $157: en Hotmart se resuelve con una oferta del mismo producto (como se hizo con "completar pack": `hotmart_ofertas`), sin producto nuevo. Pendiente al pasar a evergreen.

## Identidad, catálogo y páginas de producto

- Login de IA MASIVA: Supabase Auth (correo+clave y Google). Admin = `profiles.es_admin` (lo lee el cliente para pintar; cada página sensible lo vuelve a comprobar; el flag `im_es_admin` en localStorage solo sirve para no contar al equipo en métricas, nunca como permiso).
- Tarjetas del catálogo (app.html): se pintan desde `guides` con `publicada = true`; las de productos de pago son guías premium enlazadas por `products.guide_id`. Al hacer clic: comprado → `PAGINAS_PRODUCTO[product.id]` (página propia); no comprado → `producto.html?p=<id>` (landing genérica). pago.html y confirmacion.html tienen el mismo mapa `PAGINAS`.
- Páginas de herramientas (recurso-557/400/200.html): exigen sesión, usan RLS como candado (sin compra aprobada o admin no llegan filas), registran apertura en `aperturas` y mandan a la landing si no hay compra.
- bootcamp.html (landing de venta): en producción, solo admin, sin enlaces, noindex.

## Límites y gasto (no auditables desde el código)

- Vercel Pro: revisar en el panel Spend Management y la opción de pausar producción. Supabase Pro: revisar Spend Cap y límites de Auth. Lo revisa Sergio; se documenta en 09-costos-observabilidad.md cuando tengamos los números.
- Supabase Realtime no se usa para nada hoy; el chat del bootcamp no lo va a usar (Cloudflare Workers + Durable Objects, fase 4).

## Plan mínimo de cambios (fase 1 y 2)

| Pieza | Archivo | Riesgo |
|---|---|---|
| Tabla `bootcamp_clases` (3 clases, fecha UTC, estado, link de lección Hotmart) y `bootcamp_config` (admin_only, video_enabled, chat_mode, anuncio) | `sql/bootcamp-clases.sql` (DDL, la corre Sergio) | Nulo para lo existente |
| Tarjeta del catálogo: guía premium DESPUBLICADA enlazada al producto | `sql/bootcamp-guia-card.sql` (la corre Sergio) | Nulo: no se ve hasta publicar |
| Home privado del comprador | `recurso-bootcamp.html` (nuevo) | Nulo |
| Página de clase con estados y reproductor | `bootcamp-clase.html` (nuevo) | Nulo |
| Mapas de páginas y landing propia | `app.html`, `pago.html`, `confirmacion.html` (una línea cada uno) | Bajo: solo agrega una clave a un objeto |
| Ticket de reproducción Cloudflare | `api/bootcamp-ticket.js` (fase 2) | Bajo: endpoint nuevo |
| Regla de bonos del bootcamp en el webhook | `api/hotmart-webhook.js` + tabla `producto_bonos` (fase 3) | Medio: toca el webhook; con pruebas de duplicado y reembolso |

Secretos nuevos (solo nombres, en Vercel): CF_ACCOUNT_ID, CF_STREAM_CUSTOMER_CODE, CF_STREAM_KEY_ID, CF_STREAM_JWK, CF_STREAM_LIVE_INPUT_1, CF_STREAM_LIVE_INPUT_2, CF_STREAM_LIVE_INPUT_3. Los UID de los Live Inputs y la stream key nunca van a la base ni al navegador.

## GATE 0

Alcance aprobado por Sergio el 26 oct 2026 ("empecemos"). Sin duplicar pagos, autenticación ni permisos: se reutilizan Hotmart, Supabase Auth, `purchases`, RLS y el patrón de páginas de producto. Rollback: cada fase es aditiva (archivos nuevos y una clave en tres mapas); se revierte con `git revert` del commit de la fase.
