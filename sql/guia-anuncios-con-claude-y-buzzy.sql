-- Guía 69: Anuncios con Claude y Buzzy: conexión y 10 instrucciones (7 nov 2026).
-- Archivos ya subidos a Storage. Entra DESPUBLICADA: /r/anuncios-con-claude-y-buzzy y el visor funcionan por
-- link directo para revisarla; el día del video se enciende con el UPDATE del final.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values ('Anuncios con Claude y Buzzy: conexión y 10 instrucciones',
  'Un anuncio bueno no se adivina, se prueba, pero grabar varias versiones cuesta tiempo y plata. Con Buzzy conectado a Claude pides el anuncio con la foto de tu producto y sacas versiones en una tarde. Conexión en 3 pasos y 10 instrucciones listas.',
  0, true, false, false,
  '{"Claude","Video y animación","Creación de contenido"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1794063909000_anuncios-con-claude-y-buzzy.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1794063909000_anuncios-con-claude-y-buzzy.jpg',
  'anuncios-con-claude-y-buzzy');
select titulo, slug, es_premium, publicada from public.guides where slug = 'anuncios-con-claude-y-buzzy';

-- El día del video (o ya mismo, si el video sale hoy):
-- update public.guides set publicada = true where slug = 'anuncios-con-claude-y-buzzy';
