-- 200 Diseños: "Importar diseño" en Mis diseños (29 oct 2026)
--
-- Un diseño importado no viene del catálogo: no tiene item_id y su plantilla
-- (variables, firma y blueprints que entrega la skill) vive en la fila.
-- Las columnas nuevas heredan los permisos de user_disenos (no es tabla nueva).

alter table public.user_disenos alter column item_id drop not null;
alter table public.user_disenos add column if not exists plantilla jsonb;
alter table public.user_disenos add column if not exists miniatura text;   -- ruta en el bucket disenos-usuarios

alter table public.user_disenos drop constraint if exists user_disenos_origen_chk;
alter table public.user_disenos add constraint user_disenos_origen_chk
  check (item_id is not null or plantilla is not null);

-- Miniaturas privadas: cada persona solo ve y toca su propia carpeta <uid>/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('disenos-usuarios', 'disenos-usuarios', false, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "disenos-usuarios: ver propias" on storage.objects;
create policy "disenos-usuarios: ver propias" on storage.objects
  for select to authenticated
  using (bucket_id = 'disenos-usuarios' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "disenos-usuarios: subir propias" on storage.objects;
create policy "disenos-usuarios: subir propias" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'disenos-usuarios' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "disenos-usuarios: cambiar propias" on storage.objects;
create policy "disenos-usuarios: cambiar propias" on storage.objects
  for update to authenticated
  using (bucket_id = 'disenos-usuarios' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'disenos-usuarios' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "disenos-usuarios: borrar propias" on storage.objects;
create policy "disenos-usuarios: borrar propias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'disenos-usuarios' and (storage.foldername(name))[1] = auth.uid()::text);

-- Revisión (lo último que muestra el editor): las políticas de user_disenos
-- deben depender solo de user_id para que acepten filas sin item_id.
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'user_disenos';
