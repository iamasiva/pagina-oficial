#!/usr/bin/env python3
"""Ensambla recurso-200.html desde la fuente del producto "200 diseños".

Regla de oro (CONTEXTO del producto): la UI del producto NO se toca — la página
fiel se genera desde app/index.template.html + app/app.js tal cual, y se
inyecta: noindex, título, portón de acceso, bootstrap de Supabase (RLS como
candado) y el espacio personal "Mis diseños" (guardar personalizaciones con
nombre + categorías planas sin subcategorías, en los 6 idiomas de la app).
Único parche técnico al app: loading="lazy" en las imágenes de la galería.

Uso:  python3 scripts/generar-recurso-200.py
"""

SRC = '/Users/sergiolizcano/Desktop/PROYECTOS/PROYECTOS IA MASIVA/VERSIONES FINALES RECURSOS/200 diseños para presentaciones'
OUT = 'recurso-200.html'
PRODUCT_ID = '2c296299-d9a4-4409-bc99-67b4999e47f8'
SUPABASE_URL = 'https://iyiygnfaxiejtlgkkivs.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5aXlnbmZheGllanRsZ2traXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTU2ODksImV4cCI6MjA5MjA5MTY4OX0.jfDgQK31XdmY4yd0hMjEgu6b408mGuUSld2-njAujQc'
PREVIEWS_BASE = f'{SUPABASE_URL}/storage/v1/object/public/previews-200/'

template = open(f'{SRC}/app/index.template.html').read()
app_js = open(f'{SRC}/app/app.js').read()

# Parche de performance (no cambia el diseño): la galería carga perezoso.
viejo_img = '<div class="preview-wrap"><img src='
assert app_js.count(viejo_img) == 1
app_js = app_js.replace(viejo_img, '<div class="preview-wrap"><img loading="lazy" decoding="async" src=')

# ═════ Mis diseños: JS inyectado DENTRO del scope de la app (usa su maquinaria) ═════
MIS_JS = r'''

/* ═══ IA MASIVA · Mis diseños (guardar personalizaciones, categorías planas) ═══ */
(function imMisDisenos() {
  const IM = window.__IM;
  if (!IM) return;
  const db = IM.sb;
  const $ = (id) => document.getElementById(id);
  const numByUuid = new Map([...IM.uuidByNum].map(([n, u]) => [u, n]));
  const itemDe = (row) => items.find(it => it.catalog_number === numByUuid.get(row.item_id));

  // Textos propios en los 6 idiomas: entran a translations y los sirve t()
  const IM_I18N = {
    es: { misDisenos:'Mis diseños', imVolver:'← Volver a la biblioteca', imGuardar:'Guardar diseño', imGuardarCambios:'Guardar cambios', imOk:'Guardar', imGuardado:'Diseño guardado', imActualizado:'Diseño actualizado', imNombre:'Nombre', imCategoria:'Categoría (opcional)', imSinCat:'— Sin categoría', imNuevaCat:'➕ Nueva categoría…', imNuevaCatNombre:'Nombre de la nueva categoría', imTodas:'Todas', imVacio:'Aún no guardas diseños. Personaliza cualquier estilo y presiona "Guardar diseño".', imCopiar:'Copiar prompt', imCopiado:'¡Copiado!', imEditar:'Editar diseño', imDatos:'Nombre y categoría', imEliminar:'Eliminar', imEliminado:'Diseño eliminado', imCancelar:'Cancelar', imConfTitulo:'¿Eliminar el diseño?', imConfTexto:'Se eliminará definitivamente.', imConfSi:'Sí, eliminar', imNombreVacio:'Ponle un nombre', imNoGuardo:'No se pudo guardar', imNoBorro:'No se pudo eliminar', imNoCargo:'No se pudo cargar tu espacio', imDisenoUno:'diseño', imDisenoMuchos:'diseños', imBase:'Basado en: {name}' },
    en: { misDisenos:'My designs', imVolver:'← Back to the library', imGuardar:'Save design', imGuardarCambios:'Save changes', imOk:'Save', imGuardado:'Design saved', imActualizado:'Design updated', imNombre:'Name', imCategoria:'Category (optional)', imSinCat:'— No category', imNuevaCat:'➕ New category…', imNuevaCatNombre:'New category name', imTodas:'All', imVacio:'No designs saved yet. Customize any style and press "Save design".', imCopiar:'Copy prompt', imCopiado:'Copied!', imEditar:'Edit design', imDatos:'Name & category', imEliminar:'Delete', imEliminado:'Design deleted', imCancelar:'Cancel', imConfTitulo:'Delete this design?', imConfTexto:'It will be permanently deleted.', imConfSi:'Yes, delete', imNombreVacio:'Give it a name', imNoGuardo:'Could not save', imNoBorro:'Could not delete', imNoCargo:'Could not load your space', imDisenoUno:'design', imDisenoMuchos:'designs', imBase:'Based on: {name}' },
    pt: { misDisenos:'Meus designs', imVolver:'← Voltar à biblioteca', imGuardar:'Salvar design', imGuardarCambios:'Salvar alterações', imOk:'Salvar', imGuardado:'Design salvo', imActualizado:'Design atualizado', imNombre:'Nome', imCategoria:'Categoria (opcional)', imSinCat:'— Sem categoria', imNuevaCat:'➕ Nova categoria…', imNuevaCatNombre:'Nome da nova categoria', imTodas:'Todas', imVacio:'Você ainda não salvou designs. Personalize um estilo e pressione "Salvar design".', imCopiar:'Copiar prompt', imCopiado:'Copiado!', imEditar:'Editar design', imDatos:'Nome e categoria', imEliminar:'Excluir', imEliminado:'Design excluído', imCancelar:'Cancelar', imConfTitulo:'Excluir este design?', imConfTexto:'Ele será excluído definitivamente.', imConfSi:'Sim, excluir', imNombreVacio:'Dê um nome a ele', imNoGuardo:'Não foi possível salvar', imNoBorro:'Não foi possível excluir', imNoCargo:'Não foi possível carregar seu espaço', imDisenoUno:'design', imDisenoMuchos:'designs', imBase:'Baseado em: {name}' },
    fr: { misDisenos:'Mes designs', imVolver:'← Retour à la bibliothèque', imGuardar:'Enregistrer le design', imGuardarCambios:'Enregistrer les modifications', imOk:'Enregistrer', imGuardado:'Design enregistré', imActualizado:'Design mis à jour', imNombre:'Nom', imCategoria:'Catégorie (facultatif)', imSinCat:'— Sans catégorie', imNuevaCat:'➕ Nouvelle catégorie…', imNuevaCatNombre:'Nom de la nouvelle catégorie', imTodas:'Toutes', imVacio:'Aucun design enregistré. Personnalisez un style et appuyez sur « Enregistrer le design ».', imCopiar:'Copier le prompt', imCopiado:'Copié !', imEditar:'Modifier le design', imDatos:'Nom et catégorie', imEliminar:'Supprimer', imEliminado:'Design supprimé', imCancelar:'Annuler', imConfTitulo:'Supprimer ce design ?', imConfTexto:'Il sera définitivement supprimé.', imConfSi:'Oui, supprimer', imNombreVacio:'Donnez-lui un nom', imNoGuardo:'Impossible d’enregistrer', imNoBorro:'Impossible de supprimer', imNoCargo:'Impossible de charger votre espace', imDisenoUno:'design', imDisenoMuchos:'designs', imBase:'Basé sur : {name}' },
    de: { misDisenos:'Meine Designs', imVolver:'← Zurück zur Bibliothek', imGuardar:'Design speichern', imGuardarCambios:'Änderungen speichern', imOk:'Speichern', imGuardado:'Design gespeichert', imActualizado:'Design aktualisiert', imNombre:'Name', imCategoria:'Kategorie (optional)', imSinCat:'— Ohne Kategorie', imNuevaCat:'➕ Neue Kategorie…', imNuevaCatNombre:'Name der neuen Kategorie', imTodas:'Alle', imVacio:'Noch keine Designs gespeichert. Passe einen Stil an und drücke „Design speichern“.', imCopiar:'Prompt kopieren', imCopiado:'Kopiert!', imEditar:'Design bearbeiten', imDatos:'Name & Kategorie', imEliminar:'Löschen', imEliminado:'Design gelöscht', imCancelar:'Abbrechen', imConfTitulo:'Dieses Design löschen?', imConfTexto:'Es wird endgültig gelöscht.', imConfSi:'Ja, löschen', imNombreVacio:'Gib ihm einen Namen', imNoGuardo:'Speichern fehlgeschlagen', imNoBorro:'Löschen fehlgeschlagen', imNoCargo:'Dein Bereich konnte nicht geladen werden', imDisenoUno:'Design', imDisenoMuchos:'Designs', imBase:'Basiert auf: {name}' },
    it: { misDisenos:'I miei design', imVolver:'← Torna alla libreria', imGuardar:'Salva design', imGuardarCambios:'Salva modifiche', imOk:'Salva', imGuardado:'Design salvato', imActualizado:'Design aggiornato', imNombre:'Nome', imCategoria:'Categoria (facoltativa)', imSinCat:'— Senza categoria', imNuevaCat:'➕ Nuova categoria…', imNuevaCatNombre:'Nome della nuova categoria', imTodas:'Tutte', imVacio:'Non hai ancora salvato design. Personalizza uno stile e premi "Salva design".', imCopiar:'Copia prompt', imCopiado:'Copiato!', imEditar:'Modifica design', imDatos:'Nome e categoria', imEliminar:'Elimina', imEliminado:'Design eliminato', imCancelar:'Annulla', imConfTitulo:'Eliminare questo design?', imConfTexto:'Verrà eliminato definitivamente.', imConfSi:'Sì, elimina', imNombreVacio:'Dagli un nome', imNoGuardo:'Impossibile salvare', imNoBorro:'Impossibile eliminare', imNoCargo:'Impossibile caricare il tuo spazio', imDisenoUno:'design', imDisenoMuchos:'design', imBase:'Basato su: {name}' },
  };
  for (const [lang, textos] of Object.entries(IM_I18N)) Object.assign(translations[lang] ?? translations.es, textos);

  let misDisenos = [];
  let catActiva = 'ALL';
  let menuMis = null;
  let ctxGuardar = null;   // fila cuando el panel está editando un diseño guardado
  let ctxDatos = null;     // fila cuando el modal edita nombre/categoría
  let toastTimer = null;

  function toast(msg) {
    const el = $('imToast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  async function copiarTexto(texto) {
    try { await navigator.clipboard.writeText(texto); }
    catch (_) {
      const ta = document.createElement('textarea');
      ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      ta.remove();
    }
  }

  async function cargarMis() {
    const { data, error } = await db.from('user_disenos').select('*')
      .eq('product_id', IM.productId).order('created_at', { ascending: false });
    if (error) { toast(t('imNoCargo')); return; }
    misDisenos = data ?? [];
    renderMis();
  }

  const catsPlanas = () => [...new Set(misDisenos.map(d => d.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  function cardMis(d) {
    const it = itemDe(d);
    return `
      <article class="card im-card-mis" data-mid="${d.id}">
        <div class="preview-wrap"><img loading="lazy" decoding="async" src="${escapeHtml(it?.preview ?? '')}" alt="${escapeHtml(d.nombre)}"></div>
        <div class="card-body">
          <button class="im-menu-btn" type="button" data-immenu="${d.id}">⋮</button>
          ${menuMis === d.id ? `
            <div class="im-menu">
              <button type="button" data-imaccion="editar" data-mid="${d.id}">${escapeHtml(t('imEditar'))}</button>
              <button type="button" data-imaccion="datos" data-mid="${d.id}">${escapeHtml(t('imDatos'))}</button>
              <button type="button" data-imaccion="eliminar" data-mid="${d.id}">${escapeHtml(t('imEliminar'))}</button>
            </div>` : ''}
          <div class="badges">${d.categoria ? `<span class="badge">${escapeHtml(d.categoria)}</span>` : ''}</div>
          <h3>${escapeHtml(d.nombre)}</h3>
          <p class="im-base">${it ? escapeHtml(format(t('imBase'), {name: itemName(it)})) : ''}</p>
          <button class="open-prompt" type="button" data-imcopy="${d.id}">${escapeHtml(t('imCopiar'))}</button>
        </div>
      </article>`;
  }

  function renderMis() {
    pintarBotonPanel();
    if ($('im-mis').hidden) return;
    // Sin diseños guardados: solo el mensaje, nada de chips ni contador
    if (!misDisenos.length) {
      $('imMisChips').innerHTML = '';
      $('imMisCount').textContent = '';
      $('imMisGrid').innerHTML = `<div class="empty">${escapeHtml(t('imVacio'))}</div>`;
      return;
    }
    const cats = catsPlanas();
    if (catActiva !== 'ALL' && !cats.includes(catActiva)) catActiva = 'ALL';
    $('imMisChips').innerHTML = ['ALL', ...cats].map(c =>
      `<button class="filter ${c === catActiva ? 'active' : ''}" type="button" data-imchip="${escapeHtml(c)}">${escapeHtml(c === 'ALL' ? t('imTodas') : c)}</button>`).join('');
    const visibles = misDisenos.filter(d => catActiva === 'ALL' || d.categoria === catActiva);
    $('imMisCount').textContent = `${visibles.length} ${visibles.length === 1 ? t('imDisenoUno') : t('imDisenoMuchos')}`;
    $('imMisGrid').innerHTML = visibles.map(cardMis).join('');
  }

  function setVistaMis(v) {
    document.querySelector('.controls-wrap').hidden = v;
    document.querySelector('main > .results-head').hidden = v;
    gallery.hidden = v;
    $('im-mis').hidden = !v;
    $('imMisBtn').classList.toggle('active', v);
    if (v) { catActiva = 'ALL'; menuMis = null; renderMis(); }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // ── Guardar desde el panel (el botón vive junto a "Copiar prompt") ──
  function pintarBotonPanel() {
    $('im-guardar').textContent = t(ctxGuardar ? 'imGuardarCambios' : 'imGuardar');
  }

  const imOpenPanelOrig = openPanel;
  openPanel = function (id) {
    ctxGuardar = null;
    imOpenPanelOrig(id);
    pintarBotonPanel();
  };

  function editarDiseno(d) {
    const it = itemDe(d);
    if (!it) { toast(t('imNoCargo')); return; }
    openPanel(it.id);
    activeValues = { ...defaultValues, ...(d.valores ?? {}) };
    isCustomizing = true;
    customization.hidden = false;
    customizeToggle.setAttribute('aria-expanded', 'true');
    customizeToggle.textContent = t('hideCustomization');
    renderForm();
    updatePrompt();
    ctxGuardar = d;
    pintarBotonPanel();
  }

  $('im-guardar').addEventListener('click', async () => {
    if (!activeItem) return;
    if (ctxGuardar) {
      const { error } = await db.from('user_disenos')
        .update({ valores: { ...activeValues }, contenido: promptOutput.value, updated_at: new Date().toISOString() })
        .eq('id', ctxGuardar.id);
      if (error) { toast(t('imNoGuardo') + ': ' + error.message); return; }
      toast(t('imActualizado'));
      cargarMis();
      return;
    }
    abrirModalGuardar();
  });

  // ── Modal de nombre + categoría plana (crear y editar datos) ──
  function llenarSelCat(sel) {
    const cats = catsPlanas();
    if (sel && !cats.includes(sel)) cats.push(sel);
    $('imMDSelCat').innerHTML = `<option value="">${escapeHtml(t('imSinCat'))}</option>` +
      cats.map(c => `<option value="${escapeHtml(c)}" ${c === sel ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('') +
      `<option value="__nueva__">${escapeHtml(t('imNuevaCat'))}</option>`;
    $('imMDCatNueva').style.display = 'none';
    $('imMDCatNueva').value = '';
    $('imMDCatNueva').placeholder = t('imNuevaCatNombre');
  }

  function prepModalDatos(titulo, nombre, cat) {
    $('imMDTitulo').textContent = titulo;
    $('imMDLblNombre').textContent = t('imNombre');
    $('imMDLblCat').textContent = t('imCategoria');
    $('imMDCancelar').textContent = t('imCancelar');
    $('imMDOk').textContent = t('imOk');
    $('imMDNombre').value = nombre;
    llenarSelCat(cat);
    $('imMD').classList.add('abierto');
    $('imMDNombre').focus();
  }

  // El nombre siempre arranca vacío: lo pone el usuario (regla de la casa)
  function abrirModalGuardar() { ctxDatos = null; prepModalDatos(t('imGuardar'), '', ''); }
  function abrirModalDatos(d) { ctxDatos = d; prepModalDatos(t('imDatos'), d.nombre, d.categoria ?? ''); }

  $('imMDSelCat').addEventListener('change', () => {
    const nueva = $('imMDSelCat').value === '__nueva__';
    $('imMDCatNueva').style.display = nueva ? '' : 'none';
    if (nueva) $('imMDCatNueva').focus();
  });

  $('imMDOk').addEventListener('click', async () => {
    const nombre = $('imMDNombre').value.trim();
    if (!nombre) { toast(t('imNombreVacio')); return; }
    let categoria = $('imMDSelCat').value;
    if (categoria === '__nueva__') {
      categoria = $('imMDCatNueva').value.trim();
      if (!categoria) { toast(t('imNuevaCatNombre')); return; }
    }
    categoria = categoria || null;
    let error;
    if (ctxDatos) {
      ({ error } = await db.from('user_disenos').update({ nombre, categoria, updated_at: new Date().toISOString() }).eq('id', ctxDatos.id));
    } else {
      ({ error } = await db.from('user_disenos').insert({
        user_id: IM.userId, product_id: IM.productId,
        item_id: IM.uuidByNum.get(activeItem.catalog_number),
        nombre, categoria, valores: { ...activeValues }, contenido: promptOutput.value,
      }));
    }
    if (error) { toast(t('imNoGuardo') + ': ' + error.message); return; }
    $('imMD').classList.remove('abierto');
    toast(t(ctxDatos ? 'imActualizado' : 'imGuardado'));
    ctxDatos = null;
    cargarMis();
  });
  $('imMDCancelar').addEventListener('click', () => $('imMD').classList.remove('abierto'));
  $('imMD').addEventListener('click', (e) => { if (e.target.id === 'imMD') e.target.classList.remove('abierto'); });

  // ── Confirmación propia + borrado verificado ──
  let confResolve = null;
  function confirmar() {
    $('imConfTitulo').textContent = t('imConfTitulo');
    $('imConfTexto').textContent = t('imConfTexto');
    $('imConfNo').textContent = t('imCancelar');
    $('imConfSi').textContent = t('imConfSi');
    $('imConf').classList.add('abierto');
    return new Promise((res) => { confResolve = res; });
  }
  function cerrarConfirmar(v) {
    $('imConf').classList.remove('abierto');
    if (confResolve) { confResolve(v); confResolve = null; }
  }
  $('imConfSi').addEventListener('click', () => cerrarConfirmar(true));
  $('imConfNo').addEventListener('click', () => cerrarConfirmar(false));
  $('imConf').addEventListener('click', (e) => { if (e.target.id === 'imConf') cerrarConfirmar(false); });

  async function eliminarDiseno(d) {
    if (!await confirmar()) return;
    const { data, error } = await db.from('user_disenos').delete().eq('id', d.id).select('id');
    if (error || !data?.length) { toast(t('imNoBorro')); return; }
    toast(t('imEliminado'));
    if (ctxGuardar?.id === d.id) { ctxGuardar = null; pintarBotonPanel(); }
    cargarMis();
  }

  // ── Delegación en la vista Mis diseños ──
  $('im-mis').addEventListener('click', async (e) => {
    const chip = e.target.closest('[data-imchip]');
    if (chip) { catActiva = chip.dataset.imchip; menuMis = null; renderMis(); return; }
    const mb = e.target.closest('[data-immenu]');
    if (mb) { menuMis = menuMis === mb.dataset.immenu ? null : mb.dataset.immenu; renderMis(); e.stopPropagation(); return; }
    const acc = e.target.closest('[data-imaccion]');
    if (acc) {
      const d = misDisenos.find(x => x.id === acc.dataset.mid);
      menuMis = null; renderMis();
      if (!d) return;
      if (acc.dataset.imaccion === 'editar') editarDiseno(d);
      if (acc.dataset.imaccion === 'datos') abrirModalDatos(d);
      if (acc.dataset.imaccion === 'eliminar') eliminarDiseno(d);
      return;
    }
    const cp = e.target.closest('[data-imcopy]');
    if (cp) {
      const d = misDisenos.find(x => x.id === cp.dataset.imcopy);
      if (!d) return;
      await copiarTexto(d.contenido);
      cp.textContent = t('imCopiado');
      setTimeout(() => renderMis(), 1600);
    }
  });
  document.addEventListener('click', (e) => {
    if (menuMis && !e.target.closest('.im-menu') && !e.target.closest('.im-menu-btn')) { menuMis = null; renderMis(); }
  });

  $('imMisBtn').addEventListener('click', () => setVistaMis($('im-mis').hidden));
  $('imMisVolver').addEventListener('click', () => setVistaMis(false));

  // El cambio de idioma también refresca lo nuestro
  const imSetUiLangOrig = setUiLanguage;
  setUiLanguage = function (code) {
    imSetUiLangOrig(code);
    pintarBotonPanel();
    renderMis();
  };

  setUiLanguage(uiLanguage);
  cargarMis();
})();
'''

app_js = (app_js + MIS_JS).replace('</script', '<\\/script')


def rep(viejo, nuevo, n=1):
    global template
    assert template.count(viejo) == n, f'ancla no única ({template.count(viejo)}): {viejo[:70]!r}'
    template = template.replace(viejo, nuevo)


rep('<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta name="robots" content="noindex, nofollow">')
rep('<title>Presenta - Biblioteca de estilos para NotebookLM</title>',
    '<title>200 Diseños para Presentaciones — IA MASIVA</title>')

rep('    @media (max-width: 620px) {',
'''    .im-oculto { display: none !important; }
    [hidden] { display: none !important; }
    .im-gate { position: fixed; inset: 0; z-index: 9999; background: var(--paper); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; gap: 14px; }
    .im-gate h1 { font-size: 1.5rem; color: var(--ink); margin: 0; letter-spacing: -.02em; }
    .im-gate p { color: var(--muted); max-width: 480px; line-height: 1.6; margin: 0; }
    .im-gate .im-btn { background: var(--accent); color: #fff; border: none; border-radius: 10px; padding: 13px 30px; font-weight: 800; font-size: 0.95rem; cursor: pointer; }
    .im-gate .im-btn:hover { background: var(--accent-dark); }
    .im-gate a { color: var(--accent-dark); font-weight: 700; }
    .im-mis-btn { padding: 7px 12px; border: 1px solid rgba(255,255,255,.35); border-radius: 999px; background: transparent; color: #d8deea; font-size: 12px; font-weight: 800; }
    .im-mis-btn:hover, .im-mis-btn.active { background: var(--accent); border-color: var(--accent); color: white; }
    .im-volver { margin-bottom: 18px; padding: 9px 14px; border: 1px solid var(--line); border-radius: 10px; background: white; color: var(--ink); font-size: 13px; font-weight: 700; }
    .im-volver:hover { border-color: var(--navy); }
    .im-card-mis .card-body { position: relative; }
    .im-card-mis .badges { margin-right: 30px; }
    .im-card-mis h3 { min-height: 0; }
    .im-base { margin: -8px 0 14px; color: var(--muted); font-size: 12px; min-height: 16px; }
    .im-menu-btn { position: absolute; top: 12px; right: 10px; background: none; border: none; font-size: 1.15rem; line-height: 1; color: var(--muted); padding: 4px 8px; border-radius: 8px; }
    .im-menu-btn:hover { background: #f0ede7; color: var(--ink); }
    .im-menu { position: absolute; top: 42px; right: 10px; z-index: 5; background: white; border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 10px 30px rgba(20,33,61,.16); min-width: 180px; overflow: hidden; }
    .im-menu button { display: block; width: 100%; text-align: left; background: none; border: none; padding: 10px 14px; font-size: 13px; color: var(--ink); }
    .im-menu button:hover { background: #f5f3ef; }
    .im-modal { position: fixed; inset: 0; z-index: 40; display: none; align-items: center; justify-content: center; background: rgba(10,18,38,.55); padding: 20px; }
    .im-modal.abierto { display: flex; }
    .im-modal-caja { width: min(440px, 100%); background: white; border-radius: 16px; padding: 22px; box-shadow: var(--shadow); }
    .im-modal-caja h3 { margin: 0; font-size: 20px; letter-spacing: -.02em; }
    .im-modal-label { display: block; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 16px 0 7px; }
    .im-modal-caja input, .im-modal-caja select { width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: 11px 12px; background: white; color: var(--ink); outline: none; }
    .im-modal-texto { color: var(--muted); line-height: 1.6; margin: 12px 0 0; }
    .im-modal-acciones { display: flex; gap: 10px; margin-top: 20px; }
    #imToast { position: fixed; left: 50%; bottom: 26px; transform: translate(-50%, 12px); z-index: 60; background: var(--navy); color: white; padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: 14px; opacity: 0; transition: .2s ease; pointer-events: none; max-width: min(90vw, 480px); }
    #imToast.show { opacity: 1; transform: translate(-50%, 0); }
    @media (max-width: 620px) {''')

rep('''<body>
  <header class="masthead">''',
'''<body>
  <div class="im-gate" id="imCargando"><p>Cargando tu recurso…</p></div>
  <div class="im-gate im-oculto" id="imSinAcceso">
    <h1>200 Diseños para Presentaciones en NotebookLM</h1>
    <p>Este es un recurso premium de IA MASIVA: 200 estilos visuales con vista previa real, personalizables en colores, tipografías y estilo, con el prompt listo para copiar en NotebookLM.</p>
    <button class="im-btn" id="imBtnComprar">Comprar ahora</button>
    <p id="imMsjCompra" class="im-oculto"></p>
    <a href="app.html">← Volver a IA MASIVA</a>
  </div>

  <header class="masthead">''')

# Botón "Mis diseños" en la barra superior
rep('''      <div class="nav-actions">
        <label class="interface-language">''',
'''      <div class="nav-actions">
        <button class="im-mis-btn" id="imMisBtn" type="button" data-i18n="misDisenos">Mis diseños</button>
        <label class="interface-language">''')

# Vista Mis diseños dentro de <main>
rep('''    <section class="grid" id="gallery" aria-live="polite"></section>
  </main>''',
'''    <section class="grid" id="gallery" aria-live="polite"></section>

    <section id="im-mis" hidden>
      <button class="im-volver" id="imMisVolver" type="button" data-i18n="imVolver">← Volver a la biblioteca</button>
      <div class="results-head"><h2 data-i18n="misDisenos">Mis diseños</h2><span class="result-count" id="imMisCount"></span></div>
      <div class="filters" id="imMisChips" style="margin-bottom:20px;"></div>
      <section class="grid" id="imMisGrid"></section>
    </section>
  </main>''')

# Botón "Guardar diseño" junto a Copiar prompt en el panel
rep('''      <div class="actions">
        <button class="action copy" id="copy" data-i18n="copy">Copiar prompt</button>
      </div>''',
'''      <div class="actions">
        <button class="action reset" id="im-guardar" type="button">Guardar diseño</button>
        <button class="action copy" id="copy" data-i18n="copy">Copiar prompt</button>
      </div>''')

# Modales y toast de Mis diseños
rep('''  <script id="presentation-data" type="application/json">__PRESENTATION_DATA__</script>''',
'''  <!-- IA MASIVA · Mis diseños -->
  <div class="im-modal" id="imMD">
    <div class="im-modal-caja">
      <h3 id="imMDTitulo"></h3>
      <label class="im-modal-label" id="imMDLblNombre"></label>
      <input id="imMDNombre" type="text">
      <label class="im-modal-label" id="imMDLblCat"></label>
      <select id="imMDSelCat"></select>
      <input id="imMDCatNueva" type="text" style="display:none; margin-top:8px;">
      <div class="im-modal-acciones">
        <button class="action reset" id="imMDCancelar" type="button"></button>
        <button class="action copy" id="imMDOk" type="button"></button>
      </div>
    </div>
  </div>
  <div class="im-modal" id="imConf">
    <div class="im-modal-caja">
      <h3 id="imConfTitulo"></h3>
      <p class="im-modal-texto" id="imConfTexto"></p>
      <div class="im-modal-acciones">
        <button class="action reset" id="imConfNo" type="button"></button>
        <button class="action copy" id="imConfSi" type="button"></button>
      </div>
    </div>
  </div>
  <div id="imToast"></div>

  <script id="presentation-data" type="application/json">__PRESENTATION_DATA__</script>''')

rep('__PRESENTATION_DATA__', '[]')

bootstrap = '''  <script>
  function __initApp() {
''' + app_js + '''
  }
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script>
  (async () => {
    const { createClient } = supabase;
    const sb = createClient(
      '__SUPABASE_URL__',
      '__ANON_KEY__'
    );
    const PRODUCT_ID = '__PRODUCT_ID__';
    const PREVIEWS_BASE = '__PREVIEWS_BASE__';

    document.getElementById('imBtnComprar').addEventListener('click', async () => {
      const msj = document.getElementById('imMsjCompra');
      try {
        const { data: { session } } = await sb.auth.getSession();
        const res = await fetch(`/api/checkout?product=${PRODUCT_ID}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const body = await res.json();
        if (!res.ok) { msj.textContent = body.error || 'Muy pronto disponible.'; msj.classList.remove('im-oculto'); return; }
        sessionStorage.setItem('compra_ref', body.reference);
        window.location.href = body.url;
      } catch { msj.textContent = 'Muy pronto disponible.'; msj.classList.remove('im-oculto'); }
    });

    const { data: { session } } = await sb.auth.getSession();
    if (!session) { window.location.href = 'index.html'; return; }

    // El RLS es el candado: sin compra aprobada (o admin) no llegan filas.
    const { data, error } = await sb.from('premium_items').select('item_num, id, data')
      .eq('product_id', PRODUCT_ID).order('item_num').range(0, 249);
    const filas = error ? [] : (data ?? []);

    if (!filas.length) {
      document.getElementById('imCargando').classList.add('im-oculto');
      document.getElementById('imSinAcceso').classList.remove('im-oculto');
      return;
    }

    const disenos = filas.map(f => {
      const d = f.data;
      d.preview = PREVIEWS_BASE + String(d.preview || '').split('/').pop();
      return d;
    });
    // textContent vía DOM es inerte: no re-parsea HTML, no hay riesgo de romper el tag
    document.getElementById('presentation-data').textContent = JSON.stringify(disenos);
    window.__IM = {
      sb,
      userId: session.user.id,
      productId: PRODUCT_ID,
      uuidByNum: new Map(filas.map(f => [f.item_num, f.id])),
    };

    document.getElementById('imCargando').classList.add('im-oculto');
    __initApp();
  })();
  </script>'''

bootstrap = (bootstrap
             .replace('__SUPABASE_URL__', SUPABASE_URL)
             .replace('__ANON_KEY__', ANON_KEY)
             .replace('__PRODUCT_ID__', PRODUCT_ID)
             .replace('__PREVIEWS_BASE__', PREVIEWS_BASE))

rep('  <script>__APP_SCRIPT__</script>', bootstrap)

open(OUT, 'w').write(template)
print(f'{OUT} generado: {len(template)} bytes')
