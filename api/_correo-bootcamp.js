// Correo de bienvenida del Bootcamp Gemini de 0 a 100.
// Lo dispara el webhook de Hotmart (api/hotmart-webhook.js) al aprobar la compra
// del bootcamp: acceso al área, calendario de las clases, herramientas ya activas,
// recursos de clase, cómo entrar el día de la clase, soporte y garantía.
// Sale por Brevo con el mismo remitente de los recursos (comunidad@iamasiva.co),
// firmado por Sergio. Nunca lanza error: devuelve un texto para la bitácora.
export const PRODUCTO_BOOTCAMP = '6c01d354-e05d-47be-a6d6-3075abcc16d3';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Primer nombre con mayúscula inicial ("MARÍA JOSÉ PÉREZ" -> "María")
export function primerNombre(nombre) {
  const n = String(nombre ?? '').trim().split(/\s+/)[0] || '';
  if (!n) return '';
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

const CLASES = [
  { n: 1, dia: 'Martes 3 de noviembre', titulo: 'Gemini primeros pasos' },
  { n: 2, dia: 'Miércoles 4 de noviembre', titulo: 'Proyectos grandes con Gemini' },
  { n: 3, dia: 'Jueves 5 de noviembre', titulo: 'Gemini para automatización y trabajo agéntico' },
];
const HERRAMIENTAS = ['557 Configuraciones para Gemini Notebook', '400 Skills para Gemini', '200 Diseños para Presentaciones en Notebook'];
const RECURSOS = ['Biblioteca de 42 formatos de respuesta', '61 instrucciones para imágenes, con su skill', 'El mapa de las IA de Google (web y PDF)', '25 agentes de IA con Gemini (se entrega en la clase 3)'];

const AREA = 'https://iamasiva.co/recurso-bootcamp.html';
const WHATSAPP = 'https://wa.me/message/GUQZZ7GFPBJOM1';

export function htmlBienvenidaBootcamp({ nombre, correo, invitado }) {
  const saludo = primerNombre(nombre) ? `Hola, ${esc(primerNombre(nombre))}.` : 'Hola.';
  const acceso = invitado
    ? `Entras con este mismo correo: <b>${esc(correo)}</b>. Si todavía no tienes cuenta en IA MASIVA, créala con ese correo y tu compra aparece sola.`
    : `Entras con tu cuenta de IA MASIVA: <b>${esc(correo)}</b>.`;
  const p = (t, extra = '') => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#192333;${extra}">${t}</p>`;
  const h2 = (t) => `<p style="margin:28px 0 10px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#246BFD;">${t}</p>`;
  const boton = (href, texto) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;"><tr><td style="border-radius:999px;background:#246BFD;"><a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${texto}</a></td></tr></table>`;
  const lista = (items) => `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 6px;">${items.map((t) => `<tr><td valign="top" style="padding:0 10px 8px 0;font-size:15px;line-height:1.5;color:#246BFD;">&#9679;</td><td style="padding:0 0 8px;font-size:15px;line-height:1.5;color:#192333;">${t}</td></tr>`).join('')}</table>`;
  const calendario = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 6px;border:1px solid #E7EDF4;border-radius:14px;">${CLASES.map((c, i) => `<tr><td style="padding:12px 16px;${i ? 'border-top:1px solid #E7EDF4;' : ''}"><div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#246BFD;">Clase ${c.n}</div><div style="font-size:15px;font-weight:700;color:#192333;margin-top:2px;">${esc(c.titulo)}</div><div style="font-size:14px;color:#52647C;margin-top:2px;">${c.dia} &middot; 7:00 pm, hora de Bogotá</div></td></tr>`).join('')}</table>`;
  const pasos = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${[
    'Entra a <a href="https://iamasiva.co" style="color:#246BFD;">iamasiva.co</a> con tu correo.',
    'En tu área del bootcamp toca <b>Entrar a la clase</b>. El botón aparece en el home del bootcamp y en el catálogo cuando la sala está abierta.',
    'La clase se ve ahí mismo, con el chat al lado. Las preguntas se responden al final de cada clase.',
  ].map((t, i) => `<tr><td valign="top" style="padding:0 12px 10px 0;"><div style="width:26px;height:26px;border-radius:50%;background:#E8F3FF;color:#246BFD;font-size:13px;font-weight:700;text-align:center;line-height:26px;">${i + 1}</div></td><td style="padding:2px 0 10px;font-size:15px;line-height:1.5;color:#192333;">${t}</td></tr>`).join('')}</table>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tu acceso al Bootcamp Gemini de 0 a 100</title></head>
<body style="margin:0;padding:0;background:#F7F8FA;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F7F8FA;font-size:1px;line-height:1px;">Entra con este correo, revisa el calendario y abre tus herramientas desde hoy.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #E7EDF4;">
      <tr><td style="padding:28px 32px 0;">
        <div style="font-size:14px;font-weight:800;letter-spacing:3px;color:#192333;">IA MASIVA</div>
        <div style="margin-top:22px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#246BFD;">Bootcamp en vivo &middot; 3 clases</div>
        <div style="margin-top:6px;font-size:34px;line-height:1.05;font-weight:700;letter-spacing:-1px;color:#192333;">Gemini<br><span style="color:#246BFD;">de 0 a 100</span></div>
        <div style="margin-top:10px;font-size:15px;color:#52647C;">3, 4 y 5 de noviembre &middot; 7:00 pm, hora de Bogotá</div>
      </td></tr>
      <tr><td style="padding:26px 32px 8px;">
        ${p(saludo)}
        ${p('Tu compra quedó aprobada y ya tienes tu lugar en el Bootcamp Gemini de 0 a 100. Aquí está todo lo que necesitas para entrar, en un solo correo.')}
        ${h2('Tu acceso')}
        ${p(acceso)}
        ${boton(AREA, 'Entrar a mi área del bootcamp')}
        ${h2('Calendario')}
        ${calendario}
        ${p('Cada clase dura alrededor de dos horas y queda grabada en tu área para repetirla cuando quieras. Te recordamos antes de cada clase.', 'margin-top:12px;')}
        ${h2('Tus herramientas, ya activas')}
        ${lista(HERRAMIENTAS.map(esc))}
        ${p('Son tuyas para siempre, con sus actualizaciones. Las abres desde tu área del bootcamp o desde <b>Tus compras</b> en el catálogo. Úsalas desde hoy: en las clases vamos a trabajar con ellas.')}
        ${h2('Recursos del bootcamp')}
        ${lista(RECURSOS.map(esc))}
        ${p('Se habilitan el martes 3 de noviembre, el primer día del bootcamp, en tu área.')}
        ${h2('El día de la clase')}
        ${pasos}
        ${p('Puedes entrar desde el celular, pero te recomendamos una pantalla grande para seguir las demostraciones.', 'margin-top:6px;')}
        ${h2('Soporte')}
        ${p('Si algo no funciona o tienes una duda, escríbenos por WhatsApp. Durante el bootcamp estamos pendientes para que no te quedes atascado.')}
        ${boton(WHATSAPP, 'Escribir por WhatsApp')}
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 22px;background:#E8F3FF;border-radius:14px;"><tr><td style="padding:14px 16px;font-size:14px;line-height:1.55;color:#192333;"><b>Garantía:</b> si al terminar la clase 1 sientes que esto no es para ti, nos escribes antes de la clase 2 y te devolvemos el 100% de tu dinero.</td></tr></table>
        ${p('Un favor: responde este correo con un "listo". Así los recordatorios de las clases te llegan a la bandeja principal y no a Promociones.')}
        <p style="margin:0;font-size:15px;line-height:1.65;color:#192333;border-top:1px solid #E7EDF4;padding-top:20px;">Nos vemos el martes 3.<br><b>Sergio</b><br><span style="color:#52647C;">IA MASIVA</span></p>
      </td></tr>
      <tr><td style="padding:18px 32px 28px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#8a93a6;">IA MASIVA &middot; <a href="https://iamasiva.co" style="color:#8a93a6;">iamasiva.co</a><br>Este correo llegó a ${esc(correo)} porque compraste el Bootcamp Gemini de 0 a 100.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export async function enviarBienvenidaBootcamp({ correo, nombre, invitado }) {
  if (!correo) return 'correo de bienvenida no enviado (sin correo del comprador)';
  if (!process.env.BREVO_API_KEY) return 'correo de bienvenida no enviado (falta BREVO_API_KEY)';
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Sergio de IA MASIVA', email: 'comunidad@iamasiva.co' },
        replyTo: { email: 'contacto@iamasiva.co' },
        to: [{ email: correo, ...(primerNombre(nombre) ? { name: String(nombre).trim() } : {}) }],
        subject: 'Tu acceso al Bootcamp Gemini de 0 a 100 (3, 4 y 5 de noviembre)',
        htmlContent: htmlBienvenidaBootcamp({ nombre, correo, invitado }),
        tags: ['bootcamp-bienvenida'],
      }),
    });
    if (r.ok) return 'correo de bienvenida enviado';
    const detalle = await r.text().catch(() => '');
    return `correo de bienvenida NO enviado (Brevo ${r.status}: ${detalle.slice(0, 120)})`;
  } catch (e) {
    return 'correo de bienvenida NO enviado: ' + e.message;
  }
}
