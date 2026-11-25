# Pruebas

`make test` corre **todo** contra el ambiente de pruebas (http://localhost:8190/, base vacía) y lo apaga al terminar.

| Nivel | Qué cubre | Dónde | Herramienta |
|---|---|---|---|
| Estructura y ambientes | Archivos de un repo open source, tres ambientes bien definidos, mismo código en todos, rutas con prefijo | `tests/site/` | `node:test` |
| Documentación HTML | Que cada página exista, esté al día con el markdown, no tenga links rotos y funcione sin internet | `tests/site/docs-html.test.mjs` | `node:test` |
| Esquema | Las migraciones crean las 10 tablas y los ejemplos `ACME01`; no hay tablas repetidas | `db/tests/` | `node:test` + `sqlite3` |
| Shell | Temas, admin y catálogo del shell | `apps/shell/tests/` | `node:test` |
| API (integración) | Cada endpoint de cada app contra el servidor real y su base: casos felices, validaciones, topes, ejemplo de solo lectura, modo admin | `apps/<app>/tests/` | `node:test` + `fetch` |
| Pantalla (extremo a extremo) | Abrir `/<app>/#CODIGO`, el botón "Abrir" del admin, códigos inexistentes, y el botón y panel de feedback del shell | `e2e/tests/` | Playwright (Chrome instalado) |

No hay pruebas unitarias aisladas de la lógica de cada función: las funciones se prueban a través de su API.

## Correr una parte

```bash
make test-unit    # estructura, esquema y shell (sin servidor)
make test-api     # API de las 5 apps
make test-e2e     # pantalla (necesita Google Chrome)
```

Para probar a mano en el ambiente de pruebas: `make up ENV=test` (queda corriendo; `make down ENV=test` lo baja).

## Escribir pruebas

- Estilo de los casos: **Dado… cuando… entonces…** (los existentes están así). Las pruebas nuevas, en inglés (Given / When / Then).
- Las pruebas de API aceptan `BASE` (por ejemplo `BASE=http://localhost:8190/retro`) y `ADMIN_CLAVE` (la clave del ambiente).
- Las pruebas de pantalla **crean datos**: solo corren contra `localhost`.
- Los tests de topes (por ejemplo, 429) se omiten fuera de local para no llenar una base real.

## Integración continua

`.github/workflows/ci.yml` instala dependencias y corre `make test` en cada push a `main` y en cada pull request.

---

Design with love ❤️ by [Tewa](https://tewaconsulting.com) & [Luis Mulato](https://www.linkedin.com/in/luismulato)
