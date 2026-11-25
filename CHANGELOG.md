# Changelog

Todos los cambios relevantes se documentan acá. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

### Agregado
- Proyecto nuevo `leadership-lab`, a partir de `ch-leadership-lab`, con estructura estándar de repositorio open source.
- Tres ambientes (`dev`, `test`, `prod`) definidos en `config/environments.json`: desarrollo y pruebas en local, producción en Cloudflare.
- Despliegue local con un solo comando (`make dev`) y suite de pruebas completa (`make test`).
- Documentación técnica en español en `docs/`, con versión web amigable en `docs/html/` (menú, buscador, modo oscuro, diagramas) generada con `make docs`.

### Corregido
- Las pruebas (`make test`, `make test-unit`) ya no rompen el servidor de desarrollo: arman en su propia carpeta y `make dev` sirve desde una copia (`.local/dev/site`). `make status` ahora verifica que respondan las apps.

### Cambiado
- El catálogo del shell lista las 5 apps disponibles y las 14 "Próximamente" (grises, sin link), igual que en `ch-leadership-lab`.
- El botón de feedback es propio del shell y abre un panel con un formulario de Tally embebido (`feedback_form_url` por ambiente). Reemplaza al widget del servicio `feedback-lab`; sin esa URL, el botón no aparece. Si el formulario no carga (sin conexión, bloqueado o más de 10 s), el panel ofrece abrirlo en una ventana nueva.

### Apps incluidas
Team Canvas, Retro de Equipo, Delegation Poker, Listado de Emociones y OpenSpace / Mercado de temas.
