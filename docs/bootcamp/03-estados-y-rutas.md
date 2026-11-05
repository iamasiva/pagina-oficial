# Fase 1: rutas, estados y permisos del bootcamp

## Rutas (páginas estáticas, sin router)

| Ruta | Quién entra | Qué hace |
|---|---|---|
| `bootcamp.html` | Hoy solo admin (puerta `profiles.es_admin`); al lanzar, pública | Landing de venta. Botón → `pago.html?p=6c01d354…` cuando el producto esté activo con `hotmart_url` |
| `recurso-bootcamp.html` | Comprador con compra APROBADA del bootcamp, o admin | Home privado: estado del evento, 3 tarjetas de clase, herramientas (557/400/200) y recursos de clase, soporte |
| `bootcamp-clase.html?n=1..3` | Igual que el home | Página de clase: estado, cuenta regresiva, reproductor (ticket del servidor), chat (fase 4), repetición en Hotmart |
| `bootcamp-recurso.html?r=<slug>` | Igual que el home | Recurso de clase con dirección definitiva: `42-formatos-de-respuesta`, `61-instrucciones-para-imagenes`, `25-agentes-de-ia`, `mapa-de-las-ia-de-google`. Tras la puerta salta a `app.html?guia=<id>&volver=bootcamp`: el recurso se abre en el visor de IA MASIVA (barra con Favoritos, Cerrar y Comentarios) y "Cerrar" devuelve a `recurso-bootcamp.html`. Las guías de recursos llevan la categoría `Recurso del bootcamp`: no salen en el catálogo, sí en Favoritos; `api/contenido` las entrega a quien tiene compra APROBADA del bootcamp. Si aún no existe la guía, "se entrega en la clase N" |
| `bootcamp-admin.html` | Admin | Consola: banderas del evento y estados de cada clase |
| `bootcamp-preguntas.html?n=N` | Admin | Pantalla para compartir al final de la clase: solo las preguntas para Sergio (misma sala del chat), grandes, con "Marcar respondida", destacar y borrar; "Modo pantalla" esconde los botones secundarios |
| `bootcamp-certificado.html` | Igual que el home | Certificado de participación en PDF (`certificado-im.js`, pdf-lib en el navegador, fuentes estándar, estrella del bootcamp): sale con `profiles.nombre` (o el nombre de la cuenta), el alumno lo puede cambiar con el lápiz (se guarda en su perfil) y lo descarga con fecha del día y código de verificación (8 caracteres de su id). Se habilita cuando la clase 3 está en `ended_pending_upload` o `evergreen_ready`; admin y equipo lo ven siempre. Tarjeta "Tu certificado" en el home, debajo de los recursos |
| `app.html` (catálogo) | Todos | La tarjeta del bootcamp es la guía premium enlazada por `products.guide_id` (despublicada hasta lanzar). Clic: comprado → `recurso-bootcamp.html`; sin compra → `bootcamp.html` (mapa `LANDING_PRODUCTO`) |
| `pago.html` / `confirmacion.html` | Compradores | Mapa `PAGINAS` → `recurso-bootcamp.html` tras pagar |
| `api/bootcamp-ticket?clase=N` | Sesión + compra o admin | Devuelve la URL del reproductor de Cloudflare con token firmado (fase 2) |

Puerta en el cliente (las tres páginas): sin sesión → `index.html`; con sesión pero sin compra, o con `bootcamp_config.admin_only = true` y sin ser admin → `bootcamp.html`. La seguridad real del video está en el servidor: sin ticket no hay reproductor, y el UID del Live Input nunca viaja al navegador.

## Datos

- `bootcamp_clases` (una fila por clase): `numero`, `titulo`, `inicio_utc` (timestamptz; se muestra en America/Bogota), `duracion_min`, `estado`, `hotmart_lesson_url`, `aviso`. Leen los autenticados; edita admin.
- `bootcamp_config` (una fila por producto): `admin_only` (staging), `video_enabled` (el servidor no emite tickets si es falso), `chat_mode` (normal, slow_mode, questions_only, read_only, off), `anuncio` (texto que aparece en el home y en la clase), `hotmart_curso_url` (fallback de los deep links).
- Cloudflare: `CF_STREAM_LIVE_INPUT_1..3`, `CF_STREAM_CUSTOMER_CODE`, `CF_STREAM_KEY_ID`, `CF_STREAM_JWK` en Vercel. Nunca en la base ni en el HTML.

## Estados de cada clase (independientes entre sí)

| Estado | Tarjeta en el home | Página de clase | Hotmart Club |
|---|---|---|---|
| `scheduled` | Programada · "Ver detalles" | Cuenta regresiva, agenda, requisitos, soporte | Lección con enlace a la clase en IA MASIVA |
| `lobby` | Sala abierta · "Entrar a sala" | Sala abierta, reproductor pide ticket (muestra "sin señal" hasta que haya emisión), chat de saludo | Enlace a IA MASIVA |
| `live` | En vivo (punto rojo) · "Entrar en vivo" | Reproductor Cloudflare + chat / preguntas | Enlace a IA MASIVA |
| `ended_pending_upload` | Grabación en preparación | Mensaje de preparación, recursos, soporte | Aviso |
| `evergreen_ready` | Repetición disponible · "Ver repetición" (abre la página de clase si hay `grabacion_url`; si no, `hotmart_lesson_url`) | Con `grabacion_url` (YouTube no listado, `sql/bootcamp-grabacion.sql`, 3 nov 2026): la grabación embebida en la página con "Abrir en Hotmart" debajo; sin ella, CTA "Ver la grabación en Hotmart" (fallback `hotmart_curso_url`) | MP4 en la lección |
| `rescheduled` | Fecha actualizada | Cuenta regresiva con la nueva fecha y `aviso` | Aviso |
| `cancelled` | Cancelada | Aviso sin reproductor | Aviso |

Cómo cambia el estado: por ahora, actualizando la fila en Supabase (política admin). La consola admin con botones y bitácora llega en la fase 7. La página de clase relee su estado cada 90 s solo cuando la clase está a menos de 3 h o en sala/en vivo; no hay polling en el resto de la página.

Equipo de ensayo (26 oct 2026): la tabla `bootcamp_equipo` (correo por producto, solo admin por RLS; `sql/bootcamp-equipo.sql`) guarda a quienes entran al home y a la clase sin compra y reciben ticket de video y de chat en cualquier estado, como alumnos (no moderan). Se administra en la consola `bootcamp-admin.html`, sección "Equipo de ensayo"; el home muestra a los admins el botón "Abrir consola" junto al soporte. Las páginas preguntan con la función `bootcamp_soy_equipo(product)` (security definer, no expone la lista); los tickets consultan la tabla con la service key. El día real no se toca la lista: la clase se abre a todos los compradores al pasar a `lobby` o `live`.

Simulación para el equipo: un admin puede abrir `bootcamp-clase.html?n=1&estado=live` (o usar el selector flotante) para ver cualquier estado sin tocar la base. Nadie más ve ese selector y no cambia nada real.

## GATE 1 (evidencia)

- Admin entra al home y a las tres clases; ve el chip "Vista previa admin" y el aviso de modo solo equipo.
- Sin sesión: `recurso-bootcamp.html` y `bootcamp-clase.html` mandan a `index.html`. Con sesión sin compra: mandan a `bootcamp.html`. Con compra pero `admin_only = true`: mandan a `bootcamp.html`.
- Catálogo, compras, packs y herramientas actuales: sin cambios (solo se agregó una clave a tres mapas).

## Llegada sin sesión desde un correo

`recurso-bootcamp.html` y `bootcamp-clase.html` mandan a quien no tiene sesión a `index.html?entrar=bootcamp` (o `?entrar=claseN`). La portada guarda el destino en `sessionStorage` (`im_destino`, solo valores de la lista `DESTINOS_ENTRAR`), abre el login de una vez y, al entrar con correo o con Google, devuelve a ese destino en vez de al catálogo. Antes caían en la portada sin ninguna pista.

## Paso automático a "en vivo"

`GET /api/bootcamp-senal?clase=N` mira en el servidor si el Live Input de la clase ya emite (manifiesto firmado: 200 hay señal, 204 todavía no). Si la clase está en `lobby` y hay señal, la pasa a `live` (candado en el WHERE para que dos llamadas no choquen). La página de la clase lo llama al ver la primera señal con la sala abierta; además se puede vigilar desde afuera con `curl` cada 20 s. Con `&solo=1` solo informa. Terminar la clase sigue siendo manual (consola, botón Terminar). La firma y las rutas de Stream viven en `api/_stream.js`, compartidas con el ticket.
