-- Receta de conexión MCP de NotebookLM, actualizable SIN deploy.
-- La leen recurso-557 (bloques de Conectar) y recurso-400 (agente local).
-- Para actualizarla en el futuro: UPDATE de la fila mcp_notebooklm y listo.
-- Correr completo en el editor SQL de Supabase.

create table if not exists public.app_config (
  clave text primary key,
  valor jsonb not null,
  actualizado_en timestamptz not null default now()
);

alter table public.app_config enable row level security;

drop policy if exists "config legible autenticado" on public.app_config;
create policy "config legible autenticado" on public.app_config
  for select to authenticated using (true);
-- (sin política de escritura: solo el service role escribe)

insert into public.app_config (clave, valor) values ('mcp_notebooklm', jsonb_build_object(
  'paso1_es', 'PASO 1 · Conexión con mis cuadernos (solo la primera vez): si esta sesión aún no tiene herramientas de NotebookLM, instala el plugin mantenido "notebooklm" de roomi-fields. En Claude Code: ejecuta `claude plugin marketplace add roomi-fields/claude-plugins` y `claude plugin install notebooklm@roomi-fields`; luego corre `npx -y -p @roomi-fields/notebooklm-mcp notebooklm-mcp-setup-auth` y déjame iniciar sesión con Google en la ventana que se abre (la sesión queda guardada solo en mi máquina y no se repite). En otras herramientas: registra como servidor MCP el comando `npx -y @roomi-fields/notebooklm-mcp@latest` y corre el mismo setup-auth. Si aparece "Executable doesn''t exist ... chromium", instala el navegador con `patchright install chromium` y reintenta. Si la conexión falla en el futuro, casi siempre es la sesión de Google: corre de nuevo el setup-auth. NO uses los paquetes notebooklm-mcp-2026 ni notebooklm-mcp de PleasePrompto: están rotos desde agosto de 2026. Nota: NotebookLM ahora se llama Gemini Notebook; los links de notebooklm.google.com y notebook.google.com apuntan al mismo cuaderno.',
  'paso1_en', 'STEP 1 · Connect to my notebooks (first time only): if this session does not have NotebookLM tools yet, install the maintained "notebooklm" plugin by roomi-fields. In Claude Code: run `claude plugin marketplace add roomi-fields/claude-plugins` and `claude plugin install notebooklm@roomi-fields`; then run `npx -y -p @roomi-fields/notebooklm-mcp notebooklm-mcp-setup-auth` and let me sign in with Google in the window that opens (the session is stored only on my machine and does not repeat). In other tools: register the command `npx -y @roomi-fields/notebooklm-mcp@latest` as an MCP server and run the same setup-auth. If you see "Executable doesn''t exist ... chromium", install the browser with `patchright install chromium` and retry. If the connection ever fails later, it is almost always the Google session: run setup-auth again. Do NOT use the packages notebooklm-mcp-2026 or PleasePrompto''s notebooklm-mcp: both broken since August 2026. Note: NotebookLM is now called Gemini Notebook; notebooklm.google.com and notebook.google.com links point to the same notebook.',
  'conocimiento_400', 'Conecta además estos cuadernos de NotebookLM (hoy Gemini Notebook), que son parte del conocimiento de mi gema. Para conectarlos usa el plugin mantenido "notebooklm" de roomi-fields: en Claude Code ejecuta `claude plugin marketplace add roomi-fields/claude-plugins` y `claude plugin install notebooklm@roomi-fields`, luego corre `npx -y -p @roomi-fields/notebooklm-mcp notebooklm-mcp-setup-auth` y déjame iniciar sesión con Google (una sola vez; si la sesión caduca, corre de nuevo el setup-auth y me pides entrar). En otras herramientas registra como servidor MCP `npx -y @roomi-fields/notebooklm-mcp@latest`. Si sale "Executable doesn''t exist ... chromium", corre `patchright install chromium` y reintenta. NO uses los paquetes notebooklm-mcp-2026 ni notebooklm-mcp de PleasePrompto: están rotos desde agosto de 2026. Consulta estos cuadernos como fuentes vivas cuando la gema trabaje:'
)) on conflict (clave) do update set valor = excluded.valor, actualizado_en = now();
