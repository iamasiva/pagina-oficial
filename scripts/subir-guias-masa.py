# Carga masiva de guías gratuitas desde "Guías con Portada".
# Cada carpeta trae: guia-rediseno.html (la versión a subir), portada.png,
# descripcion.md y categorias.md (## Herramientas / ## Áreas, con "(nueva)").
# Sube portada optimizada (700px JPG) a 'portadas', el HTML a 'contenido',
# crea las categorías que falten y las filas en guides. El ORDEN de subida
# importa: el sitio muestra las más recientes primero, así que se sube de
# menor a mayor valor (RANKING de abajo hacia arriba).
import json, os, re, subprocess, sys, time, unicodedata, urllib.request

BASE = "/Users/sergiolizcano/Desktop/PROYECTOS/PAGINA_OFICIAL_IAMASIVA/Guías con Portada"
SUPA = "https://iyiygnfaxiejtlgkkivs.supabase.co"
CRED = "/Users/sergiolizcano/Desktop/PROYECTOS/PAGINA_OFICIAL_IAMASIVA/credenciales_privadas.txt"
KEY = next(l.split(':', 1)[1].strip() for l in open(CRED) if l.startswith('Service role key:'))

# Ranking 1 = mayor valor (quedará de primera). Números = prefijo de carpeta.
RANKING = [1, 3, 47, 2, 7, 5, 4, 8, 6, 10, 36, 19, 31, 29, 28, 45, 15, 9, 26, 40,
           41, 42, 16, 34, 18, 11, 38, 37, 39, 43, 25, 35, 30, 13, 12, 17, 27, 14,
           21, 22, 20, 23, 24, 46, 32, 33, 44]

def api(metodo, ruta, cuerpo=None, tipo='application/json', crudo=False):
    req = urllib.request.Request(SUPA + ruta, method=metodo)
    req.add_header('apikey', KEY)
    req.add_header('Authorization', 'Bearer ' + KEY)
    if cuerpo is not None:
        req.add_header('Content-Type', tipo)
        if not crudo:
            req.add_header('Prefer', 'return=representation')
            cuerpo = json.dumps(cuerpo, ensure_ascii=False).encode()
    with urllib.request.urlopen(req, cuerpo) as r:
        d = r.read()
        return json.loads(d) if d else None

def norm(s):
    s = unicodedata.normalize('NFC', s.strip())
    return s.lower()

def slug(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return s[:60]

# ── 1. catálogo de carpetas por número ──
carpetas = {}
for d in sorted(os.listdir(BASE)):
    m = re.match(r'^(\d+)\s*-\s*(.+)$', d)
    if m and os.path.isdir(os.path.join(BASE, d)):
        carpetas[int(m.group(1))] = (d, m.group(2).strip())
faltan = [n for n in RANKING if n not in carpetas]
assert not faltan, f'carpetas faltantes: {faltan}'
assert len(RANKING) == len(carpetas) == 47, (len(RANKING), len(carpetas))
assert len(set(RANKING)) == 47

# ── 2. categorías: crear las que falten ──
existentes = api('GET', '/rest/v1/categorias?select=nombre,tipo')
canon = {norm(c['nombre']): c['nombre'] for c in existentes}

def cats_de(carpeta):
    md = open(os.path.join(BASE, carpeta, 'categorias.md'), encoding='utf-8').read()
    res, seccion = [], None
    for linea in md.splitlines():
        l = linea.strip()
        if l.startswith('## '):
            seccion = 'herramienta' if 'herramienta' in l.lower() else 'area'
        elif l.startswith('- ') and seccion:
            nombre = re.sub(r'\s*\(nueva\)\s*', '', l[2:]).strip()
            if nombre:
                res.append((nombre, seccion))
    return res

pendientes = {}
for n in RANKING:
    for nombre, tipo in cats_de(carpetas[n][0]):
        if norm(nombre) not in canon:
            pendientes[norm(nombre)] = (nombre, tipo)
for _, (nombre, tipo) in sorted(pendientes.items()):
    api('POST', '/rest/v1/categorias', {'nombre': nombre, 'tipo': tipo})
    canon[norm(nombre)] = nombre
    print(f'categoría creada: {tipo}: {nombre}')

# ── 3. subir en orden inverso al ranking (la mejor de última) ──
TMP = '/tmp/portada-optimizada.jpg'
subidas = []
for pos, n in enumerate(reversed(RANKING)):
    carpeta, titulo = carpetas[n]
    ruta = os.path.join(BASE, carpeta)
    s = slug(titulo)
    ts = int(time.time() * 1000)

    # portada: 700px de ancho, JPG q82
    subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82',
                    '--resampleWidth', '700', os.path.join(ruta, 'portada.png'),
                    '--out', TMP], check=True, capture_output=True)
    nombre_port = f'{ts}_{s}.jpg'
    api('POST', f'/storage/v1/object/portadas/{nombre_port}',
        open(TMP, 'rb').read(), tipo='image/jpeg', crudo=True)
    portada_url = f'{SUPA}/storage/v1/object/public/portadas/{nombre_port}'

    # html rediseñado
    nombre_html = f'{ts}_{s}.html'
    api('POST', f'/storage/v1/object/contenido/{nombre_html}',
        open(os.path.join(ruta, 'guia-rediseno.html'), 'rb').read(),
        tipo='text/html; charset=utf-8', crudo=True)
    contenido_url = f'{SUPA}/storage/v1/object/public/contenido/{nombre_html}'

    descripcion = open(os.path.join(ruta, 'descripcion.md'), encoding='utf-8').read().strip()
    categorias = [canon[norm(nom)] for nom, _ in cats_de(carpeta)]

    fila = api('POST', '/rest/v1/guides', {
        'titulo': titulo,
        'descripcion': descripcion,
        'categorias': categorias,
        'precio': 0,
        'es_gratis': True,
        'es_premium': False,
        'publicada': True,
        'portada_url': portada_url,
        'contenido_url': contenido_url,
    })
    subidas.append((n, titulo))
    print(f'[{pos+1:2}/47] #{n:02} {titulo[:60]}')

print('\nSubidas:', len(subidas))
