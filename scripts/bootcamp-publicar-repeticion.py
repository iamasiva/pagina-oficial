#!/usr/bin/env python3
"""Publica la repetición de una clase del bootcamp.

Guarda el enlace de YouTube (no listado) en bootcamp_clases.grabacion_url y pasa la clase a
`evergreen_ready`. Antes comprueba que YouTube ya sirve el video (si está privado o todavía no
existe, no toca nada). La tarjeta del área del bootcamp y la página de la clase lo muestran al
instante: no hay despliegue, es un cambio en la base de datos (Supabase).

Uso:
  python3 scripts/bootcamp-publicar-repeticion.py <numero> [url de YouTube] [--hotmart <url>] [--probar]

  Si no se pasa la url, se lee de trabajo/bootcamp-repeticiones.json ({"2": "https://youtu.be/..."}),
  un archivo local que no va al repo. Así el enlace no hay que decirlo ni escribirlo en pantalla:
  el script nunca lo imprime, solo el título del video.

  --hotmart  guarda también el enlace de la lección en Hotmart Club (opcional, puede ir después)
  --probar   solo comprueba YouTube y muestra la fila actual, sin cambiar nada

La clave de servicio se lee de SUPABASE_SERVICE_KEY o de ~/.config/iamasiva/supabase.env.
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

PRODUCTO = "6c01d354-e05d-47be-a6d6-3075abcc16d3"
ENV = os.path.expanduser("~/.config/iamasiva/supabase.env")
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENLACES = os.path.join(RAIZ, "trabajo", "bootcamp-repeticiones.json")


def enlace_guardado(numero):
    """Enlace de la clase en el archivo local (fuera del repo), para no escribirlo en pantalla."""
    if not os.path.exists(ENLACES):
        sys.exit(f"No me diste la url y no existe {ENLACES}")
    datos = json.load(open(ENLACES))
    url = datos.get(str(numero))
    if not url:
        sys.exit(f"No hay enlace guardado para la clase {numero} en {ENLACES}")
    return url


def credenciales():
    if not os.environ.get("SUPABASE_SERVICE_KEY") and os.path.exists(ENV):
        for linea in open(ENV):
            linea = linea.strip()
            if linea and not linea.startswith("#") and "=" in linea:
                k, v = linea.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    url = os.environ.get("SUPABASE_URL", "https://api.iamasiva.co")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        sys.exit(f"Falta la clave de servicio: define SUPABASE_SERVICE_KEY o créala en {ENV}")
    return url.rstrip("/"), key


def youtube_id(url):
    m = re.search(r"(?:youtu\.be/|youtube\.com/(?:watch\?(?:.*&)?v=|live/|shorts/|embed/))([A-Za-z0-9_-]{11})", url)
    if not m:
        sys.exit(f"No reconozco esa dirección de YouTube: {url}")
    return m.group(1)


def youtube_listo(vid):
    """YouTube responde al oEmbed solo si el video existe y no es privado."""
    q = urllib.parse.urlencode({"url": f"https://youtu.be/{vid}", "format": "json"})
    try:
        with urllib.request.urlopen(f"https://www.youtube.com/oembed?{q}", timeout=15) as r:
            return json.load(r).get("title", "")
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            sys.exit("YouTube dice que el video es privado: ponlo como No listado y vuelve a intentar")
        if e.code == 404:
            sys.exit("YouTube no encuentra ese video todavía: revisa el enlace o espera a que termine de subirse")
        raise


def rest(base, key, metodo, ruta, cuerpo=None):
    req = urllib.request.Request(f"{base}/rest/v1/{ruta}", method=metodo,
                                 data=json.dumps(cuerpo).encode() if cuerpo is not None else None)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("numero", type=int, choices=[1, 2, 3])
    ap.add_argument("url", nargs="?", default=None)
    ap.add_argument("--hotmart", default=None)
    ap.add_argument("--probar", action="store_true")
    a = ap.parse_args()

    base, key = credenciales()
    vid = youtube_id(a.url or enlace_guardado(a.numero))
    enlace = f"https://youtu.be/{vid}"
    titulo = youtube_listo(vid)
    print(f"YouTube OK: «{titulo}»")

    filtro = f"bootcamp_clases?product_id=eq.{PRODUCTO}&numero=eq.{a.numero}"
    campos = "select=numero,titulo,estado,grabacion_url,hotmart_lesson_url"
    antes = rest(base, key, "GET", f"{filtro}&{campos}")
    if not antes:
        sys.exit(f"No existe la clase {a.numero} del bootcamp")
    print(f"Antes:   clase {antes[0]['numero']} · {antes[0]['titulo']} · {antes[0]['estado']} · "
          f"{'con grabación' if antes[0]['grabacion_url'] else 'sin grabación'}")
    if a.probar:
        print("Modo prueba: no se cambió nada")
        return

    cambios = {"grabacion_url": enlace, "estado": "evergreen_ready", "actualizado_en": "now()"}
    if a.hotmart:
        cambios["hotmart_lesson_url"] = a.hotmart
    despues = rest(base, key, "PATCH", filtro, cambios)
    d = despues[0]
    print(f"Después: clase {d['numero']} · {d['titulo']} · {d['estado']} · repetición guardada")
    print(f"Listo. Se ve ya en https://iamasiva.co/bootcamp-clase.html?n={a.numero} y en la tarjeta de https://iamasiva.co/recurso-bootcamp.html")


if __name__ == "__main__":
    main()
