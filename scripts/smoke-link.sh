#!/bin/bash
# Prueba de pantalla: abre BASE/#CODIGO en Chrome sin interfaz y verifica que el canvas se abra.
# Cubre el bug del admin "Abrir" (go() reescribía el hash a #armar y la app pedía el canvas ARMAR).
# Uso: ./smoke-link.sh <url-base> <id-de-la-vista-que-debe-quedar-visible> [codigo=ACME01]
set -uo pipefail
BASE="${1:?Falta la url base}"; VIEW="${2:?Falta el id de la vista}"; CODE="${3:-ACME01}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "smoke-link: no encuentro Chrome ($CHROME). Definí CHROME=..." >&2; exit 2; }
DIR="$(mktemp -d)"; trap 'rm -rf "$DIR"' EXIT
"$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$DIR" --virtual-time-budget=10000 --dump-dom "${BASE%/}/#$CODE" >"$DIR/dom.html" 2>/dev/null
python3 -I - "$DIR/dom.html" "$VIEW" "$CODE" "$BASE" <<'PY'
import re, sys
dom = open(sys.argv[1], encoding="utf8").read(); view, code, base = sys.argv[2:5]
fails = []
if len(dom) < 500: fails.append("Chrome no devolvió la página")
m = re.search(r'<[^>]*id="b-err"[^>]*>([^<]*)<', dom)
if m and m.group(1).strip(): fails.append("la pantalla muestra un error: " + m.group(1).strip())
t = re.search(r'<[^>]*\bid="%s"[^>]*>' % re.escape(view), dom)
if not t: fails.append("no existe la vista " + view)
elif re.search(r'\bhidden\b', t.group(0)): fails.append("la vista %s sigue oculta: el link /#%s no abrió el canvas" % (view, code))
if fails:
    print("✖ smoke-link " + base.rstrip("/") + "/#" + code)
    for f in fails: print("   - " + f)
    sys.exit(1)
print("✔ smoke-link " + base.rstrip("/") + "/#" + code)
PY
