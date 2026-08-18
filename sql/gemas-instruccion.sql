-- Agente local (recurso 400): las gemas propias pueden guardar su instruccion
-- para poder generar el bloque del agente local. Las de catalogo no la usan
-- (su instruccion vive en premium_items.data.configuracion).
alter table user_gemas add column if not exists instruccion text;
