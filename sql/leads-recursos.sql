-- Embudo de recursos gratuitos: ManyChat → landing → correo → recurso público
-- (1) slug en guides, (2) tabla de leads, (3) eventos del embudo, (4) slugs sembrados

-- 1) Slug para URLs de landing: iamasiva.co/r/<slug>
alter table public.guides add column if not exists slug text;
create unique index if not exists guides_slug_unico on public.guides (slug) where slug is not null;

-- 2) Leads: escribe SOLO el servidor (service key); lee solo el admin
create table if not exists public.leads_recursos (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  guide_id uuid references public.guides(id) on delete set null,
  slug text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  creada_en timestamptz not null default now(),
  unique (email, guide_id)
);
alter table public.leads_recursos enable row level security;
create policy "admin lee leads" on public.leads_recursos
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));
create index if not exists leads_recursos_fecha_idx on public.leads_recursos (creada_en desc);
create index if not exists leads_recursos_guia_idx on public.leads_recursos (guide_id, creada_en desc);

-- 3) El embudo registra visitas de landing y aperturas del visor público
alter table public.eventos add column if not exists guide_id uuid references public.guides(id);
alter table public.eventos drop constraint if exists eventos_tipo_check;
alter table public.eventos add constraint eventos_tipo_check
  check (tipo in ('visita_sitio','visita_landing','clic_comprar','visita_landing_recurso','apertura_recurso_publico'));

-- 4) Slugs de las guías ya mapeadas a automatizaciones (títulos exactos de la base)
update public.guides set slug = '200-codigos-chatgpt' where titulo = '200 códigos para ChatGPT';
update public.guides set slug = 'prompts-investigaciones-notebooklm' where titulo = 'Prompts para buenas investigaciones en NotebookLM';
update public.guides set slug = 'notebooklm-obsidian' where titulo = 'Todo lo que debes saber de NotebookLM, Obsidian y Claude Code';
update public.guides set slug = 'codigos-gemini' where titulo = 'Usa códigos de IA en Gemini';
update public.guides set slug = 'prompts-alucinaciones-gemini' where titulo = 'Prompts contra alucinaciones en Gemini';
update public.guides set slug = 'claude-code-playwright' where titulo = 'Domina Claude Code y Playwright';
update public.guides set slug = 'gemini-omni' where titulo = 'Edita video con IA usando Gemini Omni';
update public.guides set slug = 'carruseles-chatgpt' where titulo = 'Crea carruseles consistentes con ChatGPT';
update public.guides set slug = 'resume-documentos-gemini' where titulo = 'Resume documentos y PDFS con Google Gemini';
update public.guides set slug = '10-herramientas-google' where titulo = '10 Herramientas de Google';
update public.guides set slug = 'finanzas-claude' where titulo = 'Guía de finanzas con Claude IA Masiva';
update public.guides set slug = 'agente-whatsapp' where titulo = 'Crea tu agente de WhatsApp con Claude Code';
update public.guides set slug = 'agentes-que-navegan' where titulo = 'Agentes que navegan en internet';
update public.guides set slug = '3-servicios-ia' where titulo = 'Tres servicios de IA para empezar a monetizar';
update public.guides set slug = 'mesa-creativa' where titulo = 'Prompt Mesa Creativa de 3 Directores';
update public.guides set slug = 'constructor-notebooklm' where titulo = 'Constructor de prompts con NotebookLM';
update public.guides set slug = 'claude-design' where titulo = 'Guía completa para utilizar Claude Design';
update public.guides set slug = 'nano-banana' where titulo = 'Prompts para Nano Banana, gema de Gemini';
update public.guides set slug = 'paginas-claude-code' where titulo = 'Crea páginas profesionales con Claude Code';
update public.guides set slug = 'investigador-pro' where titulo = 'Investigador Pro, gema de Gemini';
update public.guides set slug = 'cursos-claude' where titulo = 'Cursos oficiales de Claude';
update public.guides set slug = '10-cursos-google' where titulo = '10 Cursos de Google sobre IA';
update public.guides set slug = '4-academias-ia' where titulo = '4 Academias oficiales para dominar la IA';
update public.guides set slug = 'prompt-translator' where titulo = 'Prompt Translator';
update public.guides set slug = 'analisis-mundial-2026' where titulo = 'Análisis de datos con IA – Predicción Mundial 2026';
