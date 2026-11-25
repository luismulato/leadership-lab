import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const R = new URL("../", import.meta.url);
const leerJson = (p) => (fs.existsSync(new URL(p, R)) ? JSON.parse(fs.readFileSync(new URL(p, R), "utf8")) : []);
const versionados = leerJson("skin/temas/index.json");
// Temas entregados por .zip (no versionados): carpetas con tema.json que no están en index.json. build.py los registra en el build.
const dirsTemas = fs.readdirSync(new URL("skin/temas/", R), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const instalados = dirsTemas.filter((d) => !versionados.some((t) => t.id === d)).map((id) => ({ id }));
const temas = versionados.concat(instalados);

test("cada tema del índice tiene tema.json y tema.css; default existe", () => {
  assert.ok(versionados.some((t) => t.id === "default"));
  assert.ok(versionados.every((t) => ["default"].includes(t.id)), "index.json versionado solo lista temas libres; los demás van en instalados.json");
  for (const t of temas) {
    for (const f of ["tema.json", "tema.css"]) assert.ok(fs.existsSync(new URL(`skin/temas/${t.id}/${f}`, R)), `${t.id}: falta ${f}`);
    const j = JSON.parse(fs.readFileSync(new URL(`skin/temas/${t.id}/tema.json`, R), "utf8"));
    for (const k of ["logo", "sponsors"]) if (j[k]) assert.ok(fs.existsSync(new URL(`skin/temas/${t.id}/${j[k]}`, R)), `${t.id}: falta ${j[k]}`);
  }
});
test("un tema instalado por zip se registra solo: carpeta con id válido y tema.json con nombre", () => {
  for (const { id } of instalados) {
    assert.match(id, /^[a-z0-9-]+$/, `${id}: id de tema inválido`);
    assert.ok(JSON.parse(fs.readFileSync(new URL(`skin/temas/${id}/tema.json`, R), "utf8")).nombre, `${id}: tema.json sin nombre`);
  }
});

test("app-admin: contenedor con barra lateral, admin del shell por defecto y una entrada por app disponible", () => {
  const idx = fs.readFileSync(new URL("app-admin/index.html", R), "utf8");
  assert.ok(fs.existsSync(new URL("app-admin/shell.html", R)), "falta app-admin/shell.html");
  assert.match(idx, /url: "shell\.html"/);
  assert.ok(!/FEEDBACK_ADMIN|feedbackUrl/.test(idx), "el admin ya no lista la bandeja del servicio de feedback viejo");
  assert.match(idx, /LL_ENV/);                         // el ambiente viene de env.js, no del hostname
  assert.match(idx, /\/admin\//);                        // cada app: <url>/admin/
  const apps = fs.readFileSync(new URL("assets/apps.js", R), "utf8");
  assert.ok((apps.match(/estado: "disponible"/g) || []).length >= 5, "el catálogo debería tener las 5 apps disponibles");
});

test("el crédito Tewa & Luis Mulato está fijo en index.html y blindado en base.css (no depende del tema)", () => {
  const html = fs.readFileSync(new URL("index.html", R), "utf8");
  assert.match(html, /Design with love[\s\S]*Tewa[\s\S]*Luis Mulato/);
  assert.doesNotMatch(fs.readFileSync(new URL("skin/skin.js", R), "utf8"), /Design with love/);
  assert.match(fs.readFileSync(new URL("skin/base.css", R), "utf8"), /\.skin-credito[^{]*\{[^}]*!important/);
});

test("the end of the 'Próximamente' section links to Luis's LinkedIn ('Enterate de primera mano')", () => {
  const store = fs.readFileSync(new URL("assets/appstore.js", R), "utf8");
  assert.match(store, /Enterate de primera mano/);
  assert.match(store, /https:\/\/www\.linkedin\.com\/in\/luismulato/);
  assert.match(store, /rel", "noopener"|rel = "noopener"/);
  assert.match(store, /g\[0\] === "pronto"/);               // only in the coming-soon group, not at the end of "Disponibles"
  assert.match(fs.readFileSync(new URL("skin/base.css", R), "utf8"), /\.soon-note/);
});

test("feedback: botón lateral propio que abre un panel con el formulario de Tally embebido (carga diferida)", () => {
  const js = fs.readFileSync(new URL("skin/feedback.js", R), "utf8");
  assert.match(js, /LL_ENV\.feedbackFormUrl/);                 // la URL sale de la config del ambiente
  assert.match(js, /https:\/\/tally\.so\/widgets\/embed\.js/);   // script oficial de Tally
  assert.match(js, /data-tally-src|tallySrc/);                  // iframe con data-tally-src (carga diferida de Tally)
  assert.match(js, /Formulario de Feedback/);                   // título del iframe, como el código pedido
  assert.match(js, /Tally\.loadEmbeds/);
  assert.match(js, /role["',\s]+dialog/);                       // panel accesible
  assert.match(js, /Escape/);                                    // se cierra con Esc
  assert.ok(!/widget\.js/.test(js), "ya no carga el widget del servicio feedback-lab");
  assert.match(fs.readFileSync(new URL("skin/base.css", R), "utf8"), /\.fb-tab/);
});

test("el index del shell carga env.js antes que feedback.js", () => {
  const html = fs.readFileSync(new URL("index.html", R), "utf8");
  assert.ok(html.indexOf('src="env.js"') < html.indexOf('src="skin/feedback.js"'));
});

test("feedback: enlace de respaldo a ventana nueva si el embebido no carga (script con error, sin conexión o 10 s sin cargar)", () => {
  const js = fs.readFileSync(new URL("skin/feedback.js", R), "utf8");
  assert.match(js, /fb-fallback/);
  assert.match(js, /\.target\s*=\s*"_blank"|setAttribute\("target",\s*"_blank"\)/);
  assert.match(js, /rel[",\s]+noopener/);
  assert.match(js, /s\.onerror\s*=\s*(fail|failed|showFallback)/);   // el error del script ya no es silencioso
  assert.match(js, /navigator\.onLine/);                                // sin conexión
  assert.match(js, /10000/);                                             // tiempo máximo de espera del iframe
  assert.match(js, /fb-failed/);
  assert.match(fs.readFileSync(new URL("skin/base.css", R), "utf8"), /\.fb-failed/);
});

test("feedback: la opción de respaldo agrega 'O contacta a Luis Mulato' con su LinkedIn, solo cuando falla el embebido", () => {
  const js = fs.readFileSync(new URL("skin/feedback.js", R), "utf8");
  assert.match(js, /O contacta a/);
  assert.match(js, /https:\/\/www\.linkedin\.com\/in\/luismulato\//);      // con la barra final, como pidió Luis
  assert.match(js, /fallback\.appendChild\(fbContact\)/);
  // el contacto se agrega dentro de fail(), no al armar el panel
  const failBody = js.slice(js.indexOf("function fail()"), js.indexOf("// Same embed as the code"));
  assert.match(failBody, /fbContact/);
  assert.ok(!/fbContact/.test(js.slice(0, js.indexOf("function fail()")).replace(/var fbContact[^\n]*\n(?:[^\n]*fbContact[^\n]*\n)*/g, "")), "fbContact no debe montarse fuera de fail()");
});
