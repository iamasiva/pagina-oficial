-- 400 Skills · Mis agentes: nota personal "¿Para qué es?" separada de la descripción
-- de la skill (la descripción es la que Gemini lee; la nota es para acordarse).
-- DDL: la corre Sergio en el editor SQL de Supabase. Idempotente. La tabla ya
-- existe con sus GRANT y su RLS, así que la columna nueva hereda los permisos.

alter table public.user_gemas add column if not exists nota text;

-- Verificación
select column_name, data_type from information_schema.columns
 where table_schema = 'public' and table_name = 'user_gemas' and column_name = 'nota';
