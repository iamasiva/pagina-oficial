-- Tres guías nuevas (2026-08-29): archivos largos Gemini, consistencia de rostros
-- Nano Banana y Tu app en un prompt (Atoms). Archivos ya subidos a Storage.
-- Al insertarlas quedan publicadas en el catálogo y con landing /r/<slug> viva.

insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug, link_instagram, link_tiktok, link_youtube)
values
(
  'Haz que Gemini lea archivos gigantes sin perderse',
  'Le subes un PDF de 400 páginas a la IA y se pierde: responde a medias, ignora secciones enteras o directamente inventa. El problema no es el modelo, es que nadie le dio un mapa.

Este método crea un MAPA DE COBERTURA: un índice inteligente de tu documento que convierte a Gemini y NotebookLM en un buscador preciso dentro de archivos largos. La IA primero consulta el mapa para saber dónde buscar y después valida la respuesta en el documento real, sección por sección.

Incluye la herramienta gratuita para convertir tu PDF a Markdown, el prompt que construye el mapa de cobertura completo y la instrucción para configurar el cuaderno de Gemini, todo listo para copiar y pegar.

Funciona con informes, libros, contratos, manuales y cualquier documento que hasta hoy te daba pereza revisar.',
  0, true, false, true,
  '{"Gemini","NotebookLM","PRODUCTIVIDAD"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1788022699000_archivos-largos-gemini.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1788022699000_archivos-largos-gemini.jpg',
  'archivos-largos-gemini',
  'https://www.instagram.com/reel/DZQEXVCxxnm/',
  'https://vt.tiktok.com/ZSVWNw6MJ/',
  'https://youtube.com/shorts/A6l8AZnyijQ'
),
(
  'El secreto de la consistencia en rostros - Nano Banana',
  'Nano Banana te cambia la cara en cada imagen: llevas horas regenerando y el personaje nunca queda igual. El problema no es la herramienta, es que le falta memoria.

Este recurso monta esa memoria con una Gema de Gemini: creas la Gema con el prompt de consistencia (Identity Lock), activas Nano Banana como herramienta predeterminada y le subes 10 fotos de referencia desde distintos ángulos.

Resultado: el mismo personaje, en cualquier lugar del mundo, sin perder ni un rasgo. De caras aleatorias a consistencia total en cada generación.

Incluye el prompt completo listo para copiar, el paso a paso para crear la Gema y los trucos que hacen la diferencia: qué fotos de referencia funcionan mejor, cómo pedir escenas con famosos y el formato de salida ideal para redes.',
  0, true, false, true,
  '{"Gemini","Imagen y diseño"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1788022699000_consistencia-rostros-nano-banana.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1788022699000_consistencia-rostros-nano-banana.jpg',
  'consistencia-rostros-nano-banana',
  'https://www.instagram.com/reel/DVPmeP3kRzk/',
  null,
  null
),
(
  'Tu app en un prompt: constrúyela en una tarde',
  'Tienes la idea del negocio pero no el equipo para construirla. Este generador arma el prompt profesional que le ordena a Atoms construir tu app completa.

El flujo es de tres pasos: describes tu idea en tus palabras, marcas las funcionalidades que necesita (con la opción de personalizar cada una en lenguaje natural) y copias el prompt final para pegarlo directo en Atoms.

El prompt incluye por defecto la parte que nadie graba: la orden de investigar la demanda y los competidores antes de escribir una sola línea de código. Así no construyes algo que nadie quiere.

Trae ejemplos listos para probar y el acceso directo a Atoms para ver tu app construida hoy mismo.',
  0, true, false, true,
  '{"Atoms","Desarrollo"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1788022699000_tu-app-en-un-prompt.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1788022699000_tu-app-en-un-prompt.jpg',
  'tu-app-en-un-prompt',
  'https://www.instagram.com/reel/DcY6fOyRoRx/',
  'https://vt.tiktok.com/ZSVWFr6U6/',
  'https://youtube.com/shorts/7u5G7BNCdg0'
);
