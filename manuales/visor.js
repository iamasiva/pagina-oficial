/* Visor del Manual de uso de IA MASIVA.
   Modo "lateral" (557 y 400): al abrir el manual, la barra lateral de la herramienta se convierte
   en el índice del manual (con botón para volver) y el capítulo se pinta en la sección indicada.
   Modo "pagina" (200): el manual ocupa una sección completa con su propio índice a la izquierda.

   IM_MANUAL.configurar({
     url: 'manuales/557.json',
     modo: 'lateral' | 'pagina',
     contenedor: '#guide',          // dónde se pinta el capítulo (o toda la vista en modo "pagina")
     sidebarScroll: '.sidebar-scroll', // solo modo lateral: dónde se monta el índice
     textoVolver: 'Volver a la herramienta',
     desplazamiento: 0,             // alto de cabeceras fijas, para que las anclas no queden tapadas
     alAbrir: () => {},             // mostrar la sección contenedora (switchTab, showSection...)
     alCerrar: () => {},            // volver a la pantalla normal
     cerrarMenu: () => {}           // cerrar el menú lateral en celular
   });
   IM_MANUAL.abrir(capituloId?, seccionId?)  /  IM_MANUAL.cerrar()
   Enlace profundo: pagina.html#manual/<capitulo>/<seccion> abre el manual directamente. */
(function () {
  'use strict';
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const FLECHA = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg>';
  const LUPA = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.35-4.35"></path></svg>';

  const V = { cfg: null, datos: null, promesa: null, abierto: false, capId: null, idx: null, principal: null };

  function configurar(o) {
    V.cfg = Object.assign({
      modo: 'lateral', titulo: 'Manual de uso', textoVolver: 'Volver a la herramienta',
      sidebarScroll: '.sidebar-scroll', desplazamiento: 0, alAbrir: null, alCerrar: null, cerrarMenu: null,
    }, o || {});
    const porHash = () => { const m = /^#manual(?:\/([^/]+))?(?:\/([^/]+))?$/.exec(location.hash); if (m) abrir(m[1], m[2]); };
    porHash();
    // Un enlace #manual/... pegado estando ya en la página (por ejemplo desde Soporte) también abre el manual
    window.addEventListener('hashchange', porHash);
  }

  function cargar() {
    if (V.datos) return Promise.resolve(V.datos);
    if (!V.promesa) {
      V.promesa = fetch(V.cfg.url, { cache: 'no-cache' })
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then((d) => (V.datos = d))
        .catch((e) => { V.promesa = null; throw e; });
    }
    return V.promesa;
  }

  function contenedor() { return document.querySelector(V.cfg.contenedor); }

  function abrir(capId, secId) {
    const cont = contenedor();
    if (!V.cfg || !cont) return;
    V.abierto = true;
    document.body.classList.add('im-manual-abierto');
    if (typeof V.cfg.alAbrir === 'function') V.cfg.alAbrir();
    if (!V.datos) cont.innerHTML = '<div class="im-man-vista"><div class="im-man-cuerpo"><p class="im-man-cargando">Cargando el manual…</p></div></div>';
    cargar().then(() => {
      if (!V.abierto) return;
      montar();
      const cap = V.datos.capitulos.find((c) => c.id === capId) || V.datos.capitulos[0];
      if (cap) mostrar(cap.id, secId || null);
    }).catch(() => {
      cont.innerHTML = '<div class="im-man-vista"><div class="im-man-error">No pudimos cargar el manual. Revisa tu conexión e inténtalo de nuevo.</div></div>';
    });
  }

  function cerrar() {
    V.abierto = false;
    document.body.classList.remove('im-manual-abierto');
    if (/^#manual/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    if (typeof V.cfg.alCerrar === 'function') V.cfg.alCerrar();
  }

  function montar() {
    if (V.idx) return;
    V.idx = construirIndice();
    if (V.cfg.modo === 'pagina') {
      const cont = contenedor();
      cont.innerHTML = '<div class="im-man-pagina"><aside class="im-man-lateral"></aside><div class="im-man-principal"></div></div>';
      cont.querySelector('.im-man-lateral').appendChild(V.idx);
      V.principal = cont.querySelector('.im-man-principal');
    } else {
      const sc = document.querySelector(V.cfg.sidebarScroll);
      if (sc) sc.appendChild(V.idx);
      V.principal = contenedor();
    }
  }

  function construirIndice() {
    const d = V.datos, c = V.cfg;
    const div = document.createElement('div');
    div.className = 'im-man-idx';
    div.innerHTML =
      '<button type="button" class="im-man-volver">' + FLECHA + '<span>' + esc(c.textoVolver) + '</span></button>' +
      '<div class="im-man-idx-titulo">' + esc(d.titulo || c.titulo) + '</div>' +
      '<label class="im-man-buscar-caja">' + LUPA + '<input type="search" class="im-man-buscar" placeholder="Buscar en el manual" aria-label="Buscar en el manual"></label>' +
      '<ol class="im-man-caps"></ol>' +
      '<p class="im-man-sin" hidden>Sin resultados.</p>';
    const ol = div.querySelector('.im-man-caps');
    d.capitulos.forEach((cap, i) => {
      const li = document.createElement('li');
      li.className = 'im-man-cap-item';
      li.dataset.cap = cap.id;
      li.innerHTML =
        '<button type="button" class="im-man-cap-btn" data-cap="' + esc(cap.id) + '"><span class="n' + (cap.numero ? '' : ' sin') + '">' + (cap.numero || '·') + '</span><span>' + esc(cap.titulo) + '</span></button>' +
        (cap.secciones.length
          ? '<ul class="im-man-secs">' + cap.secciones.map((s) => '<li><button type="button" class="im-man-sec-btn" data-cap="' + esc(cap.id) + '" data-sec="' + esc(s.id) + '">' + esc(s.titulo) + '</button></li>').join('') + '</ul>'
          : '');
      ol.appendChild(li);
    });
    div.querySelector('.im-man-volver').addEventListener('click', cerrar);
    div.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-cap]');
      if (!b) return;
      mostrar(b.dataset.cap, b.dataset.sec || null);
      if (typeof c.cerrarMenu === 'function') c.cerrarMenu();
      const lat = div.closest('.im-man-lateral');
      if (lat) lat.classList.remove('abierto');
    });
    div.querySelector('.im-man-buscar').addEventListener('input', (e) => filtrar(e.target.value));
    return div;
  }

  function filtrar(q) {
    const n = norm(q.trim());
    const idx = V.idx;
    idx.classList.toggle('buscando', !!n);
    let visibles = 0;
    idx.querySelectorAll('.im-man-cap-item').forEach((li) => {
      const cap = V.datos.capitulos.find((c) => c.id === li.dataset.cap) || {};
      const secs = li.querySelectorAll('.im-man-secs > li');
      if (!n) { li.hidden = false; secs.forEach((s) => { s.hidden = false; }); return; }
      let alguna = false;
      secs.forEach((s) => { const ok = norm(s.textContent).includes(n); s.hidden = !ok; if (ok) alguna = true; });
      const ok = alguna || norm(cap.titulo).includes(n) || (cap.texto || '').includes(n);
      li.hidden = !ok;
      if (ok) visibles++;
    });
    idx.querySelector('.im-man-sin').hidden = !n || visibles > 0;
  }

  function mostrar(capId, secId) {
    const caps = V.datos.capitulos;
    const i = caps.findIndex((c) => c.id === capId);
    if (i < 0) return;
    const cap = caps[i], ant = caps[i - 1], sig = caps[i + 1];
    if (V.capId !== cap.id) {
      V.capId = cap.id;
      V.principal.innerHTML =
        (V.cfg.modo === 'pagina' ? '<button type="button" class="im-man-idx-toggle">Índice del manual</button>' : '') +
        '<div class="im-man-vista">' +
          '<div class="im-man-migas">' + esc(V.datos.titulo || V.cfg.titulo) + (cap.numero ? ' · Capítulo ' + cap.numero : '') + '</div>' +
          '<article class="im-man-cuerpo"><h2>' + esc(cap.titulo) + '</h2>' + cap.html + '</article>' +
          '<nav class="im-man-pie">' +
            (ant ? '<button type="button" class="ant" data-cap="' + esc(ant.id) + '"><span>Anterior</span>' + esc(ant.titulo) + '</button>' : '<span></span>') +
            (sig ? '<button type="button" class="sig" data-cap="' + esc(sig.id) + '"><span>Siguiente</span>' + esc(sig.titulo) + '</button>' : '') +
          '</nav>' +
        '</div>';
      V.principal.querySelectorAll('.im-man-pie button').forEach((b) => b.addEventListener('click', () => mostrar(b.dataset.cap, null)));
      const tg = V.principal.querySelector('.im-man-idx-toggle');
      if (tg) tg.addEventListener('click', () => { const lat = V.principal.parentElement.querySelector('.im-man-lateral'); if (lat) lat.classList.toggle('abierto'); });
      V.idx.querySelectorAll('.im-man-cap-item').forEach((li) => li.classList.toggle('activo', li.dataset.cap === cap.id));
    }
    V.idx.querySelectorAll('.im-man-sec-btn').forEach((b) => b.classList.toggle('activo', b.dataset.cap === cap.id && b.dataset.sec === secId));
    history.replaceState(null, '', '#manual/' + cap.id + (secId ? '/' + secId : ''));
    const objetivo = secId ? document.getElementById('man-' + cap.id + '-' + secId) : V.principal;
    const y = (objetivo ? objetivo.getBoundingClientRect().top + window.scrollY : 0) - (V.cfg.desplazamiento || 0) - (secId ? 14 : 0);
    // 'instant' y no 'auto': con scroll-behavior: smooth en la página, 'auto' anima y otros scrolls lo cancelan
    window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
  }

  window.IM_MANUAL = { configurar, abrir, cerrar, get abierto() { return V.abierto; } };
})();
