-- ═══ URGENTE: cerrar la auto-promoción a admin ═══
-- Hallazgo: cualquier usuario autenticado podía hacer
--   PATCH /rest/v1/profiles?id=eq.<su-id>  { "es_admin": true }
-- y quedar admin. Ser admin abre TODO el contenido premium (premium_items y
-- /api/contenido confían en es_admin). Bypass total del paywall.
--
-- Arreglo: quitarle a los roles del navegador (authenticated, anon) el permiso
-- de escribir la columna es_admin. El resto del perfil (nombre) sigue editable.
-- Solo el service_role (servidor) puede tocar es_admin. Correr en el editor SQL
-- de Supabase con las pestañas del sitio cerradas.

revoke update (es_admin) on public.profiles from authenticated, anon;

-- Cinturón y tirantes: aunque alguien re-otorgue el permiso por error, este
-- trigger impide que un cliente cambie es_admin. Solo el service_role pasa.
create or replace function public.proteger_es_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.es_admin is distinct from old.es_admin
     and current_setting('request.jwt.claim.role', true) is distinct from 'service_role'
  then
    raise exception 'es_admin solo lo cambia el servidor';
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_es_admin on public.profiles;
create trigger proteger_es_admin
  before update on public.profiles
  for each row execute function public.proteger_es_admin();
