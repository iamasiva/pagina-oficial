-- Cinco guías que existen en la página pero no tienen slug: al asignarlo,
-- su landing /r/<slug> queda viva y las respuestas de ManyChat pueden apuntarle.
-- (Todas son gratis y publicadas; la puerta del embudo es es_premium = false.)
update public.guides set slug = 'verdent-agentes' where titulo = 'Verdent, otra forma de trabajar con agentes' and slug is null;
update public.guides set slug = 'agente-finanzas-creao' where titulo = 'Crea tu agente de finanzas con CreaO' and slug is null;
update public.guides set slug = 'prompt-builder' where titulo = 'Genera los mejores prompts con Prompt Builder' and slug is null;
update public.guides set slug = 'constructor-apps-fullstack' where titulo = 'Constructor de prompts para apps full-stack' and slug is null;
update public.guides set slug = 'kimi-ia-masiva' where titulo = 'Trabaja más rápido con Kimi IA Masiva' and slug is null;
