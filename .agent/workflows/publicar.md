---
description: Publicar los cambios del sitio (commit y push a main)
---

1. Corre `git status --short` y `git diff --stat`. Revisa que solo aparezcan los archivos que tocaste en esta tarea.
2. `git add` de esos archivos por nombre (nunca `-A` ni `.`).
3. Commit con mensaje en español: qué cambió y para qué, en una o dos frases.
4. `git push origin main`.
5. Corre `git log -1 --oneline` y reporta el hash. Si el push falló, dilo tal cual.
