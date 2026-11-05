# Reglas para agentes en este proyecto

Este es el sitio de IA MASIVA (iamasiva.co). Se publica solo desde git: cada push a `main` despliega. Un cambio que queda sin commit no existe para nadie. La estructura del proyecto está en README.md.

## Publicar es parte de la tarea

Cuando termines un cambio en los archivos del sitio (páginas HTML, `api/`, `scripts/`, `docs/`, `email/`, `cloudflare/`):

1. Comprueba que el cambio funciona (abre la página o revisa el diff completo).
2. `git add` solo de los archivos que tocaste, por nombre. Nunca `git add -A` ni `git add .`.
3. Commit con mensaje en español que diga qué cambió y para qué, en una o dos frases.
4. `git push origin main`.
5. Di en tu respuesta que ya hiciste commit y push, con el hash corto de `git log -1 --oneline`. Si el push falla, dilo tal cual y no lo repitas a ciegas.

No preguntes "¿publico?". Para cambios del sitio, el commit y el push son el cierre de la tarea.

## Nunca

- Nunca subas `trabajo/`, `.claude/`, `node_modules/` ni SQL con contenido de pago: están en `.gitignore`, no los fuerces con `-f`.
- Nunca hagas `git push --force`, `git reset --hard` ni reescribas el historial.
- Nunca ejecutes SQL contra Supabase, cobres, ni envíes correos o mensajes a clientes sin que Sergio lo confirme en el chat.
- Nunca pongas claves, tokens ni enlaces privados en el código ni en los mensajes de commit.

## Estilo

- Texto del sitio en español, sin la raya larga (—). El copy vende la necesidad antes que el producto.
- Páginas HTML independientes con su CSS y JS dentro; no agregues frameworks ni pasos de build.
