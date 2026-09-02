-- Respaldo de la TRM oficial (2026-09-02): datos.gov.co falla intermitente y
-- sin TRM el checkout no puede iniciar NINGUN pago (falla invisible: no queda
-- rastro). El servidor guarda aqui la ultima TRM oficial buena y la usa como
-- respaldo hasta 10 dias si el API esta caido. Escribe y lee solo el service
-- role (las funciones del servidor); nadie mas la ve.
create table if not exists public.trm_respaldo (
  id int primary key,
  valor numeric not null,
  fecha date not null
);
alter table public.trm_respaldo enable row level security;
-- sin politicas: solo el service role (que las salta) puede leer y escribir
