-- Cierra el LISTADO público del bucket "contenido" (10 nov 2026). Correr en Supabase > SQL Editor.
--
-- Antes: la política "Lectura pública contenido" dejaba que cualquier visitante pidiera la
-- lista de todos los archivos del bucket (los ZIP de los 25 agentes, el PDF del mapa, la
-- skill del 61, los materiales de los ejercicios).
-- Después: solo un admin con sesión puede listar. Los archivos se siguen abriendo por su
-- enlace directo (el bucket es público para servir archivos; eso no depende de esta
-- política), así que las guías gratuitas y los enlaces internos de los recursos no cambian.
-- La lectura del admin se conserva porque el formulario de administración la necesita al subir.

drop policy if exists "Lectura pública contenido" on storage.objects;

drop policy if exists "Admin lee contenido" on storage.objects;
create policy "Admin lee contenido" on storage.objects
  for select to authenticated
  using (bucket_id = 'contenido' and exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.es_admin = true));

-- Verificación: debe salir "Admin lee contenido" y "Admin sube contenido", y NO "Lectura pública contenido"
select policyname, cmd, roles from pg_policies
 where schemaname = 'storage' and tablename = 'objects' and policyname ilike '%contenido%'
 order by policyname;
