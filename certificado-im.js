/* Certificado de participación del Bootcamp Gemini de 0 a 100.
   Genera el PDF en el navegador (pdf-lib) con la identidad del bootcamp: fondo blanco,
   halos azules, tipografía Inter y la estrella. Lo usa bootcamp-certificado.html.
   window.IMCertificado.generar({ nombre, codigo, fecha }) → Uint8Array del PDF. */
(function () {
  const AZUL = [0x24 / 255, 0x6b / 255, 0xfd / 255];
  const AZUL2 = [0x12 / 255, 0x4d / 255, 0xc5 / 255];
  const INK = [0x19 / 255, 0x23 / 255, 0x33 / 255];
  const INK2 = [0x52 / 255, 0x64 / 255, 0x7c / 255];
  const HALO = [0xe8 / 255, 0xf3 / 255, 0xff / 255];
  const HALO2 = [0xd7 / 255, 0xeb / 255, 0xff / 255];
  const BORDE = [0xe7 / 255, 0xed / 255, 0xf4 / 255];
  const ESTRELLA = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/bootcamp-estrella-circulo.jpg';
  const FIRMA = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/bootcamp-firma-sergio.png';
  const W = 841.89, H = 595.28; // A4 horizontal, en puntos

  async function bytes(url) {
    const r = await fetch(url, { mode: 'cors' });
    if (!r.ok) throw new Error('No se pudo cargar ' + url);
    return new Uint8Array(await r.arrayBuffer());
  }

  // Fuentes estándar del PDF (Helvetica): no hay que descargar nada y el archivo pesa poco.
  async function cargarFuentes(pdf) {
    const { StandardFonts } = PDFLib;
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    return { regular, medium: regular, bold };
  }

  // Las fuentes estándar solo cubren el alfabeto latino occidental: un nombre con otros
  // signos se escribe sin ellos en vez de fallar.
  function compatible(font, texto) {
    try { font.encodeText(texto); return texto; } catch (_) {}
    const sin = texto.normalize('NFD').replace(/\p{M}/gu, '');
    try { font.encodeText(sin); return sin; } catch (_) {}
    return sin.replace(/[^\x20-\x7E]/g, '');
  }

  function centrado(page, texto, y, font, size, color, tracking) {
    tracking = tracking || 0;
    let ancho = font.widthOfTextAtSize(texto, size) + tracking * Math.max(0, texto.length - 1);
    let x = (W - ancho) / 2;
    if (!tracking) { page.drawText(texto, { x, y, size, font, color: PDFLib.rgb(...color) }); return; }
    for (const ch of texto) {
      page.drawText(ch, { x, y, size, font, color: PDFLib.rgb(...color) });
      x += font.widthOfTextAtSize(ch, size) + tracking;
    }
  }

  // Parte un párrafo en líneas que quepan en maxAncho
  function lineas(texto, font, size, maxAncho) {
    const out = []; let linea = '';
    for (const palabra of texto.split(' ')) {
      const prueba = linea ? linea + ' ' + palabra : palabra;
      if (font.widthOfTextAtSize(prueba, size) <= maxAncho) linea = prueba;
      else { if (linea) out.push(linea); linea = palabra; }
    }
    if (linea) out.push(linea);
    return out;
  }

  // Píldora: rectángulo con extremos redondos y texto centrado
  function pildora(page, cx, cy, texto, font, size, relleno, color) {
    const ancho = font.widthOfTextAtSize(texto, size) + 30, alto = 24, r = alto / 2;
    const x = cx - ancho / 2;
    page.drawRectangle({ x: x + r, y: cy - r, width: ancho - 2 * r, height: alto, color: PDFLib.rgb(...relleno) });
    page.drawCircle({ x: x + r, y: cy, size: r, color: PDFLib.rgb(...relleno) });
    page.drawCircle({ x: x + ancho - r, y: cy, size: r, color: PDFLib.rgb(...relleno) });
    page.drawText(texto, { x: x + 15, y: cy - size * 0.36, size, font, color: PDFLib.rgb(...color) });
    return ancho;
  }

  async function generar({ nombre, codigo, fecha }) {
    const { PDFDocument, rgb } = PDFLib;
    const pdf = await PDFDocument.create();
    pdf.setTitle('Certificado · Bootcamp Gemini de 0 a 100 · IA MASIVA');
    pdf.setAuthor('IA MASIVA');
    pdf.setSubject('Certificado de finalización de ' + nombre);
    const page = pdf.addPage([W, H]);
    const f = await cargarFuentes(pdf);
    nombre = compatible(f.bold, String(nombre || '').trim());

    // Fondo y halos (la identidad del bootcamp: blanco con luz azul en las esquinas)
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
    page.drawCircle({ x: W - 60, y: H + 40, size: 300, color: rgb(...HALO2), opacity: 0.9 });
    page.drawCircle({ x: W - 20, y: H + 80, size: 190, color: rgb(1, 1, 1), opacity: 0.55 });
    page.drawCircle({ x: 40, y: -60, size: 260, color: rgb(...HALO), opacity: 0.95 });
    // Marco doble
    page.drawRectangle({ x: 28, y: 28, width: W - 56, height: H - 56, borderColor: rgb(...BORDE), borderWidth: 1.2 });
    page.drawRectangle({ x: 36, y: 36, width: W - 72, height: H - 72, borderColor: rgb(...AZUL), borderWidth: 0.8, opacity: 0.9 });

    // Cabecera centrada: la marca y el programa
    centrado(page, 'IA MASIVA', H - 82, f.bold, 13, INK, 3.4);
    centrado(page, 'BOOTCAMP GEMINI DE 0 A 100', H - 100, f.medium, 8.5, AZUL, 2.4);

    // Título
    centrado(page, 'CERTIFICADO DE FINALIZACIÓN', H - 150, f.bold, 28, INK);
    centrado(page, 'Se otorga el presente certificado a', H - 184, f.regular, 13, INK);

    // Nombre: tamaño automático para que quepa en una línea
    let size = 40; const maxNombre = W - 200;
    while (size > 20 && f.bold.widthOfTextAtSize(nombre, size) > maxNombre) size -= 1;
    centrado(page, nombre, H - 236, f.bold, size, AZUL);
    const anchoLinea = Math.min(maxNombre, Math.max(240, f.bold.widthOfTextAtSize(nombre, size) + 40));
    page.drawLine({ start: { x: (W - anchoLinea) / 2, y: H - 252 }, end: { x: (W + anchoLinea) / 2, y: H - 252 }, thickness: 1, color: rgb(...AZUL), opacity: 0.6 });

    // Cuerpo
    const cuerpo = 'por haber completado satisfactoriamente el Bootcamp Gemini de 0 a 100 de IA MASIVA, un programa de formación de 6 horas en tres sesiones, en el que desarrolló las competencias para trabajar de forma eficiente usando Gemini, estructurar proyectos y desarrollarlos con enfoque de escalabilidad y crear agentes y automatizaciones funcionales utilizando inteligencia artificial.';
    let y = H - 284;
    for (const l of lineas(cuerpo, f.regular, 11.5, 640)) { centrado(page, l, y, f.regular, 11.5, INK); y -= 17.5; }

    // Píldoras: fecha de emisión y código de verificación
    const yP = y - 16;
    const t1 = 'Emitido el ' + fecha, t2 = 'Código de verificación ' + codigo;
    const a1 = f.medium.widthOfTextAtSize(t1, 9.5) + 30, a2 = f.medium.widthOfTextAtSize(t2, 9.5) + 30, sep = 12;
    const x0 = (W - (a1 + sep + a2)) / 2;
    pildora(page, x0 + a1 / 2, yP, t1, f.medium, 9.5, AZUL, [1, 1, 1]);
    pildora(page, x0 + a1 + sep + a2 / 2, yP, t2, f.medium, 9.5, HALO2, AZUL2);

    // Pie: firma a la izquierda, estrella al centro, sesiones a la derecha
    const yPie = 92;
    try {
      const firma = await pdf.embedPng(await bytes(FIRMA));
      const alto = 52, ancho = alto * (firma.width / firma.height);
      page.drawImage(firma, { x: 96, y: yPie + 22, width: ancho, height: alto });
    } catch (_) {}
    page.drawLine({ start: { x: 84, y: yPie + 18 }, end: { x: 284, y: yPie + 18 }, thickness: 0.8, color: rgb(...INK2), opacity: 0.6 });
    page.drawText('Sergio Lizcano', { x: 84, y: yPie + 2, size: 11.5, font: f.bold, color: rgb(...INK) });
    page.drawText('Fundador de IA MASIVA e instructor del bootcamp', { x: 84, y: yPie - 12, size: 8.5, font: f.regular, color: rgb(...INK2) });

    try {
      const img = await pdf.embedJpg(await bytes(ESTRELLA));
      const lado = 124;
      page.drawImage(img, { x: (W - lado) / 2, y: yPie - 30, width: lado, height: lado });
    } catch (_) {
      page.drawCircle({ x: W / 2, y: yPie + 32, size: 40, borderColor: rgb(...AZUL), borderWidth: 1.2, color: rgb(...HALO) });
    }

    const derecha = (t, yy, font, s, color) => page.drawText(t, { x: W - 84 - font.widthOfTextAtSize(t, s), y: yy, size: s, font, color: rgb(...color) });
    let xr = W - 84 - (f.medium.widthOfTextAtSize('SESIONES DEL PROGRAMA', 8) + 1.8 * 20);
    for (const ch of 'SESIONES DEL PROGRAMA') { page.drawText(ch, { x: xr, y: yPie + 48, size: 8, font: f.medium, color: rgb(...INK2) }); xr += f.medium.widthOfTextAtSize(ch, 8) + 1.8; }
    derecha('1 · Gemini primeros pasos', yPie + 32, f.regular, 9.5, INK);
    derecha('2 · Proyectos grandes con Gemini', yPie + 18, f.regular, 9.5, INK);
    derecha('3 · Gemini para automatización y trabajo agéntico', yPie + 4, f.regular, 9.5, INK);
    derecha('6 horas de formación · iamasiva.co', yPie - 12, f.medium, 8.5, AZUL2);

    return pdf.save();
  }

  function fechaLarga(d) {
    const t = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'long', year: 'numeric' }).format(d || new Date());
    return t.replace(/ de (\d{4})$/, ' de $1');
  }

  function codigoDe(userId) {
    return String(userId || '').replace(/-/g, '').slice(0, 8).toUpperCase();
  }

  async function descargar(opts) {
    const datos = await generar(opts);
    const blob = new Blob([datos], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Certificado Bootcamp Gemini de 0 a 100 - ' + opts.nombre.replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.pdf';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return blob;
  }

  window.IMCertificado = { generar, descargar, fechaLarga, codigoDe };
})();
