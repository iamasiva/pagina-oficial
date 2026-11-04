-- Comentarios de las clases del bootcamp en repetición (3 nov 2026).
-- Cuando la clase terminó (ended_pending_upload o evergreen_ready), el panel del
-- chat en bootcamp-clase.html se convierte en una sección de Comentarios
-- permanente: cada alumno deja comentarios o preguntas, los ven todos los del
-- bootcamp y las respuestas de Sergio (o de quien modera) salen destacadas.
--
-- Toda lectura y escritura pasa por api/bootcamp-comentarios.js con la llave de
-- servicio, que valida compra, estado de la clase y permisos. Por eso la tabla
-- NO tiene políticas para authenticated: sin GRANT y con RLS, solo entra service_role.
-- Regla de la casa (sql/_plantilla-tabla-nueva.sql): GRANT + RLS en el mismo archivo.

create table if not exists public.bootcamp_comentarios (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null,
  numero      int  not null check (numero between 1 and 9),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nombre      text not null default 'Alumno',
  texto       text not null check (char_length(texto) between 1 and 1000),
  parent_id   uuid references public.bootcamp_comentarios(id) on delete cascade,
  es_equipo   boolean not null default false,
  borrado     boolean not null default false,
  creado_en   timestamptz not null default now()
);

create index if not exists bootcamp_comentarios_clase_idx
  on public.bootcamp_comentarios (product_id, numero, creado_en);

grant select, insert, update, delete on public.bootcamp_comentarios to service_role;

alter table public.bootcamp_comentarios enable row level security;
-- Sin políticas a propósito: anon y authenticated no tienen GRANT ni filas.

-- Verificación (debe listar solo service_role):
-- select grantee, privilege_type from information_schema.role_table_grants
--  where table_schema = 'public' and table_name = 'bootcamp_comentarios';
