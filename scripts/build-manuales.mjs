#!/usr/bin/env node
// Convierte los manuales de uso escritos en Markdown en el JSON que lee manuales/visor.js.
//
//   node scripts/build-manuales.mjs            -> construye 557, 400 y 200
//   node scripts/build-manuales.mjs 557        -> solo uno
//   node scripts/build-manuales.mjs --placeholders
//   node scripts/build-manuales.mjs 999 --origen=/otra/carpeta   -> origen alternativo (pruebas)
//        -> donde todavía no existe la captura, deja una caja punteada con su descripción
//
// Origen:  PLANES MEJORAS/manuales/manual-<n>.md   (no se publica, está fuera de git)
// Destino: manuales/<n>.json                       (se publica con el sitio)
// Capturas: manuales/<n>/captura-<k>.(png|jpg|jpeg|webp); si el archivo existe, se incluye.
//
// Markdown admitido: #, ##, ###, ####, párrafos, listas - y 1. (anidadas por sangría),
// **negrita**, *cursiva*, `código`, > cita, tablas con |, ``` bloques, --- y enlaces [t](https://...).
// Marcas de captura: [CAPTURA 3: descripción. Señalar en rojo: ...] en su propia línea o dentro de un párrafo.
// Imágenes ya existentes: ![pie de foto](https://...) en su propia línea. Videos: [VIDEO: https://www.youtube-nocookie.com/embed/ID] en su propia línea.
// Un ## llamado "Lista de capturas" es material de trabajo y no se publica; un ## "Índice" tampoco (el visor lo genera).

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argOrigen = process.argv.find(a => a.startsWith('--origen='));
const ORIGEN = argOrigen ? path.resolve(argOrigen.slice(9)) : path.join(ROOT, 'PLANES MEJORAS', 'manuales');
const DESTINO = path.join(ROOT, 'manuales');
const args = process.argv.slice(2);
const opts = { placeholders: args.includes('--placeholders'), permitirRayas: args.includes('--permitir-rayas') };
const herramientas = args.filter(a => /^\d+$/.test(a));
if (!herramientas.length) herramientas.push('557', '400', '200');

const NOMBRES = {
  '557': '557 Configuraciones para NotebookLM y Gemini',
  '400': '400 Skills para Gemini',
  '200': '200 Diseños para Presentaciones en NotebookLM',
};

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'seccion';

function inline(t) {
  let s = esc(t);
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:]|$)/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}

function figura(tool, n, desc) {
  const base = `manuales/${tool}/captura-${n}`;
  const ext = ['png', 'jpg', 'jpeg', 'webp'].find(e => fs.existsSync(path.join(ROOT, `${base}.${e}`)));
  const pie = desc.split(/\.\s*Se[ñn]alar/i)[0].replace(/\.$/, '');
  if (ext) return `<figure class="im-man-cap"><img src="${base}.${ext}" alt="${esc(pie)}" loading="lazy"><figcaption>${inline(pie)}</figcaption></figure>`;
  if (opts.placeholders) return `<figure class="im-man-cap pendiente">Captura ${n} (pendiente): ${inline(desc)}</figure>`;
  return '';
}

const RE_CAP = /\[CAPTURA\s*(\d+)\s*:\s*([^\]]+)\]/gi;
const RE_LISTA = /^(\s*)([-*]|\d+[.)])\s+(.*)$/;

function renderLista(items) {
  const ordered = items[0].ordered;
  let h = ordered ? '<ol>' : '<ul>';
  for (const it of items) {
    h += `<li>${inline(it.text)}${it.children.length ? renderLista(it.children) : ''}</li>`;
  }
  return h + (ordered ? '</ol>' : '</ul>');
}

function parsearLista(lines) {
  // lines: [{indent, ordered, text}] -> árbol por sangría
  const raiz = []; const pila = [{ indent: -1, children: raiz }];
  for (const l of lines) {
    const nodo = { ...l, children: [] };
    while (pila.length > 1 && pila[pila.length - 1].indent >= l.indent) pila.pop();
    pila[pila.length - 1].children.push(nodo);
    pila.push(nodo);
  }
  return raiz;
}

function convertir(tool, md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const doc = { herramienta: NOMBRES[tool] || tool, titulo: 'Manual de uso', generado: new Date().toISOString().slice(0, 10), capitulos: [] };
  let cap = null; const avisos = [];
  // Los capítulos pueden venir numerados en el .md ("3. Biblioteca"); el índice ya numera, así que se quita el prefijo
  const nuevoCap = (titulo) => { const mn = /^(\d+)[.)]\s+/.exec(titulo); const numero = mn ? Number(mn[1]) : null; titulo = titulo.replace(/^\d+[.)]\s+/, ''); cap = { id: slug(titulo), numero, titulo, secciones: [], html: '' }; doc.capitulos.push(cap); return cap; };
  const asegurarCap = () => cap || nuevoCap('Qué es');
  const figs = (texto) => { let out = ''; texto.replace(RE_CAP, (_, n, d) => { out += figura(tool, n, d.trim()); return ''; }); return out; };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = /^(#{1,4})\s+(.*?)\s*#*\s*$/.exec(line))) {
      const nivel = m[1].length, texto = m[2].trim();
      // El h1 puede ser "Manual de uso: <herramienta>": el índice solo muestra la parte corta
      if (nivel === 1) { if (!doc.capitulos.length && !cap) doc.titulo = texto.split(':')[0].trim() || 'Manual de uso'; else asegurarCap().html += `<h2>${inline(texto)}</h2>`; }
      else if (nivel === 2) nuevoCap(texto);
      else if (nivel === 3) { const c = asegurarCap(); let id = slug(texto); let k = 2; while (c.secciones.some(s => s.id === id)) id = slug(texto) + '-' + k++; c.secciones.push({ id, titulo: texto }); c.html += `<h3 id="man-${c.id}-${id}">${inline(texto)}</h3>`; }
      else asegurarCap().html += `<h4>${inline(texto)}</h4>`;
      i++; continue;
    }
    if (/^\s*```/.test(line)) {
      const buf = []; i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
      i++; asegurarCap().html += `<pre><code>${esc(buf.join('\n'))}</code></pre>`; continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { asegurarCap().html += '<hr>'; i++; continue; }
    let mi;
    if ((mi = /^\s*!\[([^\]]*)\]\(([^)\s]+)\)\s*$/.exec(line))) {
      asegurarCap().html += `<figure class="im-man-cap"><img src="${esc(mi[2])}" alt="${esc(mi[1])}" loading="lazy">${mi[1] ? `<figcaption>${inline(mi[1])}</figcaption>` : ''}</figure>`;
      i++; continue;
    }
    if ((mi = /^\s*\[VIDEO:\s*([^\]\s]+)\s*\]\s*$/i.exec(line))) {
      asegurarCap().html += `<div class="im-man-video"><iframe src="${esc(mi[1])}" title="Video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
      i++; continue;
    }
    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''));
      const parrafos = buf.join('\n').split(/\n\s*\n/).map(p => `<p>${inline(p.replace(/\n/g, ' ').trim())}</p>`).join('');
      asegurarCap().html += `<blockquote>${parrafos}</blockquote>`; continue;
    }
    if (/^\s*\|/.test(line)) {
      const filas = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) filas.push(lines[i++]);
      const celdas = (f) => f.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const cuerpo = filas.filter(f => !/^\s*\|?\s*:?-{2,}/.test(f));
      if (cuerpo.length) {
        const [cab, ...resto] = cuerpo.map(celdas);
        let h = '<table><thead><tr>' + cab.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
        for (const r of resto) h += '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
        asegurarCap().html += h + '</tbody></table>';
      }
      continue;
    }
    if (RE_LISTA.test(line)) {
      const items = [];
      while (i < lines.length && lines[i].trim()) {
        const lm = RE_LISTA.exec(lines[i]);
        if (lm) items.push({ indent: lm[1].replace(/\t/g, '  ').length, ordered: /\d/.test(lm[2]), text: lm[3] });
        else if (items.length && /^\s+/.test(lines[i])) items[items.length - 1].text += ' ' + lines[i].trim();
        else break;
        i++;
      }
      let extra = '';
      for (const it of items) { extra += figs(it.text); it.text = it.text.replace(RE_CAP, '').replace(/\s{2,}/g, ' ').trim(); }
      asegurarCap().html += renderLista(parsearLista(items)) + extra; continue;
    }
    // párrafo
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*```|\s*>|\s*\||\s*!\[|\s*\[VIDEO:)/i.test(lines[i]) && !RE_LISTA.test(lines[i]) && !/^\s*(-{3,}|\*{3,})\s*$/.test(lines[i])) buf.push(lines[i++].trim());
    const texto = buf.join(' ');
    const f = figs(texto);
    const limpio = texto.replace(RE_CAP, '').replace(/\s{2,}/g, ' ').trim();
    const c = asegurarCap();
    if (limpio) c.html += `<p>${inline(limpio)}</p>`;
    c.html += f;
  }

  // El capítulo "Lista de capturas" es material de trabajo
  // El visor ya pinta el índice, así que un ## "Índice" del .md tampoco se publica
  doc.capitulos = doc.capitulos.filter(c => !/lista de capturas|^[ií]ndice$/i.test(c.titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
  // Texto plano por capítulo para la búsqueda del índice
  for (const c of doc.capitulos) {
    c.texto = c.html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  // Ids de capítulo únicos
  const vistos = new Set();
  for (const c of doc.capitulos) { let id = c.id, k = 2; while (vistos.has(id)) id = c.id + '-' + k++; c.id = id; vistos.add(id); }
  return { doc, avisos };
}

let fallo = false;
for (const tool of herramientas) {
  const origen = path.join(ORIGEN, `manual-${tool}.md`);
  if (!fs.existsSync(origen)) { console.error(`[${tool}] falta ${origen}`); fallo = true; continue; }
  const md = fs.readFileSync(origen, 'utf8');
  const rayas = [];
  md.split('\n').forEach((l, n) => { if (/[—–]/.test(l)) rayas.push(n + 1); });
  if (rayas.length) {
    console.error(`[${tool}] hay guion largo o medio en las líneas: ${rayas.join(', ')}`);
    if (!opts.permitirRayas) { fallo = true; continue; }
  }
  const { doc } = convertir(tool, md);
  fs.mkdirSync(DESTINO, { recursive: true });
  const destino = path.join(DESTINO, `${tool}.json`);
  fs.writeFileSync(destino, JSON.stringify(doc, null, 1));
  const caps = (md.match(RE_CAP) || []).length;
  const conImagen = (doc.capitulos.map(c => c.html).join('').match(/<img /g) || []).length;
  console.log(`[${tool}] ${doc.capitulos.length} capítulos, ${doc.capitulos.reduce((a, c) => a + c.secciones.length, 0)} secciones, ${caps} marcas de captura (${conImagen} con imagen) -> ${path.relative(ROOT, destino)} (${(fs.statSync(destino).size / 1024).toFixed(0)} KB)`);
}
process.exit(fallo ? 1 : 0);
