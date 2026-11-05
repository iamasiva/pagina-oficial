-- Guía 68: 50 motion graphics con IA, sin programar (22 oct 2026). Archivos ya subidos a Storage:
-- la página (300 KB) y los 150 medios en contenido/motion/ (50 mp4, 50 jpg, 50 zip).
-- Queda SIN publicar (publicada = false): no sale en catálogo ni vitrinas, pero /r/50-motion-graphics y el visor
-- funcionan por link directo para revisarla. El día del video se enciende desde el admin (editar guía > "Publicada")
-- o con el UPDATE comentado al final.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values ('50 motion graphics con IA, sin programar',
  'Los motion graphics que ves en los videos de IA MASIVA se hacen con código, pero sin programar: se los pides a Antigravity, Claude Code o Codex. Esta biblioteca trae 50 animaciones listas para ver, sin audio, cada una con su video de referencia, su carpeta editable y el prompt que se arma con tu contenido, más la preparación paso a paso de tu herramienta desde el chat. Eliges un diseño, adjuntas tu información y la IA lo adapta a tu historia. Gratis.',
  0, true, false, false,
  '{"Antigravity","Video y animación","Creación de contenido"}',
  'https://api.iamasiva.co/storage/v1/object/public/contenido/1792710240000_50-motion-graphics.html',
  'https://api.iamasiva.co/storage/v1/object/public/portadas/1792706279000_50-motion-graphics.jpg',
  '50-motion-graphics');
select titulo, slug, es_premium, publicada from public.guides where slug = '50-motion-graphics';

-- El día del video:
-- update public.guides set publicada = true where slug = '50-motion-graphics';
