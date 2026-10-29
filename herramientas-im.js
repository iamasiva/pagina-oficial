/* Accesos entre los recursos premium (557, 400 y 200).
   Quien tiene el recurso lo abre con un clic; quien no, lo ve apagado y con
   "Activar", que lleva a su landing. Lo decide el RLS de premium_items, la
   misma regla que abre cada recurso (compra aprobada, pack o admin).
   Cada página pone su contenedor y su estilo; aquí solo vive la lógica. */
(function () {
  const RECURSOS = {
    '557': {
      id: '656f61d7-37b2-4e9c-8cf3-67065484493c', pagina: 'recurso-557.html',
      nombre: { es: '557 configuraciones', en: '557 configurations', pt: '557 configurações', fr: '557 configurations', de: '557 Konfigurationen', it: '557 configurazioni' },
      icono: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 21v-7"></path><path d="M4 10V3"></path><path d="M12 21v-9"></path><path d="M12 8V3"></path><path d="M20 21v-5"></path><path d="M20 12V3"></path><path d="M1 14h6"></path><path d="M9 8h6"></path><path d="M17 16h6"></path></svg>',
    },
    '400': {
      id: '0f0d6926-5328-4e3e-89a4-92b36ef13996', pagina: 'recurso-400.html',
      nombre: { es: '400 skills Gemini', en: '400 Gemini skills', pt: '400 skills Gemini', fr: '400 skills Gemini', de: '400 Gemini-Skills', it: '400 skill Gemini' },
      icono: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"></path><path d="M2 9h20"></path></svg>',
    },
    '200': {
      id: '2c296299-d9a4-4409-bc99-67b4999e47f8', pagina: 'recurso-200.html',
      nombre: { es: '200 diseños NotebookLM', en: '200 NotebookLM designs', pt: '200 designs NotebookLM', fr: '200 designs NotebookLM', de: '200 NotebookLM-Designs', it: '200 design NotebookLM' },
      icono: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="13" rx="2"></rect><path d="M12 16v5"></path><path d="M8 21h8"></path></svg>',
    },
  };
  const ACTIVAR = { es: 'Activar', en: 'Activate', pt: 'Ativar', fr: 'Activer', de: 'Aktivieren', it: 'Attiva' };
  const HERRAMIENTAS = { es: 'Herramientas', en: 'Tools', pt: 'Ferramentas', fr: 'Outils', de: 'Werkzeuge', it: 'Strumenti' };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function filaHtml(cod, tiene, lang) {
    const r = RECURSOS[cod];
    const nombre = esc(r.nombre[lang] || r.nombre.es);
    if (tiene) {
      return `<div class="im-herr-fila"><a class="im-herr-link" href="${r.pagina}">${r.icono}<span>${nombre}</span></a></div>`;
    }
    return `<div class="im-herr-fila apagada">` +
      `<span class="im-herr-link" aria-disabled="true">${r.icono}<span>${nombre}</span></span>` +
      `<a class="im-herr-activar" href="producto.html?p=${r.id}">${esc(ACTIVAR[lang] || ACTIVAR.es)}</a></div>`;
  }

  // opciones: { actual: '400', lista: elemento, etiqueta?: elemento, idioma?: () => 'es' }
  async function iniciar(op) {
    const IM = window.__IM;
    if (!IM || !op.lista) return;
    const idioma = () => (op.idioma ? op.idioma() : 'es');
    // Orden fijo (las claves numéricas de un objeto se ordenan solas de menor a mayor)
    const otros = ['557', '400', '200'].filter((c) => c !== op.actual);
    const CLAVE = 'im_herramientas_' + IM.userId;
    // null = aún no se sabe: se pinta como abierto (si no lo tiene, el recurso muestra su propio portón)
    let estado = {};
    try { estado = JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}; } catch (_) {}

    const pintar = () => {
      const lang = idioma();
      op.lista.innerHTML = otros.map((c) => filaHtml(c, estado[c] !== false, lang)).join('');
      if (op.etiqueta) op.etiqueta.textContent = HERRAMIENTAS[lang] || HERRAMIENTAS.es;
    };
    pintar();

    const consultas = await Promise.all(otros.map((c) =>
      IM.sb.from('premium_items').select('id').eq('product_id', RECURSOS[c].id).limit(1)
        .then(({ data, error }) => (error ? null : (data || []).length > 0), () => null)));
    otros.forEach((c, i) => { if (consultas[i] !== null) estado[c] = consultas[i]; });
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (_) {}
    pintar();
    return { repintar: pintar };
  }

  window.IMHerramientas = { iniciar };
})();
