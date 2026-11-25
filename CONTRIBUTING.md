# Cómo contribuir

¡Gracias por querer sumar! Esta guía es corta a propósito.

## Antes de empezar

1. Leé el [README](README.md) y [docs/desarrollo.md](docs/desarrollo.md).
2. Levantá el proyecto en local: `make dev`.
3. Para cambios grandes, abrí primero un issue y contanos la idea.

## Flujo

1. Forkeá el repositorio y creá una rama: `feature/<tema>` o `fix/<tema>`.
2. Hacé el cambio **editando las fuentes**, no los `public/index.html` generados (ver [docs/stack-tecnologico.md](docs/stack-tecnologico.md)).
3. Escribí primero la prueba que lo cubre y verificá que falle; después el código.
4. Corré `make test` hasta que dé todo verde.
5. Abrí el pull request con la plantilla; la CI vuelve a correr `make test`.

## Reglas

- **Código, comentarios, nombres de archivos, scripts y commits nuevos: en inglés.** Documentación en español. La interfaz que ve la gente, en español rioplatense.
- Un cambio de base de datos es **una migración nueva** en `db/migrations/` (nunca editar una aplicada). Las tablas nuevas llevan prefijo de la app.
- Todas las rutas de una app llevan su prefijo (`/<app>/api`, `/<app>/img`…).
- No se commitean secretos: las claves van en `.env` (ignorado por git).
- Las apps que aún no existen se listan en el catálogo como `estado: "pronto"` (sin link); solo se pasan a `"disponible"` cuando funcionan y tienen sus pruebas.
- Un cambio, una intención: no mezclar traducciones o formato con cambios de comportamiento.

## Mensajes de commit

Formato corto en imperativo y en inglés: `Add vote count to retro items`, `Fix admin "open" link in emociones`.

## Reportar errores

Usá la plantilla de issue de error. Para vulnerabilidades, **no abras un issue público**: ver [SECURITY.md](SECURITY.md).
