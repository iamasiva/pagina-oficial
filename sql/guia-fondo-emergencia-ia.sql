-- Guía 67: Tu fondo de emergencia con IA (16 oct 2026). Archivos ya subidos a Storage.
-- Queda SIN publicar (publicada = false): no sale en catálogo ni vitrinas, pero /r/fondo-emergencia-ia y el visor
-- funcionan por link directo para revisarla. El día del video se enciende desde el admin (editar guía > "Publicada")
-- o con el UPDATE comentado al final.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values ('Tu fondo de emergencia con IA',
  'Una tasa alta es solo una parte de la decisión: también importa cuándo puedes retirar, qué te descuentan y qué protección tiene tu dinero, y casi nadie lo revisa antes de transferir. Este recurso arma, con tu país, tu moneda y tu monto, el prompt exacto para que el modo IA de Google busque opciones en fuentes oficiales, las ordene por tasa verificada y te calcule el neto a 30 y 365 días separando retenciones y costos. Lo copias, lo pegas, y antes de mover el dinero confirmas cinco cosas con la entidad. Gratis.',
  0, true, false, false,
  '{"Finanzas","Investigación","PRODUCTIVIDAD"}',
  'https://api.iamasiva.co/storage/v1/object/public/contenido/1792159367000_fondo-emergencia-ia.html',
  'https://api.iamasiva.co/storage/v1/object/public/portadas/1792156236000_fondo-emergencia-ia.jpg',
  'fondo-emergencia-ia');
select titulo, slug, es_premium, publicada from public.guides where slug = 'fondo-emergencia-ia';

-- El día del video:
-- update public.guides set publicada = true where slug = 'fondo-emergencia-ia';
