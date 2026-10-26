# Fase 4: chat en vivo, moderable e independiente del video

## Piezas

- `cloudflare/chat/` (Worker `bootcamp-chat` + Durable Object `SalaChat`, una sala por clase). WebSockets con la API de hibernación. El Worker verifica el ticket HMAC y pasa la conexión a la sala; la sala guarda modo, anuncio, últimos 150 mensajes, preguntas y silenciados en su almacenamiento, aplica límites y reparte. No consulta Supabase nunca.
- `api/bootcamp-chat-ticket.js` (Vercel): con sesión, compra aprobada (o admin), clase en sala o en vivo y chat no cerrado, firma un ticket HMAC-SHA256 de 3 horas con `u` (usuario), `n` (clase), `r` (admin o alumno), `a` (alias: nombre del perfil, nunca el correo) y devuelve la URL `wss://.../sala/<n>?t=<ticket>`.
- `bootcamp-clase.html`: panel con pestañas Chat y Preguntas para Sergio; se conecta solo en sala o en vivo, después del reproductor; si el chat falla, muestra el aviso y reintenta con espera creciente (5 s → 60 s) sin tocar el video.

## Reglas en la sala

- Mensaje máximo 280 caracteres; sin enlaces para alumnos; texto escapado al pintar (sin HTML).
- Límite por usuario: un mensaje cada 2 s en modo normal, cada 30 s en `slow_mode`, cada 10 s en `questions_only`.
- Modos: `normal`, `slow_mode`, `questions_only` (solo la pestaña de preguntas), `read_only` (nadie escribe), `off` (nadie entra; los admins sí). El cambio se difunde al instante, sin redeploy.
- Moderación (solo rol admin, desde el mismo panel): fijar anuncio, borrar mensaje o pregunta, silenciar 10 min, destacar pregunta, marcar respondida, limpiar el chat.
- Alias: primer nombre e inicial del apellido del perfil; "Alumno" si no hay nombre.
- Al terminar la clase (estado distinto de sala o en vivo) la página cierra el WebSocket.

## Secretos y variables

- `CHAT_TICKET_SECRET`: el mismo valor en Vercel (Production) y en el Worker (`npx wrangler secret put CHAT_TICKET_SECRET`). Generar con `openssl rand -hex 32`. Nunca en el repositorio.
- `CHAT_WS_URL` (Vercel): la URL del Worker, por ejemplo `https://bootcamp-chat.<subdominio>.workers.dev`.

## Despliegue

1. Una vez, en la Terminal de Sergio: `npx wrangler login` (abre el navegador y autoriza la cuenta de Cloudflare).
2. `cd cloudflare/chat && npx wrangler deploy` (lo puede correr el agente desde el repositorio una vez hecho el login). La primera vez pide elegir el subdominio `*.workers.dev`.
3. `npx wrangler secret put CHAT_TICKET_SECRET` y pegar el secreto. Poner el mismo en Vercel junto con `CHAT_WS_URL`, y Redeploy.

## Capacidad

Una sala por clase en un solo Durable Object. Con hibernación, una sala aguanta miles de conexiones; el límite real es el reparto de mensajes: en `normal` con cientos de personas escribiendo, el volumen crece rápido. Por eso el runbook sube a `slow_mode` o `questions_only` cuando el chat se satura (fase 7: medir con 100, 1.000 y, si aplica, 10.000 conexiones antes de prometer nada; el plan gratuito de Workers sirve para ensayar, para el evento conviene Workers Paid, $5 al mes).

## GATE 4: cumplido el 26 oct 2026

Worker desplegado en `https://bootcamp-chat.estraticaoperativo-1a0.workers.dev` (subdominio ya existente de la cuenta; es interno, los alumnos no lo ven). Secreto compartido puesto en el Worker y en Vercel; `CHAT_WS_URL` en Vercel.

Prueba con dos usuarios reales contra producción: Sergio como admin desde Chrome y una compradora desechable (compra aprobada, borrada al terminar) desde un cliente WebSocket en Node:
- Los dos se vieron entre sí ("2 en sala"); mensajes de ida y vuelta al instante.
- Segundo mensaje inmediato de la alumna: rechazado ("Espera 2 s"). Mensaje con enlace: rechazado.
- Pregunta de la alumna llegó a la pestaña de preguntas; el admin la destacó y la alumna recibió la actualización.
- Anuncio fijado por el admin llegó a la alumna; cambio a `slow_mode` y vuelta a `normal` se reflejaron sin recargar.
- Intento de la alumna de cambiar el modo (`modo: off`): ignorado por la sala.
- Ids de usuario: la sala reparte un hash corto, no el id real; los correos nunca viajan.
- Pendiente para el ensayo largo (fase 6): corte del WebSocket con el video emitiendo y reconexión automática, y chat en celular con teclado abierto.

Después de las pruebas, la sala de la clase 1 se reinició con el botón "Reiniciar sala" (mensajes, preguntas, anuncio y modo a cero).
