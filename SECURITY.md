# Política de seguridad

## Reportar una vulnerabilidad

No abras un issue público. Escribí al responsable del proyecto (ver el autor en `LICENSE`) con el detalle y los pasos para reproducirla. Respondemos dentro de los 7 días.

## Qué cuidar

- **Claves de administrador** (`ADMIN_KEY_*`): viven en `.env` (ignorado por git) y como secreto `APP_ADMIN_CLAVE` de Cloudflare Pages. Nunca se commitean.
- Las apps no tienen cuentas: **el código del equipo es la llave** de cada tablero. Usá códigos largos para datos sensibles.
- El ejemplo `ACME01` es de solo lectura y no se puede borrar ni editar.
