-- Encuesta del Bootcamp Gemini de 0 a 100 (9 nov 2026). Correr completo en Supabase > SQL Editor.
-- La responde cualquiera con el enlace (iamasiva.co/encuesta), sin iniciar sesión.
-- Desde la página nadie puede leer respuestas: solo el admin (es_admin) y la clave de servicio.

create table if not exists public.encuesta_bootcamp (
  id                 uuid primary key default gen_random_uuid(),
  creado_en          timestamptz not null default now(),
  user_id            uuid default auth.uid() references auth.users(id) on delete set null,  -- si respondió con sesión abierta
  recomendacion      smallint not null check (recomendacion between 0 and 10),
  valioso            text check (char_length(valioso) <= 2000),
  mejorar            text check (char_length(mejorar) <= 2000),
  clase_favorita     text check (clase_favorita in ('1', '2', '3')),
  proximo_temas      text[] check (coalesce(array_length(proximo_temas, 1), 0) <= 10),
  proximo_otro       text check (char_length(proximo_otro) <= 300),
  como_se_entero     text check (char_length(como_se_entero) <= 120),
  testimonio         text check (char_length(testimonio) <= 1500),
  autoriza_publicar  boolean not null default false,
  nombre             text check (char_length(nombre) <= 120),
  origen             text check (char_length(origen) <= 200)   -- utm_source/utm_campaign del enlace
);

-- Permisos de API (desde el 30 oct 2026 las tablas nuevas los necesitan explícitos)
grant insert on public.encuesta_bootcamp to anon, authenticated;
grant select on public.encuesta_bootcamp to authenticated;
grant select, insert, update, delete on public.encuesta_bootcamp to service_role;

alter table public.encuesta_bootcamp enable row level security;

drop policy if exists "encuesta: cualquiera responde" on public.encuesta_bootcamp;
create policy "encuesta: cualquiera responde" on public.encuesta_bootcamp
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "encuesta: lee el admin" on public.encuesta_bootcamp;
create policy "encuesta: lee el admin" on public.encuesta_bootcamp
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));

-- Verificación: debe listar anon (INSERT), authenticated (INSERT, SELECT) y service_role
select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'encuesta_bootcamp' order by grantee, privilege_type;
