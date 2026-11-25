# Base de datos

Las cinco apps comparten **una sola base D1** (SQLite). Cada ambiente tiene la suya: nunca comparten datos.

| Ambiente | Base |
|---|---|
| `dev` | local, en `.local/dev/state/` (nombre `leadership-lab-dev`) |
| `test` | local, en `.local/test/state/`, se borra en cada arranque (nombre `leadership-lab-test`) |
| `prod` | D1 `leadership-lab` en Cloudflare |

## Migraciones

- Viven en `db/migrations/`, en **una sola secuencia numerada** (`0001_…` a `0011_…`).
- Se aplican solas al levantar un ambiente local (`make dev`, `make test`) y en `make deploy`.
- **Nunca se edita una migración ya aplicada.** Un cambio de esquema es un archivo nuevo con el número siguiente.
- Las tablas nuevas llevan prefijo de la app (`<app>_<tabla>`) para no chocar con otras.
- Convención de nombres de archivo: `NNNN_<app>_<qué-hace>.sql`.

## Tablas

Los nombres de tablas y columnas se conservan como estaban (algunos están en español); la interfaz y la API los usan tal cual.

| App | Tabla | Qué guarda | Clave |
|---|---|---|---|
| Team Canvas | `canvases` | Un canvas por equipo (`code`, `name`, `created_at`, `locked` = ejemplo de solo lectura) | `code` |
| | `notes` | Notas por sección (`sec`, `text`) | `id`, FK `code` |
| Retro | `retros` | Una retro por equipo (`phase` 0–3, `demo` = ejemplo) | `code` |
| | `items` | Ideas por fase y mirada (`lens`: producto, proceso, equipo), con `votes` | `id`, FK `code` |
| Delegation Poker | `orgs` | Organizaciones (`readonly` = ejemplo) | `code` |
| | `decisions` | Decisiones, como JSON en `data` | `id`, FK `code` |
| Emociones | `emo_boards` | Tableros (`example` = ejemplo) | `code` |
| | `emo_checkins` | Check-ins: `nick`, `word`, `quadrant`, `note`, `need`, `owner` | `id`, FK `code` |
| OpenSpace | `eventos` | Eventos: `pregunta`, `lugares` y `horarios` (JSON), `facilitador` (token), `demo` | `code` |
| | `sesiones` | Sesiones propuestas: `titulo`, `autor`, `tipo`, `lugar`, `hora`, `interes`, `token`, `estado`, `notas`, `decisiones`, `proximo_paso` | `id`, FK `code`, único `(code, lugar, hora)` |

El `code` (6 caracteres, sin letras ambiguas) es la llave de cada tablero y de su ejemplo (`ACME01`). Los ejemplos `ACME01` se crean con las migraciones `*_acme*.sql`.

## Operar la base

```bash
# Ver una base local (después de make up ENV=dev)
sqlite3 .local/dev/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite ".tables"

# Borrar los datos locales de un ambiente
make reset ENV=dev

# Exportar la base de producción (respaldo)
npx wrangler d1 export leadership-lab --remote --output .local/backups/leadership-lab.sql
```

`make deploy` ya exporta un respaldo a `.local/backups/` antes de publicar.

---

Design with love ❤️ by [Tewa](https://tewaconsulting.com) & [Luis Mulato](https://www.linkedin.com/in/luismulato)
