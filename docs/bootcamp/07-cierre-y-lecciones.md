# Cierre del Bootcamp Gemini de 0 a 100 (3, 4 y 5 de noviembre de 2026)

## Resultado

- 37 accesos aprobados: 19 pagados por Hotmart y 18 por bono (regalo a clientes y equipo). 1.843 USD registrados en `purchases`.
- Picos de venta: 31 de octubre (13, correo 2) y 3 de noviembre (12, día de la clase 1).
- Origen etiquetado: 9 Instagram, 4 correo, 1 Facebook, 1 TikTok; 20 sin UTM (link de la bio y directo).
- 36 compras quedaron en PENDIENTE (llegaron al pago y no terminaron): lista para una oferta evergreen.

## Qué funcionó

- Directo propio: StreamYard → Cloudflare Stream → reproductor en bootcamp-clase.html con chat en Worker. Paso automático a "en vivo" al detectar la señal (`api/bootcamp-senal`, vigilado con curl cada 20 s desde las 6:50 pm).
- Repeticiones en YouTube no listado publicadas la misma noche con `scripts/bootcamp-publicar-repeticion.py` (lee el enlace de `trabajo/bootcamp-repeticiones.json`, nunca lo imprime). Lecciones en Hotmart guardadas con `--hotmart`.
- Recursos por clase con apertura por fecha, certificado en PDF que se abre al terminar la clase 3, comentarios en la repetición y edición de mensajes en el chat (pedido de los alumnos).
- Protocolo del directo tras el incidente de la clase 2: reiniciar el Mac antes de las 6 pm, más de 20 GB libres, cargador, Ethernet. En la clase 3 la memoria libre nunca bajó del 32 % con Chrome, Claude, Antigravity, VS Code y Terminal abiertos; cero caídas de pantalla.

## Qué falló y cómo se corrigió

- Clase 2: la pantalla compartida se expulsó 25 veces. Causa: Mac sin reiniciar y disco al 100 % (339 MB libres). Se editó la grabación (10:39 menos) antes de subirla.
- Antigravity no hacía commit al terminar: se resolvió con AGENTS.md en la raíz y la frase "Al terminar haz commit y push a main".
- El título de la clase 3 en YouTube salió como "Clase 2": revisar el título antes de publicar.
- StreamYard graba también en local (en Chrome) y la subida tarda: la grabación que usamos es la de la nube, la local es opcional.

## Checklist de cierre operativo (6 nov 2026)

- [x] Landing bootcamp.html evergreen (6 nov: $97, sin fechas ni Black Friday, garantía de 7 días de Hotmart).
- [x] Home: tarjeta del bootcamp como primera oferta, sin fechas. App: primera lámina del carrusel con el hero del bootcamp (6 nov). Popup de producto.html ofrece el bootcamp en piezas y pack.
- [x] Hotmart: precio base $97 sin fecha de fin, descripciones evergreen; 8 ofertas de precio fijo para completar desde las herramientas (6 nov).
- [x] Instagram y ManyChat: bio y automatizaciones en modo evergreen (Sergio, 6 nov).
- [ ] Correo de cierre a compradores: borrador #22 en Brevo, PENDIENTE de reescribir el domingo 8 nov como agradecimiento + formulario de mejora (Google Forms). El correo a pendientes se descartó: solo 5 sin compra.
- [ ] YouTube: comentarios apagados (hecho 6 nov); faltan los capítulos en las descripciones (archivos capitulos-youtube.txt de las clases 2 y 3) y la lista no listada.
- [x] Cloudflare: grabaciones borradas, Stream cancelado (vence 26 nov), Workers en Free (6 nov).
- [x] Brevo: cambio de plan ya programado para la facturación del 25 de noviembre.
- [x] StreamYard: autorrenovación apagada (plan Core hasta el 26 nov); bajar el original de la clase 3 antes de esa fecha si se quiere el máster.
- [x] Seguridad: clave de servicio rotada el 6 nov (ia_masiva_26 en el archivo local y en Vercel; la vieja "default" la borra Sergio).
- [ ] Chat del bootcamp en "cerrado" (hecho el 6 nov).

## Para el próximo bootcamp

- Ensayo completo con las apps que se van a mostrar abiertas, midiendo memoria (`trabajo/medir-memoria.sh`).
- Excluir del público de ventas a quien recibió el bono y avisar que el regalo no sale en Hotmart.
- Grabar el nombre y correo de quien pide cosas en el chat: la sala solo guarda los últimos 150 mensajes.
