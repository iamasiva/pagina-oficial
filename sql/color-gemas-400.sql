-- Feature del 400: el usuario puede cambiar el color de sus gemas guardadas
-- (paleta de 25 colores desde el menu de tres puntos). NULL = color por
-- defecto (azul para las del catalogo, dorado para las propias).

alter table public.user_gemas add column color text;

-- Verificacion: la columna existe
select column_name, data_type from information_schema.columns
where table_name = 'user_gemas' and column_name = 'color';
