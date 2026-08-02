#!/usr/bin/env python3
"""Ensambla recurso-200.html desde la fuente del producto "200 diseños".

Regla de oro (CONTEXTO del producto): la UI del producto NO se toca — la página
fiel se genera desde app/index.template.html + app/app.js tal cual, y solo se
inyecta: noindex, título, portón de acceso y el bootstrap de Supabase (RLS como
candado). Único parche técnico: loading="lazy" en las imágenes de la galería
(las 200 previews viven en Storage; sin lazy se descargarían todas de una).

Uso:  python3 scripts/generar-recurso-200.py
"""

SRC = '/Users/sergiolizcano/Desktop/PROYECTOS/PROYECTOS IA MASIVA/VERSIONES FINALES RECURSOS/200 diseños para presentaciones'
OUT = 'recurso-200.html'
PRODUCT_ID = '2c296299-d9a4-4409-bc99-67b4999e47f8'
SUPABASE_URL = 'https://iyiygnfaxiejtlgkkivs.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5aXlnbmZheGllanRsZ2traXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTU2ODksImV4cCI6MjA5MjA5MTY4OX0.jfDgQK31XdmY4yd0hMjEgu6b408mGuUSld2-njAujQc'
PREVIEWS_BASE = f'{SUPABASE_URL}/storage/v1/object/public/previews-200/'

template = open(f'{SRC}/app/index.template.html').read()
app_js = open(f'{SRC}/app/app.js').read().replace('</script', '<\\/script')

# Parche de performance (no cambia el diseño): la galería carga perezoso.
viejo_img = '<div class="preview-wrap"><img src='
assert app_js.count(viejo_img) == 1
app_js = app_js.replace(viejo_img, '<div class="preview-wrap"><img loading="lazy" decoding="async" src=')


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
    .im-gate { position: fixed; inset: 0; z-index: 9999; background: var(--paper); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; gap: 14px; }
    .im-gate h1 { font-size: 1.5rem; color: var(--ink); margin: 0; letter-spacing: -.02em; }
    .im-gate p { color: var(--muted); max-width: 480px; line-height: 1.6; margin: 0; }
    .im-gate .im-btn { background: var(--accent); color: #fff; border: none; border-radius: 10px; padding: 13px 30px; font-weight: 800; font-size: 0.95rem; cursor: pointer; }
    .im-gate .im-btn:hover { background: var(--accent-dark); }
    .im-gate a { color: var(--accent-dark); font-weight: 700; }
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
