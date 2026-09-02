-- Radiografía del embudo de pago (2026-09-02, pedido de Cata): dos eventos
-- nuevos en pago.html para medir dónde se pierde la gente antes de Wompi.
--   visita_pago: llegó a la pantalla de pago
--   marco_consentimiento: marcó la casilla (primera vez en esa visita)
alter table public.eventos drop constraint if exists eventos_tipo_check;
alter table public.eventos add constraint eventos_tipo_check
  check (tipo in ('visita_sitio','visita_landing','clic_comprar','visita_landing_recurso','apertura_recurso_publico','clic_whatsapp','visita_pago','marco_consentimiento'));
