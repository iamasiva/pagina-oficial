-- Guía nueva (2026-09-02): Tu Jarvis de finanzas con Google (carpeta 53).
-- Archivos ya subidos a Storage. Al insertar queda publicada y con /r/ viva.
insert into public.guides (titulo, descripcion, precio, es_gratis, es_premium, publicada, categorias, contenido_url, portada_url, slug)
values (
  'Tu Jarvis de finanzas con Google',
  'Sabes que deberías llevar tus finanzas, pero ninguna app te dura más de una semana. El problema no es tu disciplina, es la fricción: abrir la app, buscar la categoría, llenar el formulario. Al tercer día nadie sigue.

Esta guía te construye dos piezas que trabajan juntas sobre tu propio Google Sheets. La primera es un dashboard profesional que Gemini arma en minutos: KPIs, gráficas y resúmenes por mes y por categoría. La segunda es Jarvis, un asistente que abres desde el celular: le escribes "uber 23.000" y él registra el movimiento en tu hoja al instante. También le preguntas por tus finanzas y te responde con tus datos reales.

Todo gratis, sin apps de pago y sin escribir una línea de código. La instalación guiada toma entre 20 y 30 minutos la primera vez, y el uso diario es simplemente un chat en tu celular.

Tus datos nunca salen de tu cuenta de Google: la hoja es tuya, Jarvis corre en tu propio Apps Script y tú tienes el control de todo.',
  0, true, false, true,
  '{"Gemini","Google Sheets","Finanzas","Automatización"}',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/contenido/1788358336000_jarvis-finanzas-google.html',
  'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/1788358336000_jarvis-finanzas-google.jpg',
  'jarvis-finanzas-google'
);
