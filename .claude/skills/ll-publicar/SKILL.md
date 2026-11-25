---
name: ll-publicar
description: Publica leadership-lab en Cloudflare (make deploy ENV=…) con tests, aviso de datos y respaldo de la D1. Usar solo cuando Luis pide publicar/desplegar a producción o a pruebas; nunca por iniciativa propia.
---

# ll-publicar

Publicar es una acción externa: **pedir autorización explícita de Luis cada vez**; una autorización anterior no vale para la siguiente.

1. Preguntar el ambiente (`prod` o `test` si ya apunta a Cloudflare en `config/environments.json`).
2. `ll-probar` completo en verde. Si falla, no seguir.
3. **Avisar si toca datos**: listar migraciones nuevas en `db/migrations/` respecto de lo ya publicado y cualquier borrado o copia de datos. Decir con palabras simples qué cambia en la base. Esperar el sí de Luis.
4. Antes de publicar el repo o un sitio: correr `ll-revisar-publicacion`.
5. `make deploy ENV=<amb>`: `scripts/deploy.sh` exporta respaldo de la D1 a `.local/backups/`, arma `build/<amb>/`, aplica migraciones remotas, carga el secreto `APP_ADMIN_CLAVE` y publica con wrangler. Requiere `npx wrangler login` y `ADMIN_KEY_<ENV>` (12+ caracteres) en `.env`.
6. Si un tema está en zip (no versionado): descomprimirlo en la raíz **antes** de desplegar; si no, sale el tema `default`.
7. Verificar la URL pública y reportar el resultado real (qué se publicó, dónde quedó el respaldo).

Primera vez en un ambiente: `make cloudflare-bootstrap ENV=<amb>` (crea Pages + D1 + KV; también pide autorización).
