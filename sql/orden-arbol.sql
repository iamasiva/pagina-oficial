-- Orden del árbol de Mis cuadernos (557): el árbol del Arquitecto tiene una
-- secuencia con intención y la interfaz la mostraba alfabética/invertida.
-- Correr completo en el editor SQL de Supabase ANTES del deploy del arreglo.

alter table public.user_cuaderno_categorias
  add column if not exists orden int;
alter table public.user_cuadernos
  add column if not exists orden int;
