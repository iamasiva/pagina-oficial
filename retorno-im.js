/* Volver al lugar exacto desde donde se abrió un recurso.
   Cada pestaña lleva una pila de páginas (sessionStorage), como el "Atrás" del
   navegador: catálogo → bootcamp → 557 → Salir → bootcamp → Volver → catálogo.
   La página que se deja guarda su posición (y su vista, si la tiene); la que
   recibe el regreso la restaura con IMRetorno.alVolver().
   - Los enlaces a recursos guardan el origen solos (clic en <a>).
   - Los enlaces de salida llevan data-im-volver; su href es el destino de
     siempre cuando no hay origen conocido (entrada directa, pestaña nueva). */
(function () {
  const CLAVE = 'im_retorno_v1';
  const VIGENCIA = 12 * 3600 * 1000;
  const RECURSOS = ['recurso-557.html', 'recurso-400.html', 'recurso-200.html', 'recurso-bootcamp.html', 'bootcamp-recurso.html', 'bootcamp-clase.html'];
  const nombre = (url) => String(url || '').split('#')[0].split('?')[0].split('/').pop() || 'index.html';
  const actual = () => nombre(location.pathname);
  const leer = () => {
    try {
      const d = JSON.parse(sessionStorage.getItem(CLAVE) || '{}') || {};
      if (!d.t || Date.now() - d.t > VIGENCIA) return { pila: [], estados: {} };
      return { pila: d.pila || [], estados: d.estados || {}, volviendo: d.volviendo };
    } catch (_) { return { pila: [], estados: {} }; }
  };
  const escribir = (d) => { try { sessionStorage.setItem(CLAVE, JSON.stringify({ ...d, t: Date.now() })); } catch (_) {} };

  // La pila termina siempre en la página actual; si no (entrada directa), arranca en ella
  function anclar(d) {
    const i = d.pila.lastIndexOf(actual());
    d.pila = i === -1 ? [actual()] : d.pila.slice(0, i + 1);
  }

  const IMRetorno = {
    // La página puede sumar su vista al estado que se guarda (app.html: Tus compras, Favoritos...)
    estadoExtra: null,
    // Se deja esta página para abrir un recurso: se guarda dónde estaba
    salir(destino, estado) {
      const d = leer();
      anclar(d);
      const extra = typeof IMRetorno.estadoExtra === 'function' ? IMRetorno.estadoExtra() : {};
      d.estados[actual()] = { y: Math.round(window.scrollY), ...extra, ...(estado || {}) };
      const dest = nombre(destino);
      const i = d.pila.indexOf(dest);
      // Ir a una página que ya está atrás en la pila es volver a ella
      d.pila = i === -1 ? [...d.pila, dest] : d.pila.slice(0, i + 1);
      delete d.volviendo;
      escribir(d);
    },
    // Salir o Cerrar: a la página anterior de la pila, o a la de siempre
    volver(defecto, reemplazar) {
      const d = leer();
      const i = d.pila.lastIndexOf(actual());
      const destino = i > 0 ? d.pila[i - 1] : defecto;
      IMRetorno.irA(destino, reemplazar, d);
    },
    // Regreso a una página concreta (el visor del catálogo vuelve al bootcamp)
    irA(destino, reemplazar, datos) {
      const d = datos || leer();
      const dest = nombre(destino);
      const i = d.pila.lastIndexOf(dest);
      d.pila = i === -1 ? [dest] : d.pila.slice(0, i + 1);
      d.volviendo = dest;
      escribir(d);
      if (reemplazar) location.replace(destino); else location.href = destino;
    },
    // Al cargar: si se está volviendo a esta página, entrega lo que guardó
    alVolver() {
      const d = leer();
      if (d.volviendo !== actual()) return null;
      delete d.volviendo;
      escribir(d);
      return d.estados[actual()] || { y: 0 };
    },
    // ¿Hay un regreso pendiente hacia esta página? (para no mostrarla antes de restaurarla)
    hayRegreso() { return leer().volviendo === actual(); },
  };
  window.IMRetorno = IMRetorno;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href) && !href.startsWith(location.origin)) return;
    if (a.hasAttribute('data-im-volver')) { e.preventDefault(); IMRetorno.volver(href); return; }
    if (RECURSOS.includes(nombre(href)) && nombre(href) !== actual()) IMRetorno.salir(href);
  }, true);
})();
