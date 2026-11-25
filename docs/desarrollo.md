# Desarrollo

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 20 o superior (ver `.nvmrc`) | Wrangler, pruebas |
| Python 3 | 3.9 o superior | Armado (`scripts/build.py` y los `build.py` de las apps) |
| Make | cualquiera | Comandos del proyecto |
| Google Chrome | reciente | Solo para las pruebas de pantalla (`make test-e2e`) |
| `sqlite3` (CLI) | cualquiera | Solo para la prueba del esquema |

## Arranque en tres pasos

```bash
git clone https://github.com/luismulato/leadership-lab.git && cd leadership-lab
make dev          # instala dependencias la primera vez, migra la base local y levanta
# abrir http://localhost:8090/    (admin: /app-admin/, clave: dev-admin-key)
```

La primera vez, `make dev` corre `make setup`: instala las dependencias (`npm install`) y crea `.env` desde `.env.example`.

## Comandos

`make help` los lista. Los principales:

| Comando | Qué hace |
|---|---|
| `make dev` | Levanta el ambiente de desarrollo (http://localhost:8090/) |
| `make up ENV=test` | Levanta el ambiente de pruebas (http://localhost:8190/, base vacía) |
| `make down ENV=dev` / `make status ENV=dev` | Baja / consulta |
| `make logs ENV=dev` | Sigue el log del servidor |
| `make reset ENV=dev` | Borra los datos locales de ese ambiente |
| `make build ENV=dev` | Arma `build/dev/` sin levantar nada |
| `make test` | Toda la suite en el ambiente de pruebas |
| `make docs` | Regenera la versión HTML de la documentación (`docs/html/`) |
| `make clean` | Borra `build/` y `.local/` |

Después de editar una app, volvé a correr `make dev`: reconstruye y reinicia.

## Documentación

La documentación se escribe en markdown (`README.md` y `docs/*.md`), que es la fuente. La versión web en `docs/html/` se **genera**: después de editar un `.md`, corré `make docs` y commiteá también el HTML. Si te olvidás, `make test` falla. Se abre con doble clic sobre `docs/html/index.html`.

## Flujo de trabajo

1. Crear una rama y editar la **fuente** (ver la tabla "Cómo se genera cada página" en [stack-tecnologico.md](stack-tecnologico.md)). No se edita ningún `public/index.html` generado.
2. `make dev` y mirar el cambio en el navegador.
3. Escribir o ajustar la prueba que lo cubre (primero la prueba, después el código).
4. `make test` hasta que dé verde.
5. Abrir el pull request (la CI corre `make test`).

## Agregar una app nueva

1. Crear `apps/<app>/` con `public/index.html` (y `public/admin/index.html`), `functions/api/[[path]].js` y `tests/api.test.mjs`.
2. Prefijar **todas** las rutas con `/<app>/` (`/<app>/api`, `/<app>/img`…).
3. Si necesita tablas: nueva migración en `db/migrations/` con prefijo de la app (ver [base-de-datos.md](base-de-datos.md)).
4. Agregarla al catálogo del shell en `apps/shell/assets/apps.js` con `estado: "disponible"` y `url: "/<app>/"`.
5. Si tiene pantalla de ejemplo, sumar su prueba en `e2e/tests/` y su nombre en `scripts/test.sh`.
6. `make test`: la prueba de estructura (`tests/site`) verifica que no queden rutas sin prefijo.

### Apps "Próximamente"

El catálogo (`apps/shell/assets/apps.js`) también lista las apps que todavía no existen, con `estado: "pronto"` y `url: ""`. Aparecen grises, en el grupo "Próximamente" del menú y como "Pronto" en el inicio, y no se pueden abrir. Para sumar una idea: agregar su entrada con `estado: "pronto"` (con su ficha: resumen, qué incluye, color e ícono). Para **promoverla a disponible** cuando esté lista: crear su carpeta en `apps/<app>/`, cambiar `estado` a `"disponible"` y poner `url: "/<app>/"`.

## Convenciones

- **Código, comentarios, nombres de archivos, scripts y mensajes de commit nuevos: en inglés.** Documentación (`docs/`, README, etc.) en español. La interfaz que ve la gente está en español.
- El código existente conserva sus nombres actuales (hay identificadores y comentarios en español); se traducen de a poco, sin mezclar con otros cambios.
- Formato según `.editorconfig`: UTF-8, LF, 2 espacios (4 en Python y Bash).

---

Design with love ❤️ by [Tewa](https://tewaconsulting.com) & [Luis Mulato](https://www.linkedin.com/in/luismulato)
