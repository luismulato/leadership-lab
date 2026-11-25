# Leadership Lab

Apps simples para que los equipos practiquen liderazgo y trabajo en equipo, sin cuentas: se entra con un **código de equipo**. Cinco apps y un menú, en un solo sitio, sobre **Cloudflare Pages + D1**.

| App | Ruta | Para qué |
|---|---|---|
| **Team Canvas** | `/team-canvas/` | Un canvas de 9 secciones para definir quién es el equipo y cómo quiere trabajar |
| **Retro de Equipo** | `/retro/` | Un ciclo de retro para mirar producto, proceso y equipo, y decidir qué probar |
| **Delegation Poker** | `/delegation/` | Acordar hasta dónde puede decidir el equipo en cada decisión |
| **Listado de Emociones** | `/emociones/` | Ponerle nombre a lo que se siente y a lo que se necesita |
| **OpenSpace / Mercado de temas** | `/openspace/` | Armar entre todos una agenda de sesiones, sin agenda previa |

**Repositorio:** https://github.com/luismulato/leadership-lab

Cada app trae un ejemplo de solo lectura con el código `ACME01` y su propio admin en `/<app>/admin/`.

## Arranque rápido

Necesitás **Node.js 20+**, **Python 3** y **Make**.

```bash
git clone https://github.com/luismulato/leadership-lab.git
cd leadership-lab
make dev
```

Abrí http://localhost:8090/. El admin del sitio está en `/app-admin/` (clave de desarrollo: `dev-admin-key`).

`make dev` instala las dependencias la primera vez, migra la base local y levanta el sitio. Para bajarlo: `make down`. Todos los comandos: `make help`.

## Tres ambientes

| Ambiente | Dónde | URL | Comando |
|---|---|---|---|
| `dev` — desarrollo | local | http://localhost:8090/ | `make dev` |
| `test` — pruebas | local (base vacía en cada arranque) | http://localhost:8190/ | `make test` / `make up ENV=test` |
| `prod` — producción | Cloudflare | https://leadership-lab.pages.dev/ | `make deploy ENV=prod` |

El mismo código corre en los tres; lo que cambia se define en [`config/environments.json`](config/environments.json). Detalle en [docs/ambientes.md](docs/ambientes.md).

## Pruebas

```bash
make test        # toda la suite: estructura, esquema, API de las 5 apps y pantalla
```

## Documentación

Toda en español, en [`docs/`](docs/). Hay una **versión web amigable** (menú, buscador, modo oscuro): abrí `docs/html/index.html` en el navegador, sin servidor. Se regenera con `make docs`.

Páginas:

- [Stack tecnológico](docs/stack-tecnologico.md): qué usa cada capa y cada app, con versiones
- [Arquitectura](docs/arquitectura.md): cómo encaja todo y cómo se arma el sitio
- [Ambientes](docs/ambientes.md): dev, test y prod; cómo pasar pruebas a Cloudflare
- [Base de datos](docs/base-de-datos.md): una sola D1, tablas y migraciones
- [Desarrollo](docs/desarrollo.md): requisitos, flujo de trabajo, cómo agregar una app
- [Pruebas](docs/pruebas.md): niveles de prueba y cómo correrlos
- [Despliegue](docs/despliegue.md): publicar en Cloudflare

## Estructura

```
apps/        shell (menú) y las 5 apps
packages/    código compartido (canvas-base)
db/          migraciones de la base única
config/      definición de los ambientes
scripts/     armado, local, pruebas, despliegue
tests/ e2e/  pruebas
docs/        documentación (español)
mng/         tablero kanban del proyecto
```

## Contribuir

Leé [CONTRIBUTING.md](CONTRIBUTING.md) y el [código de conducta](CODE_OF_CONDUCT.md). Para reportar un problema de seguridad, ver [SECURITY.md](SECURITY.md).

## Licencia

Código bajo licencia [MIT](LICENSE). Parte del contenido (logos, audios, imágenes) es de terceros: ver [NOTICE.md](NOTICE.md).

---

Design with love ❤️ by [Tewa](https://tewaconsulting.com) & [Luis Mulato](https://www.linkedin.com/in/luismulato)
