-- Tarjeta del bootcamp en el catálogo (app.html): una guía premium DESPUBLICADA
-- enlazada al producto por products.guide_id. No se ve hasta poner publicada = true.
-- La portada es provisional (estrella de la presentación); se reemplaza por la
-- portada vertical real cuando Sergio la tenga. La corre Sergio.
with g as (
  insert into public.guides (titulo, descripcion, slug, categorias, es_premium, publicada, portada_url, contenido_url, precio, es_gratis)
  select
    'Bootcamp Gemini de 0 a 100',
    'Tres clases en vivo para pasar de preguntarle cosas a Gemini a dirigirlo: configuras Gemini a tu medida, trabajas proyectos completos en cuadernos y dejas un agente de IA trabajando por ti. Incluye las 557 configuraciones, las 400 skills y los 200 diseños.',
    'bootcamp-gemini-de-0-a-100',
    array['Gemini', 'Bootcamp', 'Automatización', 'PRODUCTIVIDAD'],
    true, false,
    'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/bootcamp-estrella.jpg',
    null, 0, false
  where not exists (select 1 from public.guides where slug = 'bootcamp-gemini-de-0-a-100')
  returning id
)
update public.products p set guide_id = g.id from g where p.id = '6c01d354-e05d-47be-a6d6-3075abcc16d3';

-- Comprobación:
-- select p.nombre, p.guide_id, g.titulo, g.publicada from public.products p join public.guides g on g.id = p.guide_id where p.id = '6c01d354-e05d-47be-a6d6-3075abcc16d3';
