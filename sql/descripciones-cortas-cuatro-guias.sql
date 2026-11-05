-- Ajuste de estilo (2026-09-02): las 4 guías subidas por Claude quedaron con
-- descripciones de 668-956 caracteres; la mediana del catálogo es ~228.
-- Se acortan al formato de la casa. La versión larga sigue en descripcion.md
-- de cada carpeta de "Guías con Portada".

update public.guides set descripcion = 'Deja de anotar gastos a mano: esta guía te monta un dashboard que Gemini arma en tu propio Sheets y a Jarvis, un asistente al que le escribes "uber 23.000" desde el celular y lo registra solo. Gratis, sin apps de pago y sin escribir código.'
where slug = 'jarvis-finanzas-google';

update public.guides set descripcion = 'Le subes un PDF gigante a la IA y responde a medias, ignora secciones o inventa. Este método crea un mapa de cobertura que convierte a Gemini y NotebookLM en un buscador preciso dentro de tus archivos largos. Prompts listos para copiar.'
where slug = 'archivos-largos-gemini';

update public.guides set descripcion = 'Nano Banana te cambia la cara en cada imagen porque le falta memoria. Aquí se la montas con una Gema: el prompt de consistencia, Nano Banana como herramienta predeterminada y 10 fotos de referencia. El mismo personaje en cualquier escena.'
where slug = 'consistencia-rostros-nano-banana';

update public.guides set descripcion = 'Tienes la idea del negocio pero no el equipo para construirla. Este generador arma el prompt que le ordena a Atoms investigar el mercado y construir tu app completa: describes tu idea, marcas las funcionalidades y copias el resultado.'
where slug = 'tu-app-en-un-prompt';
