// Pruebas BDD de Listado de Emociones. Uso: BASE=http://localhost:8812 node --test tests/
// Contra producción: BASE=https://listado-de-emociones.pages.dev node --test tests/ y luego tests/cleanup.sh remote
import test from "node:test";
import assert from "node:assert/strict";

const BASE = (process.env.BASE || "http://localhost:8815/emociones").replace(/\/$/, "");
const LOCAL = /localhost|127\.0\.0\.1/.test(BASE);
const rid = () => Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);

async function call(method, path, body, owner) {
  const headers = {};
  if (body) headers["content-type"] = "application/json";
  if (owner) headers["x-owner"] = owner;
  const r = await fetch(BASE + "/api" + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}
const crear = async (name = "TEST-equipo") => (await call("POST", "/boards", { name })).body;

test("Dado un equipo nuevo, cuando crea un check-in con nombre, entonces recibe un código para compartir", async () => {
  const r = await call("POST", "/boards", { name: "TEST-Equipo Uno" });
  assert.equal(r.status, 201);
  assert.match(r.body.code, /^[A-Z0-9]{6}$/);
  const g = await call("GET", "/boards/" + r.body.code);
  assert.equal(g.status, 200);
  assert.equal(g.body.name, "TEST-Equipo Uno");
});

test("Dado un nombre demasiado corto, cuando crea el check-in, entonces recibe un error claro", async () => {
  const r = await call("POST", "/boards", { name: "a" });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /nombre/i);
});

test("Dado un código inexistente, cuando se consulta, entonces responde 404 sin romper", async () => {
  assert.equal((await call("GET", "/boards/ZZZZZZ")).status, 404);
  assert.equal((await call("GET", "/boards/ZZZZZZ/state")).status, 404);
  assert.equal((await call("GET", "/boards/xx")).status, 404);
});

test("Dada una persona con apodo, cuando elige una palabra, entonces ve su cuadrante y aparece en el mapa del equipo", async () => {
  const { code } = await crear();
  const owner = rid();
  const casos = [["Enojado", "ad"], ["Curioso", "aa"], ["Cansado", "bd"], ["Sereno", "ba"]];
  for (const [word, quadrant] of casos) {
    const r = await call("POST", `/boards/${code}/checkins`, { nick: "Ana", word, note: "nota " + word, need: "claridad" }, owner);
    assert.equal(r.status, 201);
    assert.equal(r.body.quadrant, quadrant);
  }
  const st = await call("GET", `/boards/${code}/state`);
  assert.equal(st.body.checkins.length, 4);
  assert.deepEqual(st.body.checkins.map((c) => c.quadrant), ["ad", "aa", "bd", "ba"]);
  assert.equal(st.body.checkins[0].need, "claridad");
});

test("Dada una entrada inválida, cuando se envía, entonces se rechaza", async () => {
  const { code } = await crear();
  const o = rid();
  const post = (b) => call("POST", `/boards/${code}/checkins`, b, o);
  assert.equal((await post({ nick: "", word: "Enojado" })).status, 400);
  assert.equal((await post({ nick: "Ana", word: "Inventada" })).status, 400);
  assert.equal((await post({ nick: "Ana", word: "Enojado", need: "dinero" })).status, 400);
  assert.equal((await call("POST", `/boards/${code}/checkins`, { nick: "Ana", word: "Enojado" })).status, 400, "sin identidad de navegador");
});

test("Dado un texto largo, cuando se guarda, entonces se recorta a 300 caracteres", async () => {
  const { code } = await crear();
  const r = await call("POST", `/boards/${code}/checkins`, { nick: "Ana", word: "Alegre", note: "x".repeat(900) }, rid());
  assert.equal(r.status, 201);
  assert.equal(r.body.note.length, 300);
});

test("Dado el mismo código en otro navegador, entonces se ven todos los check-ins, y cada persona edita o borra solo los suyos", async () => {
  const { code } = await crear();
  const ana = rid(), beto = rid();
  const a = (await call("POST", `/boards/${code}/checkins`, { nick: "Ana", word: "Ansioso" }, ana)).body;
  const b = (await call("POST", `/boards/${code}/checkins`, { nick: "Beto", word: "Tranquilo" }, beto)).body;
  const st = await call("GET", `/boards/${code}/state`);
  assert.equal(st.body.checkins.length, 2);
  assert.ok(!JSON.stringify(st.body).includes(ana), "no se expone la identidad");
  assert.ok(st.body.checkins.every((c) => !("owner" in c)));
  assert.equal((await call("PATCH", `/boards/${code}/checkins/${a.id}`, { nick: "Ana", word: "Alegre" }, beto)).status, 403);
  assert.equal((await call("DELETE", `/boards/${code}/checkins/${a.id}`, null, beto)).status, 403);
  assert.equal((await call("DELETE", `/boards/${code}/checkins/${a.id}`)).status, 403);
  const p = await call("PATCH", `/boards/${code}/checkins/${a.id}`, { nick: "Ana", word: "Alegre", note: "mejor", need: "sentido" }, ana);
  assert.equal(p.status, 200);
  assert.equal(p.body.quadrant, "aa");
  assert.equal((await call("DELETE", `/boards/${code}/checkins/${a.id}`, null, ana)).status, 200);
  const st2 = await call("GET", `/boards/${code}/state`);
  assert.deepEqual(st2.body.checkins.map((c) => c.id), [b.id]);
  assert.equal((await call("DELETE", `/boards/${code}/checkins/${a.id}`, null, ana)).status, 404);
});

test("Dado un tablero con 400 notas, cuando se suma otra, entonces se rechaza", { skip: !LOCAL && "solo en local, para no llenar producción" }, async () => {
  const { code } = await crear("TEST-limite");
  const o = rid();
  for (let i = 0; i < 400; i++) {
    const r = await call("POST", `/boards/${code}/checkins`, { nick: "Ana", word: "Curioso" }, o);
    assert.equal(r.status, 201, "nota " + i);
  }
  assert.equal((await call("POST", `/boards/${code}/checkins`, { nick: "Ana", word: "Curioso" }, o)).status, 429);
});

test("Dada la portada, cuando se abre, entonces ofrece el listado en PDF, la imagen de fondo y no menciona marcas ajenas", async () => {
  const r = await fetch(BASE + "/");
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.match(html, /Ver el listado de emociones \(PDF\)/);
  assert.match(html, /drive\.google\.com\/file\/d\/1q8K7Q2qpj5LMAB0aLLCHF4nfZLhG3Izv\/view/);
  assert.match(html, /jspdf\/2\.5\.1/);
  assert.ok(!/bayer/i.test(html));
  const img = await fetch(BASE + "/img/emociones-medidor.svg");
  assert.equal(img.status, 200);
});

// ---------- Ejemplo ficticio de ACME (solo lectura) ----------
const NICKS = ["Marta", "Diego", "Lucía", "Tomás", "Valeria", "Joaquín", "Camila", "Nico"];

test("Dado el código ACME01, cuando se consulta, entonces existe, está marcado como ejemplo y tiene el nombre esperado", async () => {
  const g = await call("GET", "/boards/ACME01");
  assert.equal(g.status, 200);
  assert.equal(g.body.name, "Check-in del lunes · Experiencia Cliente de ACME");
  assert.equal(g.body.example, true);
  const t = await call("GET", "/boards/" + (await crear()).code);
  assert.ok(!t.body.example, "un tablero común no es ejemplo");
});

test("Dado ACME01, cuando se lee su estado, entonces trae 8 check-ins de las 8 personas, repartidos en los cuatro cuadrantes, con nota y necesidad", async () => {
  const st = await call("GET", "/boards/ACME01/state");
  const c = st.body.checkins;
  assert.equal(c.length, 8);
  assert.deepEqual(c.map((x) => x.nick).sort(), [...NICKS].sort());
  const q = {}; c.forEach((x) => { q[x.quadrant] = (q[x.quadrant] || 0) + 1; });
  assert.deepEqual(Object.keys(q).sort(), ["aa", "ad", "ba", "bd"]);
  assert.ok(q.ad > q.aa && q.ad > q.bd, "pesa más la alta energía desagradable");
  assert.ok(c.every((x) => x.note.length > 10 && x.need), "todos con nota y necesidad");
  assert.ok(!JSON.stringify(st.body).match(/bayer/i));
});

test("Dado ACME01, cuando alguien intenta crear, editar o borrar, entonces la API responde 403 y nada cambia", async () => {
  const before = (await call("GET", "/boards/ACME01/state")).body.checkins;
  const o = rid();
  assert.equal((await call("POST", "/boards/ACME01/checkins", { nick: "Intruso", word: "Alegre" }, o)).status, 403);
  const id = before[0].id;
  assert.equal((await call("PATCH", `/boards/ACME01/checkins/${id}`, { nick: "X", word: "Alegre" }, o)).status, 403);
  assert.equal((await call("DELETE", `/boards/ACME01/checkins/${id}`, null, o)).status, 403);
  assert.equal((await call("PATCH", "/boards/ACME01", { name: "otro" }, o)).status >= 400, true);
  assert.deepEqual((await call("GET", "/boards/ACME01/state")).body.checkins, before);
});

test("Dado ACME01, cuando alguien intenta crear un tablero con ese código, entonces no lo pisa", async () => {
  const r = await call("POST", "/boards", { name: "TEST-pisar", code: "ACME01" });
  assert.equal(r.status, 409);
  assert.equal((await call("GET", "/boards/ACME01")).body.name, "Check-in del lunes · Experiencia Cliente de ACME");
});

test("Dado un código inexistente, cuando se pide, entonces sigue dando 404", async () => {
  assert.equal((await call("GET", "/boards/ACME02")).status, 404);
});

test("Dada la portada, cuando se abre, entonces ofrece abrir el ejemplo de ACME y el link #ejemplo", async () => {
  const html = await (await fetch(BASE + "/")).text();
  assert.match(html, /Abrir el ejemplo de ACME/);
  assert.match(html, /#ejemplo/);
  assert.match(html, /Ejemplo ficticio de ACME\. Es de solo lectura\./);
  assert.match(html, /Armar el mío/);
});

// ---- Modo admin: /api/admin/boards (clave = APP_ADMIN_CLAVE; en local viene de .dev.vars) ----
const CLAVE = process.env.ADMIN_CLAVE || "clave-de-prueba-local";
async function admin(method, path, clave) {
  const headers = {};
  if (clave !== undefined) headers["x-admin-clave"] = clave;
  const r = await fetch(BASE + "/api/admin" + path, { method, headers });
  let j = {}; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}

test("Dado sin clave o con clave mala, cuando pide la lista de equipos, entonces recibe 403", async () => {
  assert.equal((await admin("GET", "/boards")).status, 403);
  assert.equal((await admin("GET", "/boards", "mala")).status, 403);
});

test("Dado la clave correcta, cuando pide la lista, entonces ve los equipos con código, fecha y marca de ejemplo", async () => {
  const b = await crear("TEST-Admin Lista");
  const r = await admin("GET", "/boards", CLAVE);
  assert.equal(r.status, 200);
  const mio = r.body.boards.find((x) => x.code === b.code);
  assert.equal(mio.name, "TEST-Admin Lista");
  assert.equal(mio.example, false);
  assert.ok(mio.created_at);
  assert.equal(r.body.boards.find((x) => x.code === "ACME01").example, true);
});

test("Dado un equipo común, cuando el admin lo borra, entonces desaparecen él y sus check-ins", async () => {
  const b = await crear("TEST-Admin Borra");
  await call("POST", `/boards/${b.code}/checkins`, { nick: "Ana", word: "Curioso" }, "dueno-de-prueba-1");
  assert.equal((await admin("DELETE", "/boards/" + b.code, "mala")).status, 403);
  assert.equal((await call("GET", "/boards/" + b.code)).status, 200);
  assert.equal((await admin("DELETE", "/boards/" + b.code, CLAVE)).status, 200);
  assert.equal((await call("GET", "/boards/" + b.code)).status, 404);
  assert.equal((await admin("DELETE", "/boards/" + b.code, CLAVE)).status, 404);
});

test("Dado ACME01, cuando el admin intenta borrarlo, entonces recibe 403 aunque la clave sea correcta", async () => {
  assert.equal((await admin("DELETE", "/boards/ACME01", CLAVE)).status, 403);
  assert.equal((await call("GET", "/boards/ACME01")).status, 200);
});
