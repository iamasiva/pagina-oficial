// Genera los correos de campaña del Bootcamp Gemini de 0 a 100 (email/bootcamp-*.html)
// a partir de los textos aprobados en PLANES MEJORAS/correos-bootcamp.md.
// Plantilla de marca del bootcamp (la misma del correo de bienvenida): tablas,
// estilos en línea, sin imágenes externas. El pie lleva {{ unsubscribe }} para Brevo.
// Uso: node scripts/correos-bootcamp.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const LANDING = 'https://iamasiva.co/bootcamp.html';
const AREA = 'https://iamasiva.co/recurso-bootcamp.html';
const WHATSAPP = 'https://wa.me/message/GUQZZ7GFPBJOM1';
const utm = (c) => `${LANDING}?utm_source=email&utm_medium=brevo&utm_campaign=${c}`;

const p = (t) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#192333;">${t}</p>`;
const h1 = (t) => `<h1 style="margin:0 0 18px;font-size:26px;line-height:1.2;letter-spacing:-0.5px;font-weight:700;color:#192333;">${t}</h1>`;
const boton = (href, texto) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 22px;"><tr><td style="border-radius:999px;background:#246BFD;"><a href="${href}" target="_blank" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${texto}</a></td></tr></table>`;
const lista = (items) => `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 14px;">${items.map((t) => `<tr><td valign="top" style="padding:0 10px 8px 0;font-size:15px;line-height:1.5;color:#246BFD;">&#9679;</td><td style="padding:0 0 8px;font-size:15px;line-height:1.5;color:#192333;">${t}</td></tr>`).join('')}</table>`;
const pasos = (items) => `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 10px;">${items.map((t, i) => `<tr><td valign="top" style="padding:0 12px 10px 0;"><div style="width:26px;height:26px;border-radius:50%;background:#E8F3FF;color:#246BFD;font-size:13px;font-weight:700;text-align:center;line-height:26px;">${i + 1}</div></td><td style="padding:2px 0 10px;font-size:15px;line-height:1.5;color:#192333;">${t}</td></tr>`).join('')}</table>`;
const caja = (t) => `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:4px 0 20px;background:#E8F3FF;border-radius:14px;"><tr><td style="padding:14px 16px;font-size:14px;line-height:1.55;color:#192333;">${t}</td></tr></table>`;
const firma = (lineas) => `<p style="margin:0;font-size:15px;line-height:1.65;color:#192333;border-top:1px solid #E7EDF4;padding-top:20px;">${lineas}</p>`;

function correo({ titulo, preheader, cuerpo, pie, cabeceraFecha = '3, 4 y 5 de noviembre &middot; 7:00 pm, hora de Bogotá' }) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title></head>
<body style="margin:0;padding:0;background:#F7F8FA;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F7F8FA;font-size:1px;line-height:1px;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #E7EDF4;">
      <tr><td style="padding:28px 32px 0;">
        <div style="font-size:14px;font-weight:800;letter-spacing:3px;color:#192333;">IA MASIVA</div>
        <div style="margin-top:22px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#246BFD;">Bootcamp en vivo &middot; 3 clases</div>
        <div style="margin-top:6px;font-size:34px;line-height:1.05;font-weight:700;letter-spacing:-1px;color:#192333;">Gemini<br><span style="color:#246BFD;">de 0 a 100</span></div>
        <div style="margin-top:10px;font-size:15px;color:#52647C;">${cabeceraFecha}</div>
      </td></tr>
      <tr><td style="padding:26px 32px 8px;">
${cuerpo}
      </td></tr>
      <tr><td style="padding:18px 32px 28px;">
        <p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:#8a93a6;">IA MASIVA &middot; <a href="https://iamasiva.co" style="color:#8a93a6;">iamasiva.co</a><br>${pie}</p>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#8a93a6;">&iquest;Ya no quieres recibir nuestros correos? <a href="{{ unsubscribe }}" style="color:#7f8aa0;text-decoration:underline;">Date de baja aqu&iacute;</a>.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const PIE_LISTA = 'Recibes este correo porque creaste tu cuenta en iamasiva.co o dejaste tu correo en uno de nuestros recursos gratuitos de IA.';
const PIE_COMPRADOR = 'Este correo llega porque compraste el Bootcamp Gemini de 0 a 100.';
const GARANTIA = '<b>Garantía:</b> entra a la clase 1 completa y decide. Si al terminar sientes que esto no es para ti, nos escribes antes de la clase 2 y te devolvemos el 100% de tu dinero.';
const EQUIPO = 'Nos vemos en la clase 1,<br><b>El equipo de IA MASIVA</b>';
const SERGIO = (cierre) => `${cierre}<br><b>Sergio</b><br><span style="color:#52647C;">IA MASIVA</span>`;

const correos = {
  'bootcamp-correo-1-lanzamiento': correo({
    titulo: 'Bootcamp Gemini de 0 a 100: tres noches en vivo, 3, 4 y 5 de noviembre',
    preheader: 'Tres clases en vivo con Sergio y las tres herramientas de IA MASIVA de regalo. Todo vale $257, por Black Friday lo llevas por $97.',
    pie: PIE_LISTA,
    cuerpo: h1('Gemini de 0 a 100: de preguntarle cosas a dirigirlo.')
      + p('Si hoy usas Gemini y recibes respuestas que sirven a medias, el problema no es Gemini y tampoco eres tú. Nadie te ha enseñado a dirigirlo.')
      + p('Por eso lanzamos el <b>Bootcamp Gemini de 0 a 100</b>: tres clases en vivo, el 3, 4 y 5 de noviembre a las 7:00 pm, hora de Bogotá. Poca teoría y muchos casos reales, con Sergio respondiendo preguntas al final de cada clase.')
      + p('<b>Con lo que sales cada noche:</b>')
      + lista([
        '<b>Clase 1 &middot; Gemini primeros pasos.</b> Gemini configurado para tu trabajo, cuadernos con fuentes y configuraciones, respuestas en el formato exacto que pides e imágenes con dirección visual.',
        '<b>Clase 2 &middot; Proyectos grandes con Gemini.</b> Formularios y paneles conectados a Google Sheets, cuadernos de estudio, investigación desde tus fuentes y presentaciones con tu propio diseño.',
        '<b>Clase 3 &middot; Gemini para automatización y trabajo agéntico.</b> Un agente que trabaja con el conocimiento de tu negocio, skills y plugins que automatizan procesos completos, tareas recurrentes en Gemini Tasks y tu página web publicada en internet.',
      ])
      + p('No necesitas saber programar: todo se construye hablándole a la IA.')
      + p('Por Black Friday, el bootcamp llega con <b>las tres herramientas de IA MASIVA de regalo</b>, para siempre y con actualizaciones:')
      + lista(['557 Configuraciones para Gemini Notebook ($42)', '400 Skills para Gemini ($34)', '200 Diseños para Presentaciones en Notebook ($24)'])
      + p('<b>Todo vale $257. Te lo llevas por $97 (62% menos).</b> Pago único en Hotmart, en tu moneda.')
      + boton(utm('bootcamp-correo-1-lanzamiento'), 'Ver el bootcamp')
      + caja(GARANTIA)
      + p('La oferta termina el martes 3 de noviembre a las 6:00 pm, hora de Bogotá, una hora antes de empezar. Es la única versión en vivo que se va a dictar: después queda pregrabado por $157 y sin las herramientas.')
      + firma(EQUIPO),
  }),

  'bootcamp-correo-2-gemas': correo({
    titulo: 'Las gemas de Gemini desaparecen: qué cambia y qué no',
    preheader: 'Una gema tenía tres cosas. Una skill tiene exactamente las mismas tres. Te muestro cómo pasarlas en dos minutos.',
    pie: PIE_LISTA,
    cuerpo: h1('Las gemas desaparecen. Tranquilo.')
      + p('Si ya te salió el mensaje en Gemini de que las gemas desaparecen y que trabajes con skills, tranquilo. Te muestro lo fácil que es.')
      + p('Una gema tenía tres cosas: un nombre, una descripción y unas instrucciones. <b>Una skill se compone exactamente de lo mismo.</b>')
      + p('<b>Así pasas una gema a skill:</b>')
      + pasos([
        'Abre la gema y copia su nombre, su descripción y sus instrucciones.',
        'En Gemini entra a <b>Configuración</b>, luego a <b>Habilidades</b>, toca <b>Crear</b> y elige <b>Crear manualmente</b>.',
        'Vas a ver las mismas tres cajas: Nombre, Descripción e Instrucciones. Pega lo que copiaste y toca <b>Crear</b>.',
      ])
      + p('Listo: tienes tu gema, pero ahora trabajando como skill. La diferencia es cómo la usas. La gema vivía en un chat aparte; la skill la llamas desde cualquier chat escribiendo <b>@</b> y su nombre, seguido de lo que quieres hacer, y Gemini la aplica ahí mismo.')
      + p('Y queda la pregunta que todos nos hacemos: ¿qué pasa con la herramienta predeterminada y los archivos de conocimiento que tenían las gemas? Eso lo resolvemos en el <b>Bootcamp Gemini de 0 a 100</b>, donde enseñamos todo: desde lo más básico hasta cómo escalar a grandes proyectos con Gemini, con las herramientas y los métodos que usamos nosotros.')
      + p('Tres clases en vivo, el 3, 4 y 5 de noviembre a las 7:00 pm, hora de Bogotá. Por Black Friday te lo llevas por <b>$97</b>, y de regalo van las <b>400 Skills para Gemini</b> (400 skills listas para pegar en esas tres cajas), las 557 Configuraciones para Gemini Notebook y los 200 Diseños para Presentaciones en Notebook. Todo vale $257.')
      + boton(utm('bootcamp-correo-2-gemas'), 'Ver el bootcamp')
      + firma(SERGIO('Nos vemos en la clase 1,')),
  }),

  'bootcamp-correo-3-falta-un-dia': correo({
    titulo: 'Mañana empieza el bootcamp y la oferta termina a las 6:00 pm',
    preheader: 'Clase 1 mañana a las 7:00 pm, hora de Bogotá. Todo vale $257, lo llevas por $97 hasta mañana a las 6:00 pm.',
    pie: PIE_LISTA,
    cuerpo: h1('Mañana empieza. Todavía estás a tiempo.')
      + p('Mañana martes 3 de noviembre a las 7:00 pm, hora de Bogotá, empieza la clase 1 del <b>Bootcamp Gemini de 0 a 100</b>. Y a las 6:00 pm, una hora antes, termina la oferta de Black Friday.')
      + p('<b>Lo que te llevas por $97:</b>')
      + lista([
        'Tres clases en vivo con Sergio, el 3, 4 y 5 de noviembre, con sus grabaciones para siempre.',
        'De regalo y para siempre: 557 Configuraciones para Gemini Notebook, 400 Skills para Gemini y 200 Diseños para Presentaciones en Notebook.',
        'Los recursos del bootcamp: 42 formatos de respuesta, 61 instrucciones para imágenes, 25 agentes de IA con Gemini y el mapa de las IA de Google.',
        'Soporte por WhatsApp durante el bootcamp y certificado de participación.',
      ])
      + p('Todo vale $257. Después del martes queda solo la versión pregrabada, por $157 y sin las herramientas.')
      + p('Entras sin riesgo: ves la clase 1 completa y decides. Si no es para ti, nos escribes antes de la clase 2 y te devolvemos el 100% de tu dinero.')
      + boton(utm('bootcamp-correo-3-falta-un-dia'), 'Reservar mi lugar')
      + p('Al pagar, el acceso llega a tu correo y entras a la clase desde iamasiva.co con ese mismo correo.')
      + firma('<b>El equipo de IA MASIVA</b>'),
  }),

  'bootcamp-correo-4-es-hoy': correo({
    titulo: 'Es hoy: la clase 1 empieza a las 7:00 pm',
    preheader: 'Todavía estás a tiempo. Todo vale $257, hoy lo llevas por $97.',
    pie: PIE_LISTA,
    cuerpo: h1('Es hoy.')
      + p('Hoy a las 7:00 pm, hora de Bogotá, empieza el <b>Bootcamp Gemini de 0 a 100</b>. Si todavía no te inscribiste, estás a tiempo: la oferta de Black Friday cierra hoy a las 6:00 pm.')
      + p('Por <b>$97</b> (todo vale $257): tres clases en vivo con Sergio, las tres herramientas de IA MASIVA de regalo para siempre y los recursos del bootcamp. Con garantía: ves la clase 1 completa y decides.')
      + p('Al pagar, el acceso llega a tu correo en minutos y entras a la clase desde iamasiva.co con ese mismo correo, con el chat al lado.')
      + caja('<b>La hora según tu país:</b> 7:00 pm en Colombia, Perú y Ecuador; 6:00 pm en México; 8:00 pm en Venezuela; 9:00 pm en Chile y Argentina; 1:00 am del miércoles en España.')
      + boton(utm('bootcamp-correo-4-es-hoy'), 'Entrar al bootcamp hoy')
      + firma('Nos vemos esta noche,<br><b>El equipo de IA MASIVA</b>'),
  }),

  'bootcamp-recordatorio-1-manana-clase-1': correo({
    titulo: 'Mañana es la clase 1: así entras',
    preheader: 'Martes 3 de noviembre, 7:00 pm, hora de Bogotá. Tu área tiene los recursos desde mañana.',
    pie: PIE_COMPRADOR,
    cuerpo: h1('Mañana es la clase 1: así entras.')
      + p('Hola. Mañana martes 3 de noviembre a las 7:00 pm, hora de Bogotá, empieza la clase 1 del Bootcamp Gemini de 0 a 100: <b>Gemini primeros pasos</b>.')
      + p('<b>Así entras:</b>')
      + pasos([
        'Entra a <a href="https://iamasiva.co" style="color:#246BFD;">iamasiva.co</a> con el correo de tu compra.',
        'En tu área del bootcamp toca <b>Entrar a la clase</b>. El botón aparece cuando la sala está abierta, unos minutos antes de las 7:00 pm.',
        'La clase se ve ahí mismo, con el chat al lado. Las preguntas se responden al final.',
      ])
      + p('Desde mañana también quedan habilitados en tu área los recursos del bootcamp: los 42 formatos de respuesta, las 61 instrucciones para imágenes y el mapa de las IA de Google.')
      + p('Dos recomendaciones: una pantalla grande para seguir las demostraciones, y Gemini abierto en tu cuenta de Google para probar en vivo lo que vamos viendo.')
      + boton(AREA, 'Ir a mi área del bootcamp')
      + p(`Si algo no funciona, <a href="${WHATSAPP}" style="color:#246BFD;">escríbenos por WhatsApp</a>. Nos vemos mañana.`)
      + firma(SERGIO('')),
  }),
};

const recordatorioHora = (clase) => correo({
  titulo: `En una hora empieza la clase ${clase.n}`,
  preheader: '7:00 pm, hora de Bogotá. Entra con el correo de tu compra.',
  pie: PIE_COMPRADOR,
  cabeceraFecha: `${clase.dia} &middot; 7:00 pm, hora de Bogotá`,
  cuerpo: h1(`En una hora empieza la clase ${clase.n}.`)
    + p(`A las 7:00 pm, hora de Bogotá, empieza la clase ${clase.n}: <b>${clase.titulo}</b>.`)
    + (clase.anterior ? p('La grabación de la clase anterior ya está en tu área.') : '')
    + p('Entra a <a href="https://iamasiva.co" style="color:#246BFD;">iamasiva.co</a> con el correo de tu compra y en tu área del bootcamp toca <b>Entrar a la clase</b>. Si no ves el botón, recarga la página unos minutos antes de las 7:00 pm.')
    + p(`Las preguntas se responden al final de la clase. Si algo falla, <a href="${WHATSAPP}" style="color:#246BFD;">escríbenos por WhatsApp</a>.`)
    + boton(AREA, 'Entrar a la clase')
    + firma(SERGIO('Nos vemos adentro,')),
});
correos['bootcamp-recordatorio-2-una-hora-clase-1'] = recordatorioHora({ n: 1, titulo: 'Gemini primeros pasos', dia: 'Martes 3 de noviembre' });
correos['bootcamp-recordatorio-2-una-hora-clase-2'] = recordatorioHora({ n: 2, titulo: 'Proyectos grandes con Gemini', dia: 'Miércoles 4 de noviembre', anterior: true });
correos['bootcamp-recordatorio-2-una-hora-clase-3'] = recordatorioHora({ n: 3, titulo: 'Gemini para automatización y trabajo agéntico', dia: 'Jueves 5 de noviembre', anterior: true });

mkdirSync('email', { recursive: true });
for (const [nombre, html] of Object.entries(correos)) {
  if (/[—–]/.test(html)) throw new Error('raya larga en ' + nombre);
  writeFileSync(`email/${nombre}.html`, html);
  console.log('escrito email/' + nombre + '.html (' + html.length + ' caracteres)');
}
