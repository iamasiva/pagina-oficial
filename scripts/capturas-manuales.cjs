// Capturas de las herramientas de IA MASIVA con señalización roja (Chrome headless + puppeteer-core).
//
// Cómo usarlo (solo cuando cambie la interfaz y haya que regenerar las capturas de los manuales):
//   1. Servidor local: python3 -m http.server 4173 (o el preview "estatico").
//   2. Un usuario de prueba *@test.iamasiva.co con compras APROBADAS del 557 y el 400 y datos de ejemplo
//      (configuración guardada, variante, categorías y cuadernos con chats, servidor y módulo con skills, prompt propio).
//      Sus credenciales en un JSON {email, password} cuya ruta va en la variable CRED_RUTA.
//   3. Una página /_login-prueba.html que cargue supabase-js (sirve para iniciar sesión).
//   4. npm i puppeteer-core (en una carpeta aparte o temporalmente) y: node scripts/capturas-manuales.cjs [557-1 400-6 ...]
//   5. Al terminar: borrar el usuario de prueba con todas sus filas y la página de login.
// Las capturas de Gemini (557-3/4/5/6 y 400-9/10/11/12/13/14) las toma Sergio a mano.
// La 400-8 (Crear agente local) se retiró el 29 oct 2026 junto con la función.
const puppeteer = require('puppeteer-core');
const fs = require('fs'); const path = require('path');
const REPO = path.join(__dirname, '..');
const BASE = 'http://localhost:4173';
const CRED_RUTA = process.env.CRED_RUTA || path.join(__dirname, '..', 'credenciales_prueba.json');
const CRED = JSON.parse(fs.readFileSync(CRED_RUTA, 'utf8'));
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5aXlnbmZheGllanRsZ2traXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTU2ODksImV4cCI6MjA5MjA5MTY4OX0.jfDgQK31XdmY4yd0hMjEgu6b408mGuUSld2-njAujQc';
const solo = process.argv.slice(2); // p. ej. 557-1 400-6
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const HELPERS = `
  window.__norm = s => String(s || '').replace(/\\s+/g, ' ').trim();
  window.__visible = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  window.__byText = (text, opts = {}) => {
    const tags = opts.tags || 'button, a, [role=button], summary, label, h2, h3, h4, strong, span, div, p, li, option';
    const raiz = opts.within ? document.querySelector(opts.within) : document;
    const els = [...(raiz || document).querySelectorAll(tags)].filter(window.__visible);
    let best = null;
    for (const e of els) { const t = window.__norm(e.textContent); const ok = opts.exact ? t === text : t.includes(text); if (ok && (!best || e.textContent.length < best.textContent.length)) best = e; }
    return best;
  };
  window.__clickText = (text, opts) => { const e = window.__byText(text, opts); if (!e) throw new Error('no encontré el texto: ' + text); e.click(); return true; };
  window.__rect = (e) => { const r = e.getBoundingClientRect(); return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height }; };
  window.__marcar = (objetivos) => {
    document.querySelectorAll('.__cap').forEach(d => d.remove());
    const faltan = [];
    for (const o of objetivos) {
      let e = null;
      if (o.sel) e = [...document.querySelectorAll(o.sel)].filter(window.__visible)[o.nth || 0];
      else if (o.text) e = window.__byText(o.text, o);
      else if (o.labelField) { const l = window.__byText(o.labelField, { tags: 'label', exact: !!o.exact }); if (l) e = (l.htmlFor && document.getElementById(l.htmlFor)) || l.nextElementSibling; }
      if (!e) { faltan.push(JSON.stringify(o)); continue; }
      if (o.closest) e = e.closest(o.closest) || e;
      const r = window.__rect(e); const d = document.createElement('div'); d.className = '__cap';
      Object.assign(d.style, { position: 'absolute', left: (r.x - 5) + 'px', top: (r.y - 5) + 'px', width: (r.w + 10) + 'px', height: (r.h + 10) + 'px', border: '3px solid #e5322d', borderRadius: '9px', boxShadow: '0 0 0 2px rgba(255,255,255,.85)', pointerEvents: 'none', zIndex: 2147483647 });
      document.body.appendChild(d);
    }
    return faltan;
  };
`;

async function listo(page) {
  await page.waitForFunction(() => { const c = document.getElementById('imCargando'); return !c || getComputedStyle(c).display === 'none' || c.classList.contains('im-oculto'); }, { timeout: 30000 });
  await sleep(1200);
  await page.evaluate(HELPERS);
}
async function abrir(page, archivo, hash = '') {
  await page.goto(`${BASE}/${archivo}${hash}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await listo(page);
}
async function texto(page, t, opts) { await page.evaluate((t, o) => window.__clickText(t, o), t, opts || {}); await sleep(500); }
async function sel(page, s, nth = 0) { await page.evaluate((s, n) => { const e = [...document.querySelectorAll(s)].filter(window.__visible)[n]; if (!e) throw new Error('no encontré ' + s); e.click(); }, s, nth); await sleep(500); }
async function guardar(page, destino, objetivos, opciones = {}) {
  if (opciones.scrollTo) await page.evaluate((s) => { let e = null; try { e = document.querySelector(s); } catch (_) {} if (!e) e = window.__byText(s); if (e) e.scrollIntoView({ block: 'start' }); window.scrollBy(0, -16); }, opciones.scrollTo);
  if (opciones.scrollTop) await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
  const faltan = await page.evaluate((o) => window.__marcar(o), objetivos);
  if (faltan.length) console.log('   (sin marcar:', faltan.join(' | '), ')');
  const ruta = path.join(REPO, 'manuales', destino);
  const medidas = await page.evaluate((s) => { let y = 0; if (s) { let e = null; try { e = document.querySelector(s); } catch (_) {} if (!e) e = window.__byText(s); if (e) y = Math.max(0, e.getBoundingClientRect().top + window.scrollY - 130); } return { alto: document.documentElement.scrollHeight, y }; }, opciones.scrollTo || null);
  const clip = opciones.full ? { x: 0, y: 0, width: 1440, height: Math.min(medidas.alto, 4000) } : { x: 0, y: medidas.y, width: 1440, height: 900 };
  await page.screenshot({ path: ruta, clip, captureBeyondViewport: true });
  await page.evaluate(() => document.querySelectorAll('.__cap').forEach(d => d.remove()));
  console.log('✔', destino);
}

const BLOQUE = JSON.stringify({ version: 1, categoria: { nombre: 'Tienda de ropa', objetivo: 'Organizar la tienda: ventas, inventario y redes.', subcategorias: [
  { nombre: 'Ventas', objetivo: 'Atender clientes y cerrar ventas.', cuadernos: [ { titulo: 'Atención por WhatsApp', objetivo: 'Responder rápido y cerrar.', chats: [ { titulo: 'Plantillas de respuesta' } ] } ] },
  { nombre: 'Redes', objetivo: 'Publicar tres veces por semana.', cuadernos: [ { titulo: 'Ideas de publicaciones', objetivo: 'Un mes de contenido.', chats: [] } ] } ],
  cuadernos: [ { titulo: 'Inventario', objetivo: 'Saber qué se vende y qué no.', chats: [] } ] } }, null, 2);

const CAPTURAS = {
  '557-11': async (page) => { await abrir(page, 'recurso-557.html'); await guardar(page, '557/captura-11.png', [{ sel: '#imEmpieza' }, { sel: '#searchInput', closest: '.search-wrap' }, { text: 'Vida diaria, hogar y decisiones personales', closest: 'button, .card, [class*=card]' }]); },
  '557-1': async (page) => { await abrir(page, 'recurso-557.html'); await sel(page, '#treeRoot'); await sel(page, '#sidebarTree .tree-cat'); await guardar(page, '557/captura-1.png', [{ sel: '#sidebarTree' }, { sel: '#imTemaBtn' }, { sel: '#interfaceLanguage' }]); },
  '557-2': async (page) => { await abrir(page, 'recurso-557.html'); await texto(page, 'Vida diaria, hogar y decisiones personales'); await sleep(600); await sel(page, '#rolesGrid .config-row-rich'); await sleep(1500); await sel(page, '#generateConfig'); await sleep(800);
    await guardar(page, '557/captura-2.png', [{ sel: '#variantSelect' }, { sel: '#imFavStar' }, { sel: '#generateConfig' }, { sel: '#copyConfig' }, { sel: '#imSaveConfig' }], { full: true, scrollTop: true }); },
  '557-7': async (page) => { await abrir(page, 'recurso-557.html'); await sel(page, '.sidebar-link[data-tab="cuadernos"]'); await sleep(1200); await texto(page, 'Oficina', { tags: '.im-cofre, [class*=card], h3, strong, div' }); await sleep(800);
    await page.evaluate(() => { const c = [...document.querySelectorAll('#imCuadCards *')].filter(e => window.__visible(e) && window.__norm(e.textContent).startsWith('Correos y reportes')).pop(); const card = c.closest('[class*=cofre], [class*=card]') || c.parentElement; const b = card.querySelector('button'); if (b) b.click(); }); await sleep(500);
    await guardar(page, '557/captura-7.png', [{ sel: '#imCuadVolver' }, { sel: '#imBtnConectar' }, { sel: '#imBtnArbol' }, { sel: '#imBtnNuevaCat' }, { sel: '#imBtnNuevoCuad' }, { text: 'Mover', exact: true, closest: '[class*=menu]' }]); },
  '557-8': async (page) => { await abrir(page, 'recurso-557.html'); await sel(page, '.sidebar-link[data-tab="cuadernos"]'); await sleep(1200); await texto(page, 'Oficina', { tags: '.im-cofre, [class*=card], h3, strong, div' }); await sleep(600); await sel(page, '#imBtnNuevoCuad'); await sleep(600);
    await guardar(page, '557/captura-8.png', [{ labelField: 'Link del cuaderno en Gemini' }, { labelField: 'Link del cuaderno en NotebookLM' }, { labelField: 'Configuración (opcional)' }, { labelField: 'Categoría (opcional)' }, { labelField: 'Subcategoría (opcional)' }]); },
  '557-9': async (page) => { await abrir(page, 'recurso-557.html'); await sel(page, '.sidebar-link[data-tab="cuadernos"]'); await sleep(1200); await texto(page, 'Oficina', { tags: '.im-cofre, [class*=card], h3, strong, div' }); await sleep(600); await texto(page, 'Correos y reportes', { tags: '.im-cofre, [class*=card], h3, strong, div' }); await sleep(600); await texto(page, 'Correos a clientes', { tags: '[class*=tapa], [class*=card], h3, strong, div, button' }); await sleep(900);
    await guardar(page, '557/captura-9.png', [{ text: 'Ver completo' }, { text: 'Copiar objetivo' }, { text: 'Abrir en Gemini' }, { text: 'Abrir en Notebook' }, { text: 'Guardar chat' }, { text: 'Conectar este cuaderno' }]); },
  '557-10': async (page) => { await abrir(page, 'recurso-557.html'); await sel(page, '.sidebar-link[data-tab="cuadernos"]'); await sleep(1200); await sel(page, '#imBtnImportar'); await sleep(600);
    await page.evaluate((b) => { const ta = document.getElementById('imImpTexto'); ta.value = b; ta.dispatchEvent(new Event('input', { bubbles: true })); }, BLOQUE); await sel(page, '#imImpVer'); await sleep(900);
    await guardar(page, '557/captura-10.png', [{ sel: '#imImpEditar' }, { sel: '#imImpCrear' }, { sel: '#imImpPrevArbol' }]); },
  '400-15': async (page) => { await abrir(page, 'recurso-400.html'); await guardar(page, '400/captura-15.png', [{ sel: '#imEmpieza' }, { text: 'Sin herramienta (chat normal)', exact: true }, { sel: '#categoryGrid > *' }]); },
  '400-1': async (page) => { await abrir(page, 'recurso-400.html'); await sel(page, '#treeRootBtn'); await sel(page, '#toolTree > *'); await guardar(page, '400/captura-1.png', [{ sel: '#treeRootBtn' }, { sel: '#toolTree' }]); },
  '400-2': async (page) => { await abrir(page, 'recurso-400.html'); await sel(page, '#categoryGrid > *'); await sleep(600); await sel(page, '#gemList > *'); await sleep(1200);
    await guardar(page, '400/captura-2.png', [{ sel: '#detailSkillChip' }, { text: 'Copiar', exact: true, nth: 0 }, { sel: '#copyConfigBtn' }, { sel: '#detailHerramientaValue' }], { full: true, scrollTop: true }); },
  '400-3': async (page) => { await abrir(page, 'recurso-400.html'); await sel(page, '#categoryGrid > *'); await sleep(600);
    let ok = false;
    for (let i = 0; i < 8 && !ok; i++) {
      await sel(page, '#gemList > *', i); await sleep(1000);
      ok = await page.evaluate(() => { const s = [...document.querySelectorAll('#promptForm select')].find(s => [...s.options].some(o => /^otro/i.test(o.textContent.trim()))); if (!s) return false; s.value = [...s.options].find(o => /^otro/i.test(o.textContent.trim())).value; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); return true; });
      if (!ok) { await sel(page, '#backToLibraryBtn'); await sleep(600); }
    }
    await sleep(400);
    await guardar(page, '400/captura-3.png', [{ sel: '#promptForm input[placeholder*="Escribe"]' }, { sel: '#promptOutput' }, { sel: '#copyPromptBtn' }, { text: 'Restablecer', exact: true }, { text: 'Guardar en mis agentes', exact: true }], { scrollTo: '#promptForm' }); },
  '400-4': async (page) => { await abrir(page, 'recurso-400.html'); await sel(page, '.sidebar-link[data-nav="misgemas"]'); await sleep(1200);
    await page.evaluate(() => { const c = [...document.querySelectorAll('#imMgCards *')].filter(e => window.__visible(e) && window.__norm(e.textContent).startsWith('Oficina')).pop(); const card = c.closest('[class*=cofre], [class*=card]') || c.parentElement; const b = card.querySelector('button'); if (b) b.click(); }); await sleep(500);
    await guardar(page, '400/captura-4.png', [{ sel: '#imMgDescargarTodas' }, { sel: '#imMgNuevaCat' }, { sel: '#imMgNuevaGema' }, { text: 'Eliminar', exact: true, closest: '[class*=menu]' }]); },
  '400-5': async (page) => { await abrir(page, 'recurso-400.html'); await sel(page, '.sidebar-link[data-nav="misgemas"]'); await sleep(1200); await sel(page, '#imMgNuevaGema'); await sleep(500); await texto(page, 'Una skill creada por mí'); await sleep(600);
    await page.evaluate(() => { const s = document.getElementById('imGemaSelCat') || [...document.querySelectorAll('#imModalGema select')][0]; const o = [...s.options].find(o => /Nuevo servidor/.test(o.textContent)); if (o) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); } }); await sleep(400);
    await guardar(page, '400/captura-5.png', [{ sel: '#imGemaUrl' }, { sel: '#imGemaInstr' }, { labelField: 'Servidor (opcional)' }, { labelField: 'Módulo (opcional)' }]); },
  '400-6': async (page) => { await abrir(page, 'recurso-400.html'); await sel(page, '.sidebar-link[data-nav="misgemas"]'); await sleep(1200); await texto(page, 'Oficina', { tags: '[class*=cofre], [class*=card], h3, strong, div' }); await sleep(600); await texto(page, 'Correos', { tags: '[class*=cofre], [class*=card], h3, strong, div', exact: true }); await sleep(600); await texto(page, 'Investigador Pro', { tags: '[class*=gemtile], [class*=card], div, h3' }); await sleep(900); await texto(page, 'Prompts', { tags: 'button, [role=tab], div, span' }); await sleep(500);
    await guardar(page, '400/captura-6.png', [{ text: '@', tags: 'button' }, { text: 'Skill', exact: true, tags: 'button' }, { text: 'Chats', tags: 'button, [role=tab], div, span' }, { text: 'Prompts', tags: 'button, [role=tab], div, span' }, { text: 'Agregar prompt' }, { text: 'Llenar y copiar', exact: true }]); },
  '400-7': async (page) => { await abrir(page, 'recurso-400.html'); await sel(page, '.sidebar-link[data-nav="misgemas"]'); await sleep(1200); await texto(page, 'Oficina', { tags: '[class*=cofre], [class*=card], h3, strong, div' }); await sleep(600); await texto(page, 'Correos', { tags: '[class*=cofre], [class*=card], h3, strong, div', exact: true }); await sleep(600); await texto(page, 'Investigador Pro', { tags: '[class*=gemtile], [class*=card], div, h3' }); await sleep(900); await texto(page, 'Prompts', { tags: 'button, [role=tab], div, span' }); await sleep(500); await texto(page, 'Ver', { exact: true, tags: 'button' }); await sleep(600);
    await page.evaluate(() => { const i = document.querySelector('#imUsarCampos input, #imUsarCampos textarea'); if (i) { i.value = 'Acme Logística'; i.dispatchEvent(new Event('input', { bubbles: true })); i.blur(); } }); await sleep(400);
    await guardar(page, '400/captura-7.png', [{ sel: '#imUsarCampos' }, { sel: '#imModalUsarPrompt textarea, #imModalUsarPrompt pre, #imModalUsarPrompt [class*=salida]' }, { text: 'Editar plantilla', exact: true }]); },
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  page.on('pageerror', e => console.log('   [pageerror]', e.message));
  // Sesión
  await page.goto(`${BASE}/_login-prueba.html`, { waitUntil: 'networkidle2' });
  const r = await page.evaluate(async (anon, email, pass) => { const sb = supabase.createClient('https://api.iamasiva.co', anon); const r = await sb.auth.signInWithPassword({ email, password: pass }); return { ok: !!r.data.session, error: r.error?.message || null }; }, ANON, CRED.email, CRED.password);
  console.log('sesión:', JSON.stringify(r));
  const claves = Object.keys(CAPTURAS).filter(k => !solo.length || solo.includes(k));
  for (const k of claves) {
    try { await CAPTURAS[k](page); } catch (e) { console.log('✘', k, e.message.split('\n')[0]); }
  }
  await browser.close();
})();
