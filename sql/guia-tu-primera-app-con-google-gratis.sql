-- Guía 65: Tu primera app con Google gratis (8 oct 2026). Archivos ya subidos a Storage.
-- Queda SIN publicar (publicada = false): no sale en catálogo ni vitrinas, pero /r/tu-primera-app-con-google-gratis
-- y el visor funcionan por link directo para revisarla. El día del video se enciende desde el admin
-- (editar guía > "Publicada") o con el UPDATE comentado al final.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values ('Tu primera app con Google gratis',
  'Tienes ideas de apps para tu negocio o tu día a día y las dejas pasar porque crees que necesitas saber programar, pagar un servidor y alquilar una base de datos. Con Google no necesitas ninguna de las tres: la base de datos es una hoja de Sheets, la app vive gratis en Apps Script y el código lo escribe Antigravity; tú solo copias, pegas y das clic. Esta guía te lleva paso a paso a construir la app de agua del video y después te entrega el prompt que se arma solo con tu idea para crear la tuya, más 40 ideas de mini apps útiles.',
  0, true, false, false,
  '{"Antigravity","Desarrollo","PRODUCTIVIDAD"}',
  'https://api.iamasiva.co/storage/v1/object/public/contenido/1791502383000_tu-primera-app-con-google-gratis.html',
  'https://api.iamasiva.co/storage/v1/object/public/portadas/1791501929000_tu-primera-app-con-google-gratis.jpg',
  'tu-primera-app-con-google-gratis');
select titulo, slug, es_premium, publicada from public.guides where slug = 'tu-primera-app-con-google-gratis';

-- El día del video:
-- update public.guides set publicada = true where slug = 'tu-primera-app-con-google-gratis';
