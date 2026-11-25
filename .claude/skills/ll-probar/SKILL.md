---
name: ll-probar
description: Corre las pruebas de leadership-lab y explica qué falló. Dos niveles: rápido (estructura, esquema y shell, sin servidor) y completo (API de las 5 apps + navegador). Usar cuando Luis pide "corré los tests", "probá", "¿está todo verde?" o antes de cerrar una tarjeta o publicar.
---

# ll-probar

Desde la raíz del proyecto (`projects/leadership-lab`).

1. **Rápido** (segundos, sin servidor): `make test-unit`. Úsalo después de cada cambio chico.
2. **Completo**: `make test`. Levanta el ambiente `test` (puerto 8190, base vacía), corre API de las 5 apps y Playwright con Chrome del sistema, y lo baja al terminar. Tarda más: correrlo en segundo plano si hace falta.
3. Si falla, leer la sección que falló (`== Layout…`, `== Shell`, `== API: <app>`, `== Browser: <app>`), abrir el test y la causa; no tocar el test para que pase sin entender por qué.
4. Fallas conocidas: `tests/site/docs-html.test.mjs` falla si cambió un `.md` sin correr `make docs` (usar `ll-docs`); `tests/site/repo-layout.test.mjs` falla si una app tiene rutas sin el prefijo `/<app>/`.

Reportar fiel: qué pasó, cuántos tests, y si algo se saltó. Si el puerto 8190 está ocupado: `make down ENV=test`.
