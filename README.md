# IA MASIVA · sitio oficial

Sitio de [iamasiva.co](https://iamasiva.co): catálogo de recursos de inteligencia artificial, área de compradores, bootcamp en vivo y recursos gratuitos.

## Stack

- **Frontend:** páginas HTML estáticas en la raíz (sin framework ni build). Cada archivo es una dirección pública: `bootcamp.html` es `iamasiva.co/bootcamp.html`.
- **Backend:** funciones serverless de Vercel en `api/` (Node) y workers de Cloudflare en `cloudflare/` (señal del directo y chat del bootcamp).
- **Datos y autenticación:** Supabase (`api.iamasiva.co`): tablas con RLS, Storage para portadas y archivos de recursos.
- **Pagos:** Hotmart (webhook en `api/`). **Correo:** Brevo. **Video en vivo:** StreamYard a Cloudflare Stream; repeticiones en YouTube no listado.
- **Despliegue:** cada push a `main` despliega en Vercel. `vercel.json` define redirecciones cortas (`/ig`, `/bootcamp`) y la ruta `/r/:slug` de recursos gratuitos.

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `/` (raíz) | Páginas del sitio, scripts compartidos (`herramientas-im.js`, `retorno-im.js`), `robots.txt`, `sitemap.xml`, iconos y `vercel.json` |
| `api/` | Funciones serverless: contenido, leads, tickets del bootcamp, webhooks |
| `cloudflare/` | Workers (señal y chat del bootcamp) |
| `docs/` | Documentación técnica (auditoría, flujos, estados y rutas del bootcamp, cómo publicar una repetición) |
| `sql/` | Migraciones y cargas de datos para Supabase. Las DDL las ejecuta el administrador en el panel de Supabase |
| `scripts/` | Utilidades de mantenimiento: manuales, correos del bootcamp, migraciones de recursos, publicar repeticiones |
| `email/` | Plantillas HTML de los correos que envía Brevo |
| `manuales/` | Manuales de uso de los recursos (se sirven como páginas) |
| `icons/`, `og/` | Iconos y imágenes para redes |
| `trabajo/` | Material de trabajo (planes, contactos, videos, identidad, borradores). Ignorado por git, no se publica |

## Convenciones

- Las páginas no se mueven de la raíz: cambiar la ruta de un HTML cambia su dirección pública y rompe enlaces, correos y campañas.
- Nada con datos de clientes, claves o contenido de pago entra al repositorio. Las credenciales viven en las variables de entorno de Vercel y, en local, en `~/.config/iamasiva/supabase.env`.
- Los textos del sitio se escriben en español, sin raya larga.
- Tablas y funciones nuevas en Supabase necesitan `GRANT` explícito para `anon`, `authenticated` y `service_role` (plantilla en `sql/_plantilla-tabla-nueva.sql`).

## Trabajo local

```bash
npm install                     # dependencias de api/ (supabase-js)
node scripts/build-manuales.mjs # regenera los manuales desde trabajo/planes-mejoras/manuales
python3 scripts/bootcamp-publicar-repeticion.py 2 https://youtu.be/ID   # publica la repetición de una clase
```

Las funciones de `api/` se prueban en Vercel (previews por rama) o con `vercel dev`.
