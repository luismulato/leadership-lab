---
name: ll-docs
description: Actualiza la documentación de leadership-lab (docs/*.md y README) y regenera la versión HTML amigable docs/html/ con make docs. Usar cuando Luis pide actualizar/documentar algo del proyecto o cuando cambió un .md y falla la prueba docs-html.
---

# ll-docs

Los `.md` son la única fuente de verdad; `docs/html/` se genera, nunca se edita a mano.

1. Editar el `.md` correspondiente (`docs/stack-tecnologico.md`, `arquitectura.md`, `ambientes.md`, `base-de-datos.md`, `desarrollo.md`, `pruebas.md`, `despliegue.md`, o el `README.md`). Todo en español.
2. Links entre documentos con el nombre del `.md` (`desarrollo.md`): el generador los convierte a `.html` y la prueba falla si queda uno roto.
3. `make docs` (script `scripts/build-docs.mjs`, usa `marked`; los diagramas mermaid se dibujan con CDN).
4. `make test-unit`: `tests/site/docs-html.test.mjs` falla si el HTML quedó desactualizado.
5. Si el cambio es un hecho (versión, app nueva, ruta), revisar que `README.md` y `docs/stack-tecnologico.md` no se contradigan.

No documentar lo que ya dice el código. No editar `NOTICE.md` por acá: eso es de `ll-revisar-publicacion`.
