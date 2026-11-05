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
  const ESTRELLA = 'https://iyiygnfaxiejtlgkkivs.supabase.co/storage/v1/object/public/portadas/bootcamp-estrella-certificado.png';
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

  async function generar({ nombre, codigo, fecha }) {
    const { PDFDocument, rgb } = PDFLib;
    const pdf = await PDFDocument.create();
    pdf.setTitle('Certificado · Bootcamp Gemini de 0 a 100 · IA MASIVA');
    pdf.setAuthor('IA MASIVA');
    pdf.setSubject('Certificado de participación de ' + nombre);
    const page = pdf.addPage([W, H]);
    const f = await cargarFuentes(pdf);
    nombre = compatible(f.bold, String(nombre || '').trim());

    // Fondo y halos (la identidad del bootcamp: blanco con luz azul en las esquinas)
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
    page.drawCircle({ x: W - 60, y: H + 40, size: 300, color: rgb(...HALO2), opacity: 0.9 });
    page.drawCircle({ x: W - 20, y: H + 80, size: 190, color: rgb(1, 1, 1), opacity: 0.55 });
    page.drawCircle({ x: 40, y: -60, size: 260, color: rgb(...HALO), opacity: 0.95 });
    // Marco fino
    page.drawRectangle({ x: 28, y: 28, width: W - 56, height: H - 56, borderColor: rgb(...BORDE), borderWidth: 1.2 });
    page.drawRectangle({ x: 36, y: 36, width: W - 72, height: H - 72, borderColor: rgb(...AZUL), borderWidth: 0.8, opacity: 0.9 });

    // Cabecera: marca a la izquierda, programa a la derecha
    let x = 64; const yTop = H - 74;
    for (const ch of 'IA MASIVA') { page.drawText(ch, { x, y: yTop, size: 13, font: f.bold, color: rgb(...INK) }); x += f.bold.widthOfTextAtSize(ch, 13) + 2.6; }
    const etq = 'BOOTCAMP · GEMINI DE 0 A 100';
    let xe = W - 64 - (f.medium.widthOfTextAtSize(etq, 9.5) + 2.2 * (etq.length - 1));
    for (const ch of etq) { page.drawText(ch, { x: xe, y: yTop + 1, size: 9.5, font: f.medium, color: rgb(...AZUL) }); xe += f.medium.widthOfTextAtSize(ch, 9.5) + 2.2; }

    // Título
    centrado(page, 'CERTIFICADO DE PARTICIPACIÓN', H - 150, f.medium, 11, INK2, 3.2);
    centrado(page, 'Este certificado se otorga a', H - 196, f.regular, 15, INK);

    // Nombre: tamaño automático para que quepa en una línea
    let size = 44; const maxNombre = W - 180;
    while (size > 22 && f.bold.widthOfTextAtSize(nombre, size) > maxNombre) size -= 1;
    centrado(page, nombre, H - 258, f.bold, size, AZUL);
    const anchoLinea = Math.min(maxNombre, Math.max(220, f.bold.widthOfTextAtSize(nombre, size) + 40));
    page.drawLine({ start: { x: (W - anchoLinea) / 2, y: H - 276 }, end: { x: (W + anchoLinea) / 2, y: H - 276 }, thickness: 1.2, color: rgb(...AZUL), opacity: 0.55 });

    // Cuerpo
    const cuerpo = 'por su participación en el Bootcamp Gemini de 0 a 100, un programa de tres clases para pasar de preguntarle cosas a Gemini a dirigirlo: configurarlo a su medida, trabajar proyectos completos y dejar agentes trabajando por usted.';
    let y = H - 312;
    for (const l of lineas(cuerpo, f.regular, 12.5, 560)) { centrado(page, l, y, f.regular, 12.5, INK); y -= 19; }
    y -= 6;
    centrado(page, 'Gemini primeros pasos  ·  Proyectos grandes con Gemini  ·  Gemini para automatización y trabajo agéntico', y, f.medium, 10.5, INK2);

    // Pie: firma, estrella y datos de emisión
    const yPie = 96;
    page.drawLine({ start: { x: 84, y: yPie + 30 }, end: { x: 284, y: yPie + 30 }, thickness: 0.8, color: rgb(...INK2), opacity: 0.6 });
    page.drawText('Sergio Lizcano', { x: 84, y: yPie + 12, size: 12, font: f.bold, color: rgb(...INK) });
    page.drawText('Fundador de IA MASIVA', { x: 84, y: yPie - 4, size: 9.5, font: f.regular, color: rgb(...INK2) });

    try {
      const img = await pdf.embedPng(await bytes(ESTRELLA));
      const alto = 132, ancho = alto * (img.width / img.height);
      page.drawImage(img, { x: (W - ancho) / 2, y: yPie - 34, width: ancho, height: alto });
    } catch (_) {
      page.drawCircle({ x: W / 2, y: yPie + 30, size: 34, borderColor: rgb(...AZUL), borderWidth: 1.2, color: rgb(...HALO) });
    }

    const derecha = (t, yy, font, s, color) => page.drawText(t, { x: W - 84 - font.widthOfTextAtSize(t, s), y: yy, size: s, font, color: rgb(...color) });
    derecha('Emitido el ' + fecha, yPie + 24, f.medium, 10.5, INK);
    derecha('Código de verificación ' + codigo, yPie + 8, f.regular, 9.5, INK2);
    derecha('iamasiva.co', yPie - 8, f.regular, 9.5, AZUL2);

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
