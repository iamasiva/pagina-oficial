-- Nuevo tipo de evento: clic en el botón flotante de WhatsApp de las landings
-- de venta ("¿Tienes dudas? Escríbenos"). Amplía el check de eventos.tipo.
alter table public.eventos drop constraint if exists eventos_tipo_check;
alter table public.eventos add constraint eventos_tipo_check
  check (tipo in ('visita_sitio','visita_landing','clic_comprar','visita_landing_recurso','apertura_recurso_publico','clic_whatsapp'));
