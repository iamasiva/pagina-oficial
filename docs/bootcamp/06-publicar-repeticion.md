# Publicar la repetición de una clase

Cuando una clase termina queda en `ended_pending_upload` (tarjeta "Grabación en preparación"). La repetición se publica con el enlace del video en YouTube: es un cambio en la base de datos (Supabase), no en los archivos del sitio, así que no hay despliegue y se ve al instante.

## Pasos

1. **Editar la grabación** que descarga StreamYard (si hace falta) y exportarla en 1080p.
2. **Subirla a YouTube como No listado** desde el canal de IA MASIVA, con miniatura 1280x720. YouTube tarda entre 1 y 3 horas en procesar un video de casi 3 h; se puede publicar en cuanto el video abre, aunque todavía le falte la calidad alta.
3. **Publicar** con el script (lee la clave de servicio de `~/.config/iamasiva/supabase.env`, que vive solo en el Mac de Sergio):

   ```bash
   python3 scripts/bootcamp-publicar-repeticion.py 2 https://youtu.be/XXXXXXXXXXX
   ```

   El script comprueba que YouTube ya sirve el video (si está privado o no existe, no cambia nada), guarda `grabacion_url` y pasa la clase a `evergreen_ready`. Con `--probar` solo muestra el estado actual.

4. **Comprobar**: `bootcamp-clase.html?n=2` muestra el reproductor de YouTube con el panel de Comentarios, y la tarjeta de la clase en `recurso-bootcamp.html` dice "Repetición disponible". Cuando las tres clases están en `evergreen_ready`, el home del bootcamp dice "Bootcamp completo".

5. **Hotmart Club** (después, sin prisa): crear la lección de la clase en el área de miembros y guardar su enlace con `--hotmart <url>` o editando `hotmart_lesson_url` en la tabla. Si no hay `grabacion_url`, la tarjeta manda a esa lección.

## Qué toca cada cosa

| Campo de `bootcamp_clases` | Para qué |
|---|---|
| `estado` | `evergreen_ready` = repetición disponible |
| `grabacion_url` | Enlace `https://youtu.be/<id>` (no listado); la página saca el id y monta el reproductor |
| `hotmart_lesson_url` | Lección en Hotmart Club, respaldo si no hay grabación |
| `actualizado_en` | Fecha del cambio |

La consola `bootcamp-admin.html` también permite cambiar el estado, pero no comprueba YouTube.
