---
name: ll-tema-zip
description: Empaqueta un tema (skin con logos de terceros) de leadership-lab en dist/tema-<id>.zip, con ruta completa y LEEME, para entregarlo al cliente aparte del repo. Usar cuando Luis pide "armá el zip del tema", "pasale el skin al cliente" o cambió algo en apps/shell/skin/temas/<id>/.
---

# ll-tema-zip

Modelo: el tema **vive en el proyecto pero no va a GitHub**. Solo `temas/default/` se versiona; el resto está en el `.gitignore` (`apps/shell/skin/temas/*/`). Al cliente se le pasa la URL del repo y el zip.

1. Confirmar el `<id>` (carpeta en `apps/shell/skin/temas/`) y que tenga `tema.json` (con `nombre`, `logo`, `sponsors`) y `tema.css`.
2. `scripts/empaquetar-tema.sh <id>` → `dist/tema-<id>.zip` con la ruta completa `apps/shell/skin/temas/<id>/…` y `LEEME-tema-<id>.md` en la raíz del zip. Se descomprime en la **raíz del clon**.
3. No hace falta registrar el tema en ningún JSON: `scripts/build.py` arma `instalados.json` del build a partir de `temas/*/tema.json` al correr `make dev` / `make deploy`.
4. El crédito "Design with love ❤️ by Tewa & Luis Mulato" no va en el tema: está en `apps/shell/index.html` y `skin/base.css` lo blinda.
5. Verificar en un clon limpio si Luis lo pide: copiar el repo sin el tema, descomprimir el zip en su raíz, `make build` y ver `build/dev/public/skin/temas/instalados.json`.

Entregar el zip por mail o Drive; los logos son marcas de terceros: avisar que se usan con autorización de sus titulares.
