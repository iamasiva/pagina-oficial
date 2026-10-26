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
