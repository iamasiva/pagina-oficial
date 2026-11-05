-- Bootcamp Gemini de 0 a 100: clases y banderas operativas (fase 1 del plan maestro).
-- DDL: la corre Sergio en el editor SQL de Supabase con las pestañas del sitio cerradas.
-- Producto: 6c01d354-e05d-47be-a6d6-3075abcc16d3 (products, tipo workshop, $97).
-- Los UID de Cloudflare y las stream keys NO van aquí: viven en variables de entorno de Vercel.

create table if not exists public.bootcamp_clases (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products(id) on delete cascade,
  numero         int  not null check (numero between 1 and 9),
  titulo         text not null,
  inicio_utc     timestamptz not null,
  duracion_min   int  not null default 120,
  estado         text not null default 'scheduled'
                 check (estado in ('scheduled','lobby','live','ended_pending_upload','evergreen_ready','rescheduled','cancelled')),
  hotmart_lesson_url text,
  aviso          text,
  actualizado_en timestamptz not null default now(),
  unique (product_id, numero)
);

alter table public.bootcamp_clases enable row level security;

-- Fechas y estados no son secretos (están en la landing); el video y el chat se
-- protegen con tickets en el servidor. Leen los autenticados, edita solo admin.
drop policy if exists "clases: leen autenticados" on public.bootcamp_clases;
create policy "clases: leen autenticados" on public.bootcamp_clases
  for select to authenticated using (true);

drop policy if exists "clases: edita admin" on public.bootcamp_clases;
create policy "clases: edita admin" on public.bootcamp_clases
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));

grant select, insert, update, delete on public.bootcamp_clases to authenticated;

create table if not exists public.bootcamp_config (
  product_id       uuid primary key references public.products(id) on delete cascade,
  admin_only       boolean not null default true,   -- staging: solo el equipo entra al home y a las clases
  video_enabled    boolean not null default false,  -- el servidor no emite tickets de video si está en false
  chat_mode        text not null default 'off'
                   check (chat_mode in ('normal','slow_mode','questions_only','read_only','off')),
  anuncio          text,
  hotmart_curso_url text,                            -- índice del curso en Hotmart Club (fallback de los deep links)
  actualizado_en   timestamptz not null default now()
);

alter table public.bootcamp_config enable row level security;

drop policy if exists "config bootcamp: leen autenticados" on public.bootcamp_config;
create policy "config bootcamp: leen autenticados" on public.bootcamp_config
  for select to authenticated using (true);

drop policy if exists "config bootcamp: edita admin" on public.bootcamp_config;
create policy "config bootcamp: edita admin" on public.bootcamp_config
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));

grant select, insert, update, delete on public.bootcamp_config to authenticated;

-- Semilla: 3 clases a las 7:00 pm de Bogotá (UTC-5), 3, 4 y 5 de noviembre de 2026.
insert into public.bootcamp_clases (product_id, numero, titulo, inicio_utc, duracion_min) values
  ('6c01d354-e05d-47be-a6d6-3075abcc16d3', 1, 'Gemini primeros pasos',                          timestamptz '2026-11-03 19:00:00-05', 120),
  ('6c01d354-e05d-47be-a6d6-3075abcc16d3', 2, 'Proyectos grandes con Gemini',                   timestamptz '2026-11-04 19:00:00-05', 120),
  ('6c01d354-e05d-47be-a6d6-3075abcc16d3', 3, 'Gemini para automatización y trabajo agéntico',  timestamptz '2026-11-05 19:00:00-05', 120)
on conflict (product_id, numero) do update
  set titulo = excluded.titulo, inicio_utc = excluded.inicio_utc, duracion_min = excluded.duracion_min, actualizado_en = now();

insert into public.bootcamp_config (product_id, admin_only, video_enabled, chat_mode)
values ('6c01d354-e05d-47be-a6d6-3075abcc16d3', true, false, 'off')
on conflict (product_id) do nothing;
