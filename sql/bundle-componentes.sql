-- ═══ Composición de los packs (multi-pack, a prueba de futuro) ═══
-- Saca del código la relación "un pack contiene estos productos" y la mete en
-- la base. Crear un pack nuevo pasa a ser INSERTAR filas aquí: cero código.
-- Correr en el editor SQL de Supabase con las pestañas del sitio cerradas.

create table if not exists public.bundle_componentes (
  bundle_id    uuid not null references public.products(id) on delete cascade,
  componente_id uuid not null references public.products(id) on delete cascade,
  orden        int  not null default 0,
  primary key (bundle_id, componente_id)
);

alter table public.bundle_componentes enable row level security;

-- La composición de un pack es información de venta (pública): cualquiera la lee.
-- Escribir solo el servidor (service role) o un admin, nunca el navegador.
create policy "cualquiera ve la composición de los packs"
  on public.bundle_componentes for select using (true);

create policy "admin edita la composición de los packs"
  on public.bundle_componentes for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.es_admin));

-- Semilla: el Pack Gemini 3x actual y sus tres componentes (idéntico a hoy).
insert into public.bundle_componentes (bundle_id, componente_id, orden) values
  ('8dd3d7fa-f9f1-41dd-9539-098cb4c68e11', '656f61d7-37b2-4e9c-8cf3-67065484493c', 1),
  ('8dd3d7fa-f9f1-41dd-9539-098cb4c68e11', '0f0d6926-5328-4e3e-89a4-92b36ef13996', 2),
  ('8dd3d7fa-f9f1-41dd-9539-098cb4c68e11', '2c296299-d9a4-4409-bc99-67b4999e47f8', 3)
on conflict do nothing;
