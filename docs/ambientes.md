# Ambientes

Hay tres ambientes, definidos en un solo archivo: [`config/environments.json`](../config/environments.json).

| | **dev** (desarrollo) | **test** (pruebas) | **prod** (producción) |
|---|---|---|---|
| Para qué | Programar y mirar cambios | Correr la suite y probar a mano con datos limpios | Lo que usa la gente |
| Dónde corre | Tu máquina | Tu máquina | Cloudflare |
| URL | http://localhost:8090/ | http://localhost:8190/ | https://leadership-lab.pages.dev/ |
| Base de datos | local, persiste | local, **se borra en cada arranque** | D1 `leadership-lab` |
| Clave de admin | `ADMIN_KEY_DEV` (por defecto `dev-admin-key`) | `ADMIN_KEY_TEST` (por defecto `test-admin-key`) | `ADMIN_KEY_PROD` (obligatoria, 12+ caracteres) |
| Comando | `make dev` | `make test` o `make up ENV=test` | `make deploy ENV=prod` |
| Feedback | formulario de Tally | formulario de Tally | formulario de Tally (configurable) |

Los tres son **el mismo código**. Lo único que cambia entre ambientes son dos archivos generados al armar (`wrangler.toml` y `public/env.js`), a partir de esta configuración.

## Cómo se define un ambiente

```json
"test": {
  "target": "local",                          // "local" o "cloudflare"
  "feedback_form_url": "https://tally.so/embed/…",  // formulario de feedback (Tally); vacío = sin botón
  "local":      { "port": 8190, "data_dir": ".local/test", "reset_on_up": true },
  "cloudflare": { "pages_project": "leadership-lab-test", "d1_database": "leadership-lab-test", "d1_id": "", "kv_id": "", "url": "https://leadership-lab-test.pages.dev" }
}
```

Cada ambiente trae los dos bloques. **`target`** decide dónde corre.

## Pasar "pruebas" a Cloudflare

Pruebas corre hoy en local. Para que corra en Cloudflare con el mínimo esfuerzo:

1. En `config/environments.json`, cambiar `"target": "local"` por `"target": "cloudflare"` en `test`.
2. `make cloudflare-bootstrap ENV=test`: crea el proyecto Pages, la D1 y el KV propios (`leadership-lab-test`) y guarda sus ids.
3. Definir `ADMIN_KEY_TEST` (12+ caracteres) en `.env`.
4. `make deploy ENV=test`.

La base de pruebas en Cloudflare queda separada de producción. `make test` seguiría corriendo en local si volvés a poner `"target": "local"`.

## Claves de administrador

- Protegen `/app-admin/` y `/<app>/admin/`.
- En local las inyecta `scripts/local.sh` desde `.env`.
- En Cloudflare son el secreto `APP_ADMIN_CLAVE` de cada proyecto Pages; `make deploy` lo carga desde `ADMIN_KEY_<AMBIENTE>`.
- `.env` está ignorado por git. Solo se versiona `.env.example`.

---

Design with love ❤️ by [Tewa](https://tewaconsulting.com) & [Luis Mulato](https://www.linkedin.com/in/luismulato)
