-- ═══ Orden de la sección "Nuevo en IA MASIVA" ═══
-- pin_nuevo: 1-3 = guía de pago fijada de primera (null = no fijada).
-- orden_nuevo: posición manual de las gratuitas (null = recién subida, va primero).
alter table public.guides
  add column if not exists pin_nuevo integer,
  add column if not exists orden_nuevo integer;
