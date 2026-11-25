# Leadership Lab

## Backlog

### LL-5 · Publicar leadership-lab: recursos nuevos en Cloudflare (producción y, opcional, pruebas)

- type: story
- tags: [leadership-lab, cloudflare, deploy, aidev]
    ```md
    Historia: como Luis quiero crear en Cloudflare el proyecto Pages, la D1 y el KV `leadership-lab`, copiar los datos actuales y publicar, para tener la versión nueva en producción.
    Requiere autorización explícita de Luis (crea recursos y cambia la URL pública a https://leadership-lab.pages.dev/). Avisar antes: copia datos de la D1 actual (`team-canvas`) a la nueva; la actual queda intacta como respaldo.
    Criterios:
    - Dado `make cloudflare-bootstrap ENV=prod`, cuando se corre, entonces crea Pages + D1 + KV y guarda sus ids en config/environments.json.
    - Dado `make deploy ENV=prod`, entonces migra, publica y verifica las rutas en vivo.
    - Dado la D1 nueva, entonces tiene los mismos conteos que la actual.
    - Dado el feedback: el servicio actual solo acepta orígenes viejos; decidir si se activa para el dominio nuevo.
    DoD:
    - [ ] Autorización de Luis
    - [ ] Recursos creados y ids guardados
    - [ ] Datos copiados con conteos iguales
    - [ ] Deploy y verificación en vivo
    - [ ] Luis decide qué hacer con el sitio anterior (ch-leadership-lab.pages.dev)
    Estado: 2026-11-24 espera autorización de Luis: crear Pages+D1+KV 'leadership-lab' en Cloudflare, copiar datos de la D1 actual (team-canvas) y publicar en https://leadership-lab.pages.dev/. Al hacerlo: avisar que la URL pública cambia. Pendiente además: el servicio de feedback solo acepta orígenes viejos (CORS), hay que agregar el dominio nuevo si se quiere el botón.
    ```

## To Do

## WIP

## Verify

### LL-15 · Publicar el repositorio en GitHub (público)

- type: story
- tags: [leadership-lab, github, open-source, aidev]
    ```md
    Pedido (Luis, 2026-11-25): "Subir el proyecto a GitHub como público. (incluye el mng/ y excluye los datos sensibles, ej. .env y otros que sean temporales)".
    Historia: como autor quiero el proyecto publicado en GitHub, con su tablero mng/, sin claves ni archivos temporales, para que cualquiera pueda clonarlo y levantarlo con `make dev`.
    Criterios:
    - Dado el repositorio publicado, entonces incluye mng/ y no incluye .env, claves, datos locales (.local/), builds (build/, dist/), dependencias (node_modules/), resultados de prueba ni archivos del sistema.
    - Dado una búsqueda de secretos sobre todo lo versionado, entonces no aparece ninguna clave, token ni contraseña real (las claves de ejemplo de desarrollo son públicas a propósito).
    - Dado un clon nuevo del repo público, entonces `make dev` levanta el sitio (misma prueba del clon limpio).
    - Dado el README y mng/README.md, entonces tienen la URL real del repo (no marcadores).
    DoD:
    - [x] Revisión de secretos y de material temporal sobre lo versionado
    - [x] Repositorio público creado y URL reflejada en README y mng/README.md
    - [x] Commit inicial y push a main
    - [x] Verificado el repo público (archivos, mng/, sin .env) y un clon limpio
    - [x] Tarjeta en Verify con lo que quedó público (material de terceros)
    Estado: 2026-11-25 hecho. Repo público: https://github.com/luismulato/leadership-lab (rama main, commit inicial 60a908b, 144 archivos, incluye mng/). Revisión de secretos: sin claves, tokens, ids de Cloudflare, emails ni rutas locales. No se publicó: .env, .local/, build/, dist/ (incluye el zip del tema), node_modules/, resultados de prueba. Clon limpio desde GitHub: make up ENV=test levantó y las 5 apps responden 200. QUEDÓ PÚBLICO con derechos de terceros (declarado en NOTICE.md): ilustraciones de OpenSpace (Jorge Roldán y Organico), 5 audios del taller, el PDF del Canvas de Equipos que Enamoran y canvas.png. El tema con logos de Tewa/Bayer/San Andrés NO está en el repo. Si hay que retirar algo, hay que borrarlo del historial (git filter-repo), no alcanza con un commit nuevo. Pendiente de Luis: confirmar la licencia MIT y el material de terceros; revisar la skills de .claude/ que también quedaron públicas.
    ```

### LL-14 · Feedback: enlace de respaldo si el formulario embebido no carga

- type: story
- tags: [leadership-lab, shell, feedback, aidev]
    ```md
    Pedido (Luis, 2026-11-25): "en el caso de que no se pueda cargar el embebido, deja que aparezca este link que va a una ventana nueva como opción por defecto al pulsar el botón de feedback" (https://tally.so/embed/bZW1bL?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1).
    Historia: como persona que quiere dar feedback quiero poder abrir el formulario en una ventana nueva cuando el embebido no se ve (sin internet, bloqueado por una extensión o por la red), para no quedarme sin poder opinar.
    Criterios:
    - Dado que el script de Tally no carga (bloqueado, sin internet), cuando se abre el panel, entonces se muestra el enlace al formulario como opción principal, y abre en una ventana nueva (target _blank, rel noopener).
    - Dado que el navegador está sin conexión al abrir el panel, entonces se muestra el enlace de respaldo de inmediato.
    - Dado que el iframe no termina de cargar en 10 segundos, entonces se muestra el enlace de respaldo.
    - Dado que el formulario carga bien, entonces el enlace queda visible igual, discreto, debajo del formulario ("¿No se ve? Abrilo en una ventana nueva").
    - Dado el enlace, entonces apunta a la misma URL de feedback_form_url.
    DoD:
    - [x] Pruebas escritas primero y vistas en rojo
    - [x] Respaldo en feedback.js y base.css
    - [x] Probado en el navegador (cargando bien y con Tally bloqueado)
    - [x] Docs corregidos
    - [x] Tarjeta en Verify
    Estado: 2026-11-25 hecho. Si el embebido no carga (script con error, navegador sin conexión o iframe sin cargar en 10 s) el panel muestra 'Abrir el formulario en una ventana nueva ↗' como opción principal (misma URL, target _blank, rel noopener, formulario oculto). Cargando bien, el enlace queda discreto bajo el título. Pruebas: 1 estática nueva + 2 de pantalla (Tally bloqueado y sin conexión); 6 de pantalla del feedback en verde. Probado en navegador: cargando bien y con navigator.onLine=false. No probado: bloqueo real por extensión o por X-Frame-Options (la detección de 10 s es el respaldo).
    ```

### LL-13 · Las apps no se veían en local: las pruebas rompían el servidor de desarrollo

- type: bug
- tags: [leadership-lab, local, aidev]
    ```md
    Reporte (Luis, 2026-11-25): "valida que las apps abran, actualmente no las puedo ver ninguna de ellas."
    Causa: las pruebas (make test / make test-unit) reconstruyen build/dev (rm -rf + copia) mientras el servidor de desarrollo la está sirviendo; wrangler queda vivo pero sin responder (puerto 8090 en 000). Corrí make test con el local arriba y lo rompí.
    Historia: como quien desarrolla quiero correr las pruebas sin que se caiga mi ambiente de desarrollo, y que las apps abran siempre que `make dev` diga que está arriba.
    Criterios:
    - Dado un servidor de desarrollo corriendo, cuando se corre make test (o test-unit), entonces dev sigue respondiendo (/, /retro/, etc.) y su carpeta no se toca.
    - Dado build.py --out <dir>, entonces arma ahí y deja intacto build/<env>.
    - Dado local.sh up, entonces el servidor corre desde una copia propia (.local/<env>/site), no desde build/<env>, así reconstruir no lo afecta.
    - Dado make status, entonces solo dice "up" si las apps responden (no solo la raíz).
    DoD:
    - [x] Pruebas escritas primero y vistas en rojo
    - [x] build.py --out; pruebas usan directorio propio; local.sh sirve desde copia
    - [x] make status verifica las apps
    - [x] Reproducido el bug (correr make test con dev arriba) y verificado que ya no ocurre
    - [x] Las 5 apps abiertas en el navegador, por link directo y desde el menú del shell
    - [x] Tarjeta en Verify
    Estado: 2026-11-25 hecho. Causa real: make test reconstruía build/dev (rm -rf) mientras wrangler la servía; el servidor quedaba vivo pero sin responder (8090 en 000), por eso no se veía ninguna app. Corregido: build.py --out, pruebas en build/.tests, local.sh sirve desde .local/<env>/site (copia), make status exige que respondan las 5 apps. Verificado: dev arriba -> make test-unit + make build -> sigue 200 en todas las rutas. Las 5 apps abiertas en el navegador desde el menú del shell (sin recursos rotos) y por link directo (e2e + curl). Pendiente por tu lado: si seguís sin verlas, decime la URL exacta que abrís.
    ```

### LL-12 · Botón de feedback con el formulario de Tally embebido

- type: story
- tags: [leadership-lab, shell, feedback, aidev]
    ```md
    Pedido (Luis, 2026-11-25): "quiero que salga este código embebido en el botón de feedback actual" (iframe de Tally https://tally.so/embed/bZW1bL?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1, título "Formulario de Feedback", con el script de carga de Tally).
    Interpretación: el botón lateral "Feedback" pasa a ser propio del shell (ya no viene de un servicio aparte) y al tocarlo abre un panel con el formulario de Tally embebido. Reemplaza al widget del servicio feedback-lab en leadership-lab; el servicio viejo y ch-leadership-lab no se tocan.
    Historia: como persona que usa las apps quiero tocar "Feedback" y completar el formulario sin salir de la página, para dar mi opinión rápido.
    Criterios:
    - Dado cualquier ambiente (dev, test, prod), cuando se abre el shell, entonces hay un botón lateral "Feedback" (la URL del formulario sale de config/environments.json -> feedback_form_url).
    - Dado el botón, cuando se toca, entonces se abre un panel con el iframe de Tally (mismos atributos que el código pedido) y se carga el script de Tally; se cierra con la X, con Esc o tocando fuera.
    - Dado que nadie abrió el panel, entonces no se carga nada de Tally (carga diferida).
    - Dado feedback_form_url vacío, entonces no hay botón.
    - Dado el shell de admin, entonces ya no lista la bandeja del servicio viejo.
    - Dado celular y los dos temas, entonces se usa bien.
    DoD:
    - [x] Pruebas escritas primero y vistas en rojo (config, shell, pantalla)
    - [x] Botón y panel en el shell; config y env.js; admin sin bandeja vieja
    - [x] Docs, NOTICE y CHANGELOG corregidos; HTML regenerado
    - [x] Probado en el navegador con el formulario real
    - [x] Local actualizado
    - [x] Tarjeta en Verify
    Estado: 2026-11-25 hecho. Botón lateral 'Feedback' propio del shell (skin/feedback.js + base.css); al tocarlo abre un panel con el iframe de Tally (mismos atributos y título que el código pedido) y el script de carga; Tally se carga recién al abrir. URL en config/environments.json -> feedback_form_url (los 3 ambientes), llega por env.js (feedbackFormUrl). Se quitó la dependencia del servicio feedback-lab y la entrada 'Feedback recibido' del admin del shell. Pruebas: config 8, shell 7, pantalla 4 nuevas (Tally bloqueado, sin internet) y make test completo en verde. Probado en navegador con el formulario real: se renderiza en el panel (no se envió ninguna respuesta). No probado: celular con el formulario real, tema default, ni el modo claro del panel. El botón solo existe en el shell: quien abre una app por link directo (/retro/#ABC) no lo ve. Respuestas: en la cuenta de Tally. ch-leadership-lab y el servicio feedback-lab no se tocaron.
    ```

### LL-11 · "Enterate de primera mano" al final de Próximamente

- type: story
- tags: [leadership-lab, shell, aidev]
    ```md
    Pedido (Luis, 2026-11-24): "al final del archivo de proximamente agrega 'enterate de primera mano' con un link a mi linkedin."
    Interpretación: al final de la sección "Próximamente" del catálogo del shell (después de la última app en gris) va una línea con ese texto, enlazada al LinkedIn de Luis (el mismo link del crédito: https://www.linkedin.com/in/luismulato). Si se refería a otro lugar, se mueve.
    Historia: como persona que ve las apps que vienen en camino quiero un llamado para enterarme de primera mano, para seguir lo que se publica.
    Criterios:
    - Dado el home del shell, cuando hay apps "Próximamente", entonces al final de esa sección aparece "Enterate de primera mano" como link a https://www.linkedin.com/in/luismulato, que abre en pestaña nueva (rel noopener).
    - Dado un filtro o búsqueda sin apps "Próximamente", entonces el llamado no aparece (no queda suelto).
    - Dado cualquier tema (default y leadership-lab) y el modo celular, entonces se lee bien.
    DoD:
    - [x] Prueba escrita primero y vista en rojo
    - [x] Implementación en appstore.js y base.css
    - [x] Probado en el navegador (escritorio, celular, filtro sin Próximamente)
    - [x] Local actualizado
    - [x] Tarjeta en Verify
    Estado: 2026-11-24 hecho. Al final de la sección Próximamente del home: 'Enterate de primera mano →', link a https://www.linkedin.com/in/luismulato (pestaña nueva, rel noopener). Solo existe mientras la sección se muestra: una búsqueda que deja solo apps disponibles (ej. 'poker') la oculta. Probado en navegador: escritorio (tema leadership-lab), celular 390 px (sin desborde) y filtros. Prueba nueva en apps/shell/tests (5 en verde). No probado: tema default; el menú lateral no lleva el llamado (solo el home). INTERPRETACIÓN: 'archivo de próximamente' = final de la sección Próximamente; si Luis lo quería en otro lugar, se mueve.
    ```

### LL-9 · Volver a mostrar las apps "Próximamente" en el catálogo del shell

- type: story
- tags: [leadership-lab, shell, catalogo, aidev]
    ```md
    Pedido (Luis, 2026-11-24): "agrega las apps de coming soon que teníamos en la anterior versión."
    Esto revierte la decisión de LL-1 de listar solo apps que funcionan: el catálogo vuelve a mostrar las 14 apps "Próximamente" del proyecto anterior (ch-leadership-lab), en su mismo orden y con sus mismas fichas.
    Historia: como persona que abre el shell quiero ver también lo que viene en camino (apps "Próximamente", grises y sin link), para saber qué se está construyendo.
    Criterios:
    - Dado el catálogo del shell, entonces tiene 19 apps: las 5 disponibles (con url /<id>/) y 14 "pronto" (sin url), con las mismas entradas que en ch-leadership-lab.
    - Dado una app "pronto", entonces aparece en el menú lateral dentro del grupo "Próximamente" y en el home como "Pronto", sin poder abrirse.
    - Dado el catálogo, entonces las categorías incluyen las de las apps "pronto" (Acuerdos, etc.) y no hay ids repetidos.
    - Dado la documentación, entonces ya no dice que solo se listan apps que funcionan; explica cómo agregar una app "pronto" y cómo promoverla a disponible.
    DoD:
    - [x] Prueba reescrita primero y vista en rojo
    - [x] Catálogo restaurado (19 apps)
    - [x] Docs, CONTRIBUTING y CHANGELOG corregidos; HTML regenerado
    - [x] Probado en el navegador (menú y home)
    - [x] Local actualizado
    - [x] Tarjeta en Verify
    Estado: 2026-11-24 hecho. apps.js restaurado desde ch-leadership-lab: 19 apps (5 disponibles idénticas + 14 pronto sin url), 6 categorías (vuelve Acuerdos). Pruebas: repo-layout reescrita (rojo→verde); make test-unit 26+4 en verde. Probado en navegador: grupo Próximamente en el menú, 14 botones Pronto deshabilitados. Local actualizado (:8090). Otros ajustes: la prueba de estructura ya no exige que .claude no exista (hay skills ll-* de otra sesión) y comprueba que .env no esté versionado (antes miraba el disco); se corrigió la frase falsa en la skill ll-nueva-app. No probado: make test completo (API/pantalla) tras este cambio, que solo toca el catálogo del shell.
    ```

### LL-8 · Skills básicas de Claude para el proyecto

- type: story
- tags: [leadership-lab, skills, aidev]
    ```md
    Pedido (Luis, 2026-11-24): "crea un conjunto de skills básicas para claude para usar con este proyecto".
    Historia: como Luis quiero skills del proyecto para las tareas que más se repiten, para que Claude las haga igual cada vez.
    Criterios:
    - Dado `.claude/skills/`, entonces hay seis skills: ll-probar, ll-nueva-app, ll-publicar, ll-docs, ll-tema-zip, ll-revisar-publicacion, cada una con SKILL.md válido y basada en comandos que existen (make test-unit, make test, make docs, make deploy, scripts/).
    - Dado `scripts/empaquetar-tema.sh <id>`, entonces genera dist/tema-<id>.zip con ruta completa y LEEME.
    - Dado ll-publicar, entonces exige autorización explícita y aviso de datos antes de desplegar.
    DoD:
    - [x] Skills creadas y catálogo lm-skills sincronizado (115 skills)
    - [x] Script de empaquetado probado con leadership-lab
    - [ ] Probar cada skill en una sesión real (pendiente: Luis)
    Estado: 2026-11-24 hecho, sin commit. Falta un CLAUDE.md del proyecto (hoy no hay): las skills lo aprovecharían.
    ```

### LL-10 · Créditos "Design with love" en la documentación (md y html)

- type: story
- tags: [leadership-lab, docs, aidev]
    ```md
    Pedido (Luis, 2026-11-24): "En la doc del proyecto en md y html no aparecen los créditos de diseñado with love... agregalo."
    Historia: como autoría del proyecto quiero que los créditos "Design with love ❤️ by Tewa & Luis Mulato" (los mismos del pie del shell, con sus links) aparezcan en la documentación, en markdown y en la versión web, para que se vea quién la diseñó.
    Criterios:
    - Dado el README y cada docs/*.md, entonces terminan con el crédito, con los links a Tewa y a Luis Mulato.
    - Dado cada página de docs/html/, entonces muestra el crédito en el pie y una sola vez (no duplicado dentro del artículo).
    - Dado un cambio en el markdown, entonces make docs regenera el HTML y make test lo verifica.
    DoD:
    - [x] Pruebas escritas primero y vistas en rojo
    - [x] Crédito en README.md y docs/*.md
    - [x] Pie con crédito en el HTML (sin duplicar)
    - [x] Probado en navegador
    - [x] Tarjeta en Verify
    Estado: 2026-11-24 hecho. Crédito 'Design with love ❤️ by Tewa & Luis Mulato' (mismo texto y links que el pie del shell) al final de README.md y de los 7 docs/*.md, y en el pie de las 8 páginas de docs/html/ (una sola vez; make docs lo saca del cuerpo del artículo). 2 pruebas nuevas (docs-html.test.mjs, 9 en total) en rojo y luego en verde. Probado en navegador en modo oscuro. No cubierto: la skin/crédito del shell lo maneja LL-7.
    ```

### LL-7 · Tema leadership-lab fuera del repo, entregado como .zip

- type: story
- tags: [leadership-lab, skin, open-source, aidev]
    ```md
    Pedido (Luis, 2026-11-24): el skin se distribuye aparte; vive en el proyecto pero no va a GitHub; al cliente se le pasa la URL del repo y el .zip del tema con sus instrucciones.
    Historia: como autor quiero que el tema con logos de terceros no se publique en GitHub y se entregue como .zip fácil de aplicar, para abrir el repo sin material de marcas.
    Criterios:
    - Dado el repo, entonces solo el tema `default` está versionado; `temas/leadership-lab/` y `dist/` están en el .gitignore y fuera del índice de git.
    - Dado `dist/tema-leadership-lab.zip` descomprimido en la raíz de un clon, entonces el tema queda en su ruta y se registra solo (build.py genera instalados.json desde temas/*/tema.json).
    - Dado un clon sin el zip, entonces el shell y sus tests funcionan con `default`.
    - Dado cualquier tema, entonces el crédito "Design with love by Tewa & Luis Mulato" se ve (vive en index.html y base.css lo blinda).
    DoD:
    - [x] Tema sacado de git (git rm --cached) y .gitignore actualizado
    - [x] Registro automático de temas instalados en build.py + funciones del admin + tests
    - [x] Crédito movido a index.html y blindado, con test
    - [x] Zip con ruta completa y LEEME-tema-leadership-lab.md
    - [x] NOTICE.md actualizado
    - [ ] Probado en navegador y en un clon limpio con el zip (pendiente: Luis)
    Estado: 2026-11-24 hecho, sin commit. El tema sigue en disco (temas/leadership-lab/); el zip está en dist/. Pendiente: el historial de git no tiene commits todavía, así que no hay nada que reescribir. Audios, PDF e ilustraciones de NOTICE.md siguen en el repo.
    ```

### LL-6 · Versión HTML amigable de la documentación

- type: story
- tags: [leadership-lab, docs, aidev]
    ```md
    Pedido (Luis, 2026-11-24): "en docs, crea una versión amigable en html".
    Historia: como persona que llega al proyecto quiero leer la documentación como un sitio web ordenado (menú lateral, índice de cada página, modo claro/oscuro, buscador), sin instalar nada, para entender el stack y los ambientes más rápido que leyendo markdown.
    Diseño: las fuentes siguen siendo los .md (única fuente de verdad); `make docs` genera docs/html/ con un script Node (marked). Sin servidor: se abre con doble clic (file://). Idioma de la interfaz: español.
    Criterios:
    - Dado cada docs/*.md y el README, cuando se corre `make docs`, entonces existe su página en docs/html/ con menú lateral que lista todas, y el link a la página actual marcado.
    - Dado un link entre documentos (`desarrollo.md`), entonces en el HTML apunta a su página (`desarrollo.html`) y no queda ningún link roto.
    - Dado un diagrama mermaid, entonces se dibuja en la página (y si no hay internet, se ve su código).
    - Dado un bloque de código, entonces tiene botón de copiar.
    - Dado el HTML, entonces funciona sin servidor, en celular y en modo oscuro, y no depende de nada que no esté en docs/html/ salvo mermaid desde CDN.
    - Dado un cambio en un .md sin regenerar, entonces `make test` falla (el HTML no está desactualizado).
    DoD:
    - [x] Prueba escrita primero y vista en rojo
    - [x] scripts/build-docs.mjs + plantilla + estilos
    - [x] make docs y README/docs enlazan la versión HTML
    - [x] Probado en navegador (claro, oscuro, celular)
    - [x] Tarjeta en Verify
    Estado: 2026-11-24 hecho. docs/html/ (8 páginas: Inicio + 7 docs) con menú lateral, índice por página, buscador (tecla /), modo claro/oscuro, botón copiar y diagramas mermaid; se abre con doble clic. Prueba tests/site/docs-html.test.mjs (7) + make test-unit 23 en verde. Probado en navegador: escritorio, oscuro y celular (390 px); encontré y corregí 2 bugs (diagrama se rompía al cambiar de tema; botón Copiar tapaba la primera línea). No probado: sin internet (los diagramas muestran su código), impresión.
    ```

### LL-4 · Documentación técnica básica en español con el stack actual

- type: story
- tags: [leadership-lab, docs, aidev]
    ```md
    Pedido (Luis, 2026-11-24): nueva versión de la app en projects/leadership-lab: solo apps que funcionan, sin mng/ ni backups, estructura y ambientes estándar de open source, 3 ambientes (desarrollo=local, pruebas, producción), parte programática en inglés y documentación en español, despliegue local muy fácil, documentación técnica básica con el stack. Decisiones: no traducir lo existente por ahora; desarrollo y pruebas en local (pruebas migrable a Cloudflare con mínimo esfuerzo); producción en recursos nuevos `leadership-lab` (Pages + D1).
    Historia: como colaborador nuevo quiero documentación técnica en español que explique el stack, la arquitectura, los ambientes, la base de datos, cómo desarrollar, probar y desplegar.
    Criterios:
    - Dado docs/, entonces hay stack tecnológico (por app, con versiones reales), arquitectura, ambientes, base de datos, desarrollo, pruebas y despliegue.
    - Dado el README, entonces enlaza todo y explica el arranque en 3 pasos.
    - Dado cada comando documentado, entonces existe y funciona.
    DoD:
    - [x] docs/ en español con stack real de cada app
    - [x] README en español
    - [x] Comandos documentados verificados
    Estado: 2026-11-24 hecho. docs/: stack-tecnologico, arquitectura, ambientes, base-de-datos, desarrollo, pruebas, despliegue + README, CONTRIBUTING. Comandos verificados: dev, up, down, status, reset, build, test, test-unit, test-api, test-e2e (vía scripts/test.sh), help. Sin verificar: logs, clean, cloudflare-bootstrap, deploy (el procedimiento de copia de datos desde ch-leadership-lab está documentado pero no se ejecutó).
    ```

### LL-3 · Despliegue local con un solo comando

- type: story
- tags: [leadership-lab, local, dx, aidev]
    ```md
    Pedido (Luis, 2026-11-24): nueva versión de la app en projects/leadership-lab: solo apps que funcionan, sin mng/ ni backups, estructura y ambientes estándar de open source, 3 ambientes (desarrollo=local, pruebas, producción), parte programática en inglés y documentación en español, despliegue local muy fácil, documentación técnica básica con el stack. Decisiones: no traducir lo existente por ahora; desarrollo y pruebas en local (pruebas migrable a Cloudflare con mínimo esfuerzo); producción en recursos nuevos `leadership-lab` (Pages + D1).
    Historia: como persona que clona el repo quiero levantar todo en local con un solo comando (`make dev`), sin pasos manuales.
    Criterios:
    - Dado un clon limpio con Node y Python instalados, cuando se corre `make dev`, entonces instala dependencias, migra la base local, levanta el sitio y lo deja respondiendo en http://localhost:8090/.
    - Dado `make test`, entonces corre todas las pruebas contra el ambiente de pruebas con base vacía y lo apaga.
    - Dado `make help`, entonces lista los comandos.
    DoD:
    - [x] Makefile y scripts en inglés
    - [x] make dev / up / down / status / test / build / deploy
    - [x] Prueba de clon limpio (carpeta temporal)
    - [x] Suite completa en verde en el ambiente de pruebas
    Estado: 2026-11-24 hecho. Clon limpio (solo archivos versionados) -> make dev: instaló, migró y levantó en ~8 s, todas las rutas 200. make test: 128 pruebas en verde (estructura/esquema 16, shell 3, API 93, pantalla 16). Hallazgo: wrangler 4.168 no toma los bindings D1/KV del wrangler.toml en 'pages dev'; se pasan con --d1/--kv. No ejecutados a propósito: make deploy y make cloudflare-bootstrap (tocan Cloudflare).
    ```

### LL-2 · Tres ambientes: desarrollo y pruebas locales, producción en Cloudflare

- type: story
- tags: [leadership-lab, ambientes, cloudflare, aidev]
    ```md
    Pedido (Luis, 2026-11-24): nueva versión de la app en projects/leadership-lab: solo apps que funcionan, sin mng/ ni backups, estructura y ambientes estándar de open source, 3 ambientes (desarrollo=local, pruebas, producción), parte programática en inglés y documentación en español, despliegue local muy fácil, documentación técnica básica con el stack. Decisiones: no traducir lo existente por ahora; desarrollo y pruebas en local (pruebas migrable a Cloudflare con mínimo esfuerzo); producción en recursos nuevos `leadership-lab` (Pages + D1).
    Historia: como Luis quiero tres ambientes definidos en un solo archivo de configuración, para que desarrollo y pruebas corran en local y producción en Cloudflare, y pruebas pueda pasar a Cloudflare cambiando un valor.
    Criterios:
    - Dado config/environments.json, entonces dev, test y prod tienen puerto/proyecto, base de datos y URL propios y no comparten datos.
    - Dado cada ambiente local, cuando se levanta, entonces usa su propia base local y su propia clave de admin.
    - Dado test con target cloudflare, entonces el mismo deploy lo publica en su propio proyecto Pages y D1.
    - Dado el código de las apps, entonces no cambia entre ambientes: lo que difiere se inyecta por configuración.
    DoD:
    - [x] Config de ambientes y generador de wrangler/env por ambiente
    - [x] dev (:8090) y test (:8190) locales con bases separadas
    - [x] prod y test preparados para Cloudflare (sin crear recursos)
    - [x] Feedback opcional por ambiente (apagado por defecto)
    Estado: 2026-11-24 hecho. dev :8090 y test :8190 (base vacía en cada arranque), prod en Cloudflare con recursos 'leadership-lab' (aún no creados). tests/site/environments.test.mjs 8/8. No probado: que test corra en Cloudflare (solo preparado: cambiar target y make cloudflare-bootstrap ENV=test).
    ```

### LL-1 · Proyecto leadership-lab: estructura open source con solo las apps que funcionan

- type: story
- tags: [leadership-lab, estructura, aidev]
    ```md
    Pedido (Luis, 2026-11-24): nueva versión de la app en projects/leadership-lab: solo apps que funcionan, sin mng/ ni backups, estructura y ambientes estándar de open source, 3 ambientes (desarrollo=local, pruebas, producción), parte programática en inglés y documentación en español, despliegue local muy fácil, documentación técnica básica con el stack. Decisiones: no traducir lo existente por ahora; desarrollo y pruebas en local (pruebas migrable a Cloudflare con mínimo esfuerzo); producción en recursos nuevos `leadership-lab` (Pages + D1).
    Historia: como Luis quiero un proyecto nuevo y limpio, con la estructura estándar de un repo open source (README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, .github, .editorconfig, .env.example), con solo el shell y las 5 apps que funcionan.
    Criterios:
    - Dado el proyecto nuevo, cuando se lista, entonces no existe mng/, backup/ ni material de terceros, y tiene apps/ con shell y las 5 apps.
    - Dado el catálogo del shell, entonces no muestra apps "Próximamente".
    - Dado un git nuevo, entonces ningún archivo ignorado (claves, datos, builds) queda versionado.
    Decisión: lo existente se copia sin traducir; los archivos nuevos se escriben en inglés.
    DoD:
    - [x] Pruebas de estructura escritas primero
    - [x] Copia de apps y paquetes sin mng/backup/recursos
    - [x] Catálogo del shell solo con apps disponibles
    - [x] Archivos de comunidad y .github
    - [x] git init sin commit
    Estado: 2026-11-24 hecho (NOTA: el criterio 'catálogo sin Próximamente' fue revertido por Luis en LL-9; hoy el catálogo vuelve a listar las 14 apps Próximamente). Estructura open source completa (README, LICENSE MIT, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, NOTICE, .github con CI y plantillas, .editorconfig, .gitattributes, .env.example, .nvmrc). Solo shell + 5 apps; catálogo sin 'Próximamente'. git init hecho y todo en staging, SIN commit. Luis: revisar NOTICE.md (logos de Tewa/Bayer/USAL, audios y PDF de terceros) y confirmar la licencia MIT antes de hacer público el repo.
    ```

## Done

## Done Done

