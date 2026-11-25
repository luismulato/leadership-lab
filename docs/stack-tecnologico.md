# Stack tecnológico

Resumen del stack real de Leadership Lab. Las versiones son las que usa el proyecto hoy (verificadas el 2026-11-24).

## Visión general

| Capa | Tecnología | Versión | Dónde se usa |
|---|---|---|---|
| Plataforma | Cloudflare Pages | — | Hosting del sitio y de las funciones, en los ambientes `prod` (y `test` si se pasa a Cloudflare) |
| Backend | Cloudflare Pages Functions (JavaScript, módulos ES, runtime `workerd`) | `compatibility_date` 2026-10-01 | Una API por app en `functions/<app>/api/[[path]].js` |
| Base de datos | Cloudflare D1 (SQLite) | — | **Una sola base** compartida por las 5 apps |
| Almacenamiento clave-valor | Cloudflare KV | — | Solo el shell: tema activo (`activo`) |
| Frontend | HTML, CSS y JavaScript puros, **sin framework ni paso de empaquetado** | ES2020+ | Cada app es una página (`index.html`) |
| CLI de desarrollo | Wrangler | 4.168.0 (`^4.162.0`) | `pages dev` en local, `d1`, `kv` y `pages deploy` |
| Herramientas de armado | Python 3 | 3.9+ (probado con 3.9.6) | `scripts/build.py` y los `build.py` de cada app |
| Pruebas de API y esquema | `node:test` (Node) + CLI `sqlite3` | Node ≥ 20 | `apps/*/tests`, `db/tests`, `tests/site` |
| Pruebas de pantalla | Playwright con Google Chrome instalado | `^1.64.1` | `e2e/` |
| Documentación web | `marked` (markdown a HTML, solo en desarrollo) | `^18.3.0` | `scripts/build-docs.mjs` genera `docs/html/` |
| Integración continua | GitHub Actions | — | `.github/workflows/ci.yml` |
| Automatización | GNU Make + scripts Bash | — | `Makefile`, `scripts/*.sh` |

## Dependencias externas en tiempo de ejecución (CDN)

No se redistribuyen: el navegador las pide al abrir la página.

| Recurso | Para qué | Apps |
|---|---|---|
| Google Fonts: Gloock, Public Sans, DM Mono (y Barlow Condensed en Delegation) | Tipografías | todas |
| jsPDF 2.5.1 (cdnjs) | Exportar el canvas a PDF | Team Canvas, Retro, Emociones |
| Tally (`tally.so/widgets/embed.js` y el formulario embebido) | Formulario de feedback del botón lateral; solo se carga cuando alguien abre el panel | Shell (todas las apps) |
| Mermaid 11.4.1 (jsDelivr) | Dibujar los diagramas de la documentación web | `docs/html/` (si no hay internet, se ve el código del diagrama) |

## Por app

| App | Ruta | API | Tablas | Particularidades |
|---|---|---|---|---|
| **Team Canvas** | `/team-canvas/` | `/team-canvas/api/canvases…` | `canvases`, `notes` | Canvas de 9 secciones con notas compartidas; audios y PDF del taller; exporta a PDF |
| **Retro de Equipo** | `/retro/` | `/retro/api/retros…` | `retros`, `items` | Ciclo de 4 fases, 3 miradas (producto, proceso, equipo), votos; exporta a PDF |
| **Delegation Poker** | `/delegation/` | `/delegation/api/orgs…` | `orgs`, `decisions` | Decisiones guardadas como JSON; fuente propia en `src/index.src.html` |
| **Listado de Emociones** | `/emociones/` | `/emociones/api/boards…` | `emo_boards`, `emo_checkins` | Palabras y necesidades en `functions/words.json` (se importa en la función); exporta a PDF |
| **OpenSpace / Mercado de temas** | `/openspace/` | `/openspace/api/eventos…` | `eventos`, `sesiones` | Token secreto por sesión para moverla y registrarla; sin PDF |
| **Shell** | `/` | `/app-admin/api/*` | — (usa KV) | Menú lateral y apps embebidas en `iframe`; temas (`default`, `leadership-lab`); admin del sitio en `/app-admin/` |

Cada app trae además su **admin** en `/<app>/admin/` (listar y borrar equipos con la clave de administrador) y un **ejemplo de solo lectura** con el código `ACME01`.

## Cómo se genera cada página

| App | Fuente que se edita | Se genera |
|---|---|---|
| Team Canvas | `packages/canvas-base/team-canvas.html` + `apps/team-canvas/build.py` | `apps/team-canvas/public/index.html` |
| Retro, Emociones, OpenSpace | `apps/<app>/index.src.html` + `build.py` (sobre `packages/canvas-base`) | `apps/<app>/public/index.html` |
| Delegation | `apps/delegation/src/index.src.html` + `build.py` | `apps/delegation/public/index.html` |
| Shell | directo, sin paso de generación | — |

Los `public/index.html` generados están versionados para poder revisar los cambios en los pull requests, pero **se editan las fuentes**, nunca el generado: `scripts/build.py` los regenera en cada armado (por eso hace falta Python).

## Seguridad y límites

- Sin cuentas: el **código de 6 caracteres** del tablero es la llave. El admin se protege con el secreto `APP_ADMIN_CLAVE`, que se compara en tiempo constante.
- Topes por app (por ejemplo 40 tableros nuevos por hora, 600 notas por canvas, 500 decisiones por organización, 300 sesiones por evento) para frenar abuso.
- El ejemplo `ACME01` es de solo lectura y no se puede borrar ni editar.

---

Design with love ❤️ by [Tewa](https://tewaconsulting.com) & [Luis Mulato](https://www.linkedin.com/in/luismulato)
