---
name: ll-revisar-publicacion
description: Revisa leadership-lab antes de abrirlo al público (GitHub): material de terceros versionado, tema fuera de git, secretos, licencia, créditos y texto oculto. Usar cuando Luis pide "revisá antes de publicar el repo", "¿puedo subirlo a GitHub?" o antes de un primer push.
---

# ll-revisar-publicacion

Solo lee y reporta; no borra ni reescribe historia sin que Luis lo pida.

1. **Qué va a subir**: `git ls-files` (o `git status`) y buscar binarios/medios: `git ls-files | grep -Ei '\.(png|jpe?g|gif|svg|mp3|wav|m4a|pdf|zip|pptx?)$'`.
2. **Material de terceros**: cruzar con `NOTICE.md` — logos de marcas, audios y PDF del taller (`apps/team-canvas/public/`), ilustraciones de `apps/openspace/public/img/` (créditos en `CREDITOS.md`). Listar cada uno como: propio / con permiso / sin confirmar.
3. **Tema fuera de git**: `apps/shell/skin/temas/` solo debe tener `default` versionado; `git check-ignore -v apps/shell/skin/temas/leadership-lab/tema.css` y `dist/` deben dar match.
4. **Secretos**: `.env` ignorado (solo `.env.example`), nada con claves en `git ls-files`, `config/environments.json` solo con ids (no secretos) y sin claves reales; buscar `ADMIN_KEY`, `token`, `secret` en lo versionado.
5. **Licencia y créditos**: `LICENSE` MIT con titular, `"license": "MIT"` en `package.json`, crédito Tewa & Luis Mulato presente en `apps/shell/index.html`.
6. **Historial**: ver `git log` — si ya hubo commits con material de terceros, avisar que sacar archivos del índice no los borra del historial (opciones: repo nuevo o reescribir).
7. **Texto oculto / prompt injection** en `CLAUDE.md`, `.claude/`, `*.md`: usar la skill `detect-hidden-prompts` o `audit-repo-agents`.
8. Entregar una tabla corta: ✔ listo / ⚠ revisar / ✖ bloquea, con la acción concreta de cada ítem.
