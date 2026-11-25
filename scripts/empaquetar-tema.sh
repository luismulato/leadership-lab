#!/usr/bin/env bash
# Empaqueta un tema de apps/shell/skin/temas/<id>/ en dist/tema-<id>.zip para entregarlo aparte (no va a git).
#   scripts/empaquetar-tema.sh <id>        e.g. leadership-lab
# El zip lleva la ruta completa desde la raíz del repo (se descomprime en la raíz del clon) y un LEEME-tema-<id>.md.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
ID="${1:-}"; [[ "$ID" =~ ^[a-z0-9-]+$ ]] || { echo "Uso: $0 <id-del-tema>" >&2; exit 2; }
[ "$ID" != default ] || { echo "'default' ya va versionado en el repo: no se empaqueta." >&2; exit 2; }
T="apps/shell/skin/temas/$ID"
[ -f "$T/tema.json" ] && [ -f "$T/tema.css" ] || { echo "Falta $T/tema.json o $T/tema.css" >&2; exit 1; }
NOMBRE="$(python3 -I -c 'import json,sys; print(json.load(open(sys.argv[1])).get("nombre") or sys.argv[2])' "$T/tema.json" "$ID")"
S="$(mktemp -d)"; trap 'rm -rf "$S"' EXIT
mkdir -p "$S/apps/shell/skin/temas"; cp -R "$T" "$S/apps/shell/skin/temas/"
cat > "$S/LEEME-tema-$ID.md" <<EOF
# Tema "$NOMBRE" — instrucciones

Este .zip es el aspecto visual (colores, logos e imágenes) del shell de leadership-lab.
El código está en el repositorio; el tema se entrega aparte y no se sube a GitHub.

## Cómo aplicarlo (3 pasos)
1. Clonar el repo y entrar a la carpeta: \`git clone <URL-del-repo>\`
2. Copiar este .zip **dentro de esa carpeta** (la raíz del repo, donde está el \`README.md\`) y descomprimirlo ahí
   (doble clic / "Extraer aquí", o \`unzip tema-$ID.zip\`). No elegir otra carpeta de destino: los archivos ya traen su ruta.
3. Levantar el shell con \`make dev\` (o desplegar con \`make deploy ENV=<ambiente>\`) y activar el tema
   **$NOMBRE** en \`/app-admin/\` (Shell).

No hay que editar ninguna lista: al levantar o desplegar, el build detecta solo los temas instalados.
Sin el tema, el shell usa el tema \`default\` (neutro).

## Qué instala
- \`apps/shell/skin/temas/$ID/\` — \`tema.css\`, \`tema.json\` e \`img/\`

## Notas
- Esa carpeta está en el \`.gitignore\` del repo: no se versiona ni se sube por error.
- Se pueden instalar varios temas: cada uno trae su carpeta y no se pisan entre sí.
- Una vez aplicado el tema, este archivo se puede borrar.
- Los logos y marcas pertenecen a sus titulares; usarlos solo con su autorización.
- Cubre solo el tema. El material de las apps (audios, PDF, ilustraciones) se indica aparte en \`NOTICE.md\`.
EOF
mkdir -p dist; rm -f "dist/tema-$ID.zip"
(cd "$S" && zip -rq "$OLDPWD/dist/tema-$ID.zip" . -x '*.DS_Store')
unzip -l "dist/tema-$ID.zip"
