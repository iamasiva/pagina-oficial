# Fase 2: Cloudflare Stream para el directo (pasos de Sergio y del agente)

Objetivo: una señal de OBS llega a `bootcamp-clase.html` en iamasiva.co y solo la ve un admin con ticket firmado.

## Lo que hace Sergio (cuenta y pagos)

1. Entrar a https://dash.cloudflare.com con la cuenta de IA MASIVA (o crearla). Menú **Stream** → activar la suscripción (pide método de pago; el cobro es por minutos entregados y almacenados).
2. **Stream → Live Inputs → Create Live Input**. Nombre: `bootcamp-clase-1`. Opciones: *Require signed URLs* = ON; *Allowed origins* = `iamasiva.co, www.iamasiva.co`; *Recording* = Automatic (Cloudflare guarda una copia temporal del directo; la grabación maestra es la de StreamYard). Repetir para `bootcamp-clase-2` y `bootcamp-clase-3`.
3. De cada Live Input copiar: **Live Input ID** (UID), y del bloque RTMPS: **URL** y **Stream Key** (la key es secreta: solo va a OBS/StreamYard, nunca al repositorio ni a un chat).
4. **Stream → Settings (o la página del reproductor) → Customer subdomain**: copiar el código `customer-xxxxxxxx` (es el subdominio `customer-xxxxxxxx.cloudflarestream.com`).
5. Crear la llave de firma. En **My Profile → API Tokens** crear un token con permiso *Stream: Edit* (solo para este paso), y ejecutar una vez:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/stream/keys" -H "Authorization: Bearer <API_TOKEN>"
```

   La respuesta trae `result.id` (Key ID) y `result.jwk` (la llave privada en base64). Guardar los dos; después borrar el token de API, que ya no hace falta.
6. En **Vercel → Project → Settings → Environment Variables (Production)** crear:
   - `CF_STREAM_CUSTOMER_CODE` = `customer-xxxxxxxx`
   - `CF_STREAM_KEY_ID` = el `id` del paso 5
   - `CF_STREAM_JWK` = el `jwk` del paso 5 (tal cual, en base64)
   - `CF_STREAM_LIVE_INPUT_1`, `_2`, `_3` = los UID del paso 3
   Después, *Redeploy* del último deployment para que las funciones vean las variables.
7. Instalar OBS (gratis) en el Mac: **Settings → Stream → Service: Custom**, Server = la URL RTMPS del Live Input 1, Stream Key = su key. Una escena con la cámara o una ventana basta para la prueba.
8. En Supabase poner `bootcamp_config.video_enabled = true` y la clase 1 en `estado = 'live'` (o dejar `scheduled` y usar la simulación de admin: el ticket se emite a admins en cualquier estado).

## Lo que hace el agente

- `api/bootcamp-ticket.js` ya está escrito: valida sesión, compra o admin, `video_enabled`, estado de la clase, firma un token RS256 de 4 horas con `sub` = UID del Live Input y devuelve la URL del reproductor `https://<customer>.cloudflarestream.com/<token>/iframe`. Sin variables de entorno responde 503 sin romper la página.
- Prueba del GATE 2 (con OBS emitiendo): admin abre `bootcamp-clase.html?n=1&estado=live` y ve la señal; abrir `https://<customer>.cloudflarestream.com/<UID>/iframe` sin token debe fallar; un token caducado debe fallar; un usuario sin compra recibe 403 del ticket; cerrar OBS y volver a emitir recupera la señal con "Reconectar". Medir retraso emisión → reproductor y registrar minutos consumidos en el panel de Stream.

## Costos (referencia del panel de Cloudflare, confirmar en la cuenta)

- Entrega: USD 1 por cada 1.000 minutos vistos. Almacenamiento: USD 5 por cada 1.000 minutos guardados al mes (las copias temporales del directo se borran tras respaldar en StreamYard).
- Para 200 alumnos viendo 6 horas: unos 72.000 minutos = USD 72 de entrega. Presupuestar alertas de consumo en Cloudflare.

## GATE 2: cumplido el 26 oct 2026

- Cuenta Cloudflare con Images & Stream (pago por uso) y 1.000 minutos de almacenamiento; tres Live Inputs `bootcamp-clase-1/2/3` con *Require signed URLs* y grabación automática (borrado automático a los 30 días); llave de firma creada por API; seis variables en Vercel.
- Señal de prueba: OBS (cámara de Sergio) → RTMPS → Cloudflare → `bootcamp-clase.html?n=1` en iamasiva.co con la sesión de admin. La imagen se vio en el reproductor sin pasar por Vercel ni Supabase.
- Seguridad: manifiesto firmado 200 (m3u8 válido); el mismo manifiesto sin firma 401; `api/bootcamp-ticket` responde 401 sin sesión y 403 a un usuario con sesión pero sin compra (probado con usuario desechable, borrado después). Token de 4 horas, `sub` = UID del Live Input.
- Antes de que empiece la emisión, Cloudflare responde 204 al manifiesto: la página muestra "Esperando la señal" y reintenta cada 15 s hasta que haya transmisión.
- Ajuste hecho en el camino: `CF_STREAM_CUSTOMER_CODE` puede llevar el dominio completo; el servidor lo normaliza.
- Pendiente de medir en el ensayo largo (fase 6): retraso emisión → reproductor, reconexión al cortar OBS, celular y minutos consumidos en Stream analytics.
- Medido el 26 oct: retraso emisión → celular de unos 55 a 60 s con OBS en configuración por defecto. Para bajarlo en la fase 6: intervalo de fotogramas clave de 2 s en el emisor (OBS: Output → Keyframe Interval = 2; StreamYard lo trae así) y probar *Low-Latency HLS* (beta) en un Live Input de ensayo. Con HLS normal lo esperable es 15 a 30 s.

## Fase 6: StreamYard como emisor (pasos)

1. Plan: en https://streamyard.com/pricing elegir el plan más bajo que tenga a la vez **Custom RTMP destination**, **1080p** y **descarga de grabaciones** (comparar la tabla; no asumir precios). Contratar solo por el mes del bootcamp.
2. En Cloudflare, Live inputs → `bootcamp-clase-1` → activar **Low-Latency HLS Support (Beta)**; repetir en la 2 y la 3.
3. En StreamYard: Destinations → Add a destination → **Custom RTMP** → nombre `Cloudflare clase 1`, RTMP URL = la RTMPS URL del live input, Stream key = su key. Repetir para las clases 2 y 3 (un destino por clase).
4. Crear un broadcast de prueba con el destino de la clase 1, resolución 1080p, y preparar las escenas: presentador, presentador + PDF, Gemini a pantalla completa, Gemini + presentador en miniatura, pausa. Comprobar que al cambiar de escena la pantalla compartida siga disponible.
5. Go live. El agente pone la clase 1 en vivo desde la consola y la abre en el Chrome de Sergio: medir el retraso (decir una palabra y cronometrar hasta verla), probar celular, cortar y retomar la emisión (la página reconecta), y al terminar descargar la grabación desde la biblioteca de StreamYard para verificar que sea completa.
6. Registrar: retraso medido, calidad, minutos consumidos en Stream analytics.

## GATE 6: ensayo con StreamYard (26 oct 2026, 17:50 a 18:20)

- Plan contratado: StreamYard Core mensual (RTMP personalizado, 1080p, grabación en la nube y descarga). Tres destinos Custom RTMP (`Cloudflare clase 1/2/3`) con la URL RTMPS y la key de cada live input. Low-Latency HLS activado en los tres live inputs. StreamYard emite con fotogramas clave cada 2 s (segmentos de 2 s en el manifiesto).
- Latencia medida con un reloj (time.is) compartido en pantalla:
  - Reproductor iframe de Cloudflare: 11 a 12 s (no usa LL-HLS aunque esté activado en el live input).
  - Manifiesto `?protocol=llhls` (PART-TARGET 0.5, PART-HOLD-BACK 1.5) con hls.js en modo baja latencia: 2 a 4 s en Chrome de escritorio, con derivas puntuales hasta 7 s; iPhone (HLS nativo de Safari): 6 a 7 s.
  - Decisión: `bootcamp-clase.html` usa hls.js LL-HLS (Safari sin MSE: HLS nativo) sobre el manifiesto firmado; botón "Modo estable" que cambia al iframe de Cloudflare; caída automática al iframe tras 3 fallos seguidos con señal presente. Cloudflare marca la bandera `protocol=llhls` como beta: por eso existe el modo estable.
- Dos errores encontrados y corregidos en el ensayo:
  1. Al terminar la emisión, el reproductor se quedaba congelado en el último cuadro: ahora detecta el fin (ENDLIST o `ended`), muestra "La señal se cortó" y vuelve a "Esperando la señal"; al reanudar la emisión retoma solo (comprobado: retomó unos 30 s después de dar Transmitir en vivo).
  2. Los tickets de video y chat se pedían con el token de sesión capturado al cargar; el token de Supabase dura 1 h y la clase 2 h, así que a la hora "Reconectar" devolvía "Inicia sesión para ver la clase". Ahora cada petición usa el token vigente y, si el ticket falla, reintenta solo cada 20 s.
- iPhone: la primera vez el botón grande de reproducir no arrancó (sesión del 26 oct, antes del arreglo); ahora, si el toque falla, pasa solo al iframe de Cloudflare. En la segunda prueba el botón funcionó y el retraso fue de 6 s.
- Chat: mensajes en sala desde escritorio y celular, "2 en sala".
- Lección de StreamYard: crear SIEMPRE la transmisión con "Estudio reutilizable"; sin él, al dar "Finalizar" no se puede volver a emitir y toca crear otra transmisión (nuevo enlace). Con el estudio reutilizable, un corte se resuelve dando Transmitir en vivo otra vez.
- Cierre del ensayo: las dos grabaciones se descargaron completas desde Biblioteca. Cloudflare: 1 video guardado, 7 de 1.000 minutos de almacenamiento (la copia automática del directo; se puede borrar en Stream → Videos). Clase 1 devuelta a `scheduled`, chat en `off` y sala reiniciada.
