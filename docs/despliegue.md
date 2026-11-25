# Despliegue

## Local (dev y test)

```bash
make dev                # desarrollo -> http://localhost:8090/
make up ENV=test        # pruebas    -> http://localhost:8190/
```

No hace falta cuenta de Cloudflare. Ver [desarrollo.md](desarrollo.md).

## Producción (Cloudflare)

Publicar es una acción externa: **se hace a propósito** y con un respaldo antes.

### Primera vez

```bash
npx wrangler login                     # una vez por máquina
cp .env.example .env                   # y completar ADMIN_KEY_PROD (12+ caracteres)
make cloudflare-bootstrap ENV=prod     # crea Pages + D1 + KV "leadership-lab" y guarda sus ids
git add config/environments.json       # los ids de los recursos se versionan (no son secretos)
make deploy ENV=prod
```

`make cloudflare-bootstrap` es **idempotente**: si el recurso ya existe, lo reutiliza.

### Cada publicación

```bash
make test                # todo en verde antes de publicar
make deploy ENV=prod
```

`scripts/deploy.sh`:
1. Exporta un respaldo de la D1 a `.local/backups/`.
2. Arma `build/prod/`.
3. Aplica las migraciones pendientes a la D1 remota.
4. Carga la clave de admin como secreto `APP_ADMIN_CLAVE`.
5. Publica con `wrangler pages deploy`.
6. Verifica que respondan `/`, `/app-admin/` y cada app.

**Si el despliegue incluye migraciones, revisalas antes:** cambian datos reales.

### Cambiar la clave de admin

Editar `ADMIN_KEY_PROD` en `.env` y volver a correr `make deploy ENV=prod` (los secretos se aplican en el siguiente despliegue).

## Pruebas en Cloudflare

Ver "Pasar pruebas a Cloudflare" en [ambientes.md](ambientes.md).

## Migrar datos desde `ch-leadership-lab`

Si el sitio anterior tiene datos que querés conservar, copiá la base antes de publicar (la base original no se toca):

```bash
npx wrangler d1 export team-canvas --remote --no-schema --output .local/backups/old-data.sql   # base de ch-leadership-lab
sed -E 's/^INSERT INTO/INSERT OR REPLACE INTO/' .local/backups/old-data.sql | grep -v -E 'd1_migrations|sqlite_sequence|^PRAGMA|^BEGIN|^COMMIT' > .local/backups/load.sql
npx wrangler d1 execute leadership-lab --remote --file .local/backups/load.sql                  # base nueva (después de make deploy)
```

Verificá que los conteos de cada tabla coincidan antes de dar por terminada la migración.

## Feedback

El botón lateral **Feedback** del shell abre un panel con un formulario de [Tally](https://tally.so) embebido. No hace falta desplegar nada aparte.

- **Cambiar el formulario:** editar `feedback_form_url` del ambiente en `config/environments.json` (la URL de embed de Tally) y volver a desplegar. Con el valor vacío, el botón no aparece.
- **Ver las respuestas:** en tu cuenta de Tally (no en el admin del sitio).
- **Si el formulario no carga** (sin internet, bloqueado por una extensión o por la red, o más de 10 segundos sin cargar), el panel muestra como opción principal el enlace "Abrir el formulario en una ventana nueva", con la misma URL. Cuando carga bien, ese enlace queda igual, discreto, debajo del título del panel.
- **Privacidad:** Tally es un servicio de terceros. Su código solo se carga cuando alguien abre el panel por primera vez.

---

Design with love ❤️ by [Tewa](https://tewaconsulting.com) & [Luis Mulato](https://www.linkedin.com/in/luismulato)
