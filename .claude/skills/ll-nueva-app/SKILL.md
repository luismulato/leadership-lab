---
name: ll-nueva-app
description: Agrega una app nueva a leadership-lab siguiendo la receta de docs/desarrollo.md (carpeta en apps/, rutas con prefijo, migración con prefijo, entrada en el catálogo del shell, pruebas). Usar cuando Luis pide "sumá una app", "creá la app X" o "nueva app al sitio".
---

# ll-nueva-app

Receta oficial: `docs/desarrollo.md` § "Agregar una app nueva". Pedir el `<app>` (slug en minúsculas con guiones) y para qué sirve.

1. `apps/<app>/public/index.html` y `public/admin/index.html`; `apps/<app>/functions/api/[[path]].js`; `apps/<app>/tests/api.test.mjs`. Copiar la estructura de la app más chica (`apps/emociones`) en vez de inventarla.
2. **Todas** las rutas con prefijo `/<app>/` (`/<app>/api`, `/<app>/img`…). La prueba `tests/site/repo-layout.test.mjs` lo verifica.
3. Tablas: migración nueva en `db/migrations/` con el prefijo de la app (ver `docs/base-de-datos.md`). Una sola D1 para todo el sitio.
4. Catálogo del shell: entrada en `apps/shell/assets/apps.js` con `estado: "disponible"` y `url: "/<app>/"`. Las ideas sin implementar van con `estado: "pronto"` y `url: ""` (grises, sin link); se promueven a `"disponible"` cuando funcionan.
5. Si tiene pantalla: prueba en `e2e/tests/` y su nombre en la lista de `scripts/test.sh`.
6. Sumar la app a `docs/stack-tecnologico.md` y a la tabla del `README.md`; después `ll-docs`.
7. Cerrar con `ll-probar` (completo). Dejar la tarjeta en Verify del board `mng/leadership-lab.kanban.md`.

Texto visible en español rioplatense (voseo). Sin cuentas: se entra con código de equipo.
