# md-kanban-tracker

Extensión de VSCode que muestra un archivo Markdown `.kanban.md` como un **tablero kanban** interactivo, con seguimiento de WIP y de tiempos incluido. Los datos viven en texto plano: sin base de datos ni formatos propietarios.

Esta carpeta (`mng/`) es la del tablero de gestión del proyecto; el tablero en sí es [`leadership-lab.kanban.md`](leadership-lab.kanban.md).

## Repositorio

**https://github.com/luismulato/md-kanban-tracker** (público)

```bash
git clone https://github.com/luismulato/md-kanban-tracker.git
```

- **Versión actual:** 0.3.9.
- **Origen:** fork de [kanban.md](https://github.com/wguilherme/kanban.md), de Withney Guilherme. Licencia MIT, conservada.
- **Distribución:** no está en el Marketplace de VSCode ni publica releases en GitHub. Se instala armando el `.vsix` desde el repositorio (pasos abajo).

## Instalar

**Requisitos:** VSCode `^1.106.0`, Node.js 22 o superior y git.

```bash
git clone https://github.com/luismulato/md-kanban-tracker.git
cd md-kanban-tracker
npm install
npx @vscode/vsce package --no-dependencies
code --install-extension md-kanban-tracker-*.vsix
```

Reiniciar VSCode si no aparece el ícono de **Kanban** en la barra lateral. Para actualizar a una versión nueva: `git pull` y repetir los tres últimos comandos.

## Cómo usarlo

### 1. Abrir el tablero

Cualquiera de estas formas, con un archivo `.kanban.md`:

- Hacer clic en el tablero desde el ícono **Kanban** de la barra lateral (lista todos los tableros del workspace).
- Clic derecho sobre el archivo `.kanban.md` → **Kanban**.
- Paleta de comandos (`Cmd/Ctrl+Shift+P`) → **md-kanban-tracker: Kanban**.

Para crear uno nuevo: botón **➕ New Kanban Board** en la barra lateral, o crear un archivo con extensión `.kanban.md`. Al abrir uno vacío, la extensión lo arma con las columnas estándar y una tarjeta de ejemplo.

### 2. Formato del archivo

El tablero es Markdown común: `#` es el título, `##` cada columna y `###` cada tarjeta.

````markdown
# Mi proyecto

## To Do

### Título de la tarjeta

- type: story
- tags: [docs, ui]
    ```md
    Descripción de la tarjeta, en varias líneas si hace falta.
    - [ ] Un paso
    - [x] Otro paso ya hecho
    ```

## WIP

## Done
````

Columnas estándar: `Backlog`, `To Do`, `WIP`, `Done`, `Done Done`. Se pueden agregar otras (este tablero usa además `Verify`).

### 3. Trabajar con las tarjetas

- **Mover:** arrastrar la tarjeta a otra columna; se guarda sola en el archivo.
- **Abrir el detalle:** clic en la tarjeta. Ahí se edita el título (clic en el título; `Enter` guarda, `Esc` descarta), la prioridad y la carga (clic en la etiqueta para recorrer los valores), los pasos, la descripción y la fecha límite (clic en cualquier parte de la fila abre el calendario).
- **Agregar:** botón **+ Add card** al pie de la columna (aparece al pasar el mouse).
- **Reordenar:** al pasar el mouse sobre una tarjeta, subirla una posición o llevarla al tope de la columna.
- **Borrar:** la X de la tarjeta pide confirmación; con varias seleccionadas (`Cmd/Ctrl` + clic) borra todas.
- **Filtrar y ordenar:** escribir etiquetas separadas por coma (`design,urgent`) y ordenar por nombre, fecha, prioridad o carga.
- **Columnas:** se pueden ocultar (ojo en el título) y reordenar arrastrando el encabezado.

### 4. Lo que hace la extensión sola

| Automatización | Qué pasa |
|---|---|
| **Un solo WIP** | Si arrastrás una segunda tarjeta a `WIP`, la que estaba vuelve al tope de `To Do` |
| **Archivado diario** | La primera vez en el día que algo entra a `WIP`, todo lo que había en `Done` pasa a `Done Done` |
| **Timer sincronizado con WIP** | Entrar a `WIP` arranca el timer de la tarjeta; salir lo para y agrega una línea al `.timelog.md`. Cambiar de foco para el viejo y arranca el nuevo |

Al abrir por primera vez un `.kanban.md`, la extensión crea al lado una carpeta `md-kanban-tracker/` con el registro de tiempos (`<tablero>.timelog.md`) y una guía de uso. No hace falta tocarlos a mano. Cada línea del registro tiene la forma:

```
YYYY-MM-DD HH:MM–HH:MM (Nm) — "Tarea" (motivo)
```

### 5. Configuración y comandos

Ajuste (`Archivo > Preferencias > Configuración`, buscar "md-kanban-tracker"):

| Ajuste | Valores | Qué hace |
|---|---|---|
| `md-kanban-tracker.taskHeader` | `"title"` (por defecto) o `"list"` | Las tarjetas se escriben como `### Título` o como `- ítem` de lista |

Comandos de la paleta:

| Comando | Qué hace |
|---|---|
| `md-kanban-tracker: Kanban` | Abre la vista de tablero del archivo actual |
| `md-kanban-tracker: New Kanban Board` | Crea un tablero nuevo |
| `md-kanban-tracker: Refresh` | Refresca la lista de tableros de la barra lateral |
| `md-kanban-tracker: Enable/Disable File Switcher` | Activa o desactiva el cambio automático de archivo |

## Más información

- Repositorio y documentación completa (en inglés y español): https://github.com/luismulato/md-kanban-tracker (`README.md` y `README.es.md`).
- Guía rápida generada para cada tablero: [`md-kanban-tracker/kanban-guia-ES.md`](md-kanban-tracker/kanban-guia-ES.md).
- Cambios de cada versión: `CHANGELOG.md` en el repositorio.
