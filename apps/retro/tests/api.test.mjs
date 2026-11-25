// Pruebas de la API de Retro de Equipo. Uso: node --test tests/   (BASE por defecto: local)
import test, { after } from "node:test";
import assert from "node:assert/strict";
const BASE = (process.env.BASE || "http://localhost:8815/retro").replace(/\/$/, "");
const made = [];
const call = async (method, path, body) => {
  const r = await fetch(BASE + "/api" + path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const newCode = () => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c = "ZT"; for (let i = 0; i < 4; i++) c += a[Math.floor(Math.random() * a.length)]; return c; };
const mk = async (name = "Equipo test") => { const code = newCode(); const r = await call("POST", "/retros", { name, code }); made.push(code); return { code, r }; };
after(async () => { for (const c of made) { const s = await call("GET", `/retros/${c}/state`); for (const n of (s.json.items || [])) await call("DELETE", `/retros/${c}/items/${n.id}`); } if (made.length) console.log("# retros de prueba creadas:", made.join(",")); });

test("Dado un equipo nuevo, cuando crea una retro con nombre, entonces recibe un código de 6 caracteres y entra a la fase 0", async () => {
  const r = await call("POST", "/retros", { name: "Equipo nuevo" });
  assert.equal(r.status, 201); assert.match(r.json.code, /^[A-Z0-9]{6}$/); assert.equal(r.json.phase, 0); made.push(r.json.code);
});
test("Dado un nombre vacío, cuando crea una retro, entonces la app lo rechaza", async () => {
  assert.equal((await call("POST", "/retros", { name: "" })).status, 400);
});
test("Dado un código válido, cuando otra persona lo consulta, entonces ve las mismas notas, votos y fase", async () => {
  const { code } = await mk();
  const n = await call("POST", `/retros/${code}/items`, { phase: 1, lens: "equipo", text: "Buen clima" });
  await call("PATCH", `/retros/${code}`, { phase: 3 });
  await call("POST", `/retros/${code}/items/${n.json.id}/vote`, { delta: 1 });
  const s = await call("GET", `/retros/${code}/state`);
  assert.equal(s.json.retro.phase, 3); assert.equal(s.json.items.length, 1); assert.equal(s.json.items[0].votes, 1); assert.equal(s.json.items[0].text, "Buen clima");
});
test("Dada la fase 3, cuando alguien vota con +, entonces el conteo sube y -1 lo baja sin pasar de 0", async () => {
  const { code } = await mk();
  const id = (await call("POST", `/retros/${code}/items`, { phase: 3, lens: "proceso", text: "x" })).json.id;
  await call("POST", `/retros/${code}/items/${id}/vote`, { delta: 1 });
  await call("POST", `/retros/${code}/items/${id}/vote`, { delta: 1 });
  let v = (await call("GET", `/retros/${code}/state`)).json.items[0].votes; assert.equal(v, 2);
  for (let i = 0; i < 3; i++) await call("POST", `/retros/${code}/items/${id}/vote`, { delta: -1 });
  v = (await call("GET", `/retros/${code}/state`)).json.items[0].votes; assert.equal(v, 0);
});
test("Dada la fase, cuando se cambia, entonces 0 a 4 es válido y 5 es inválido", async () => {
  const { code } = await mk();
  for (const p of [0, 1, 2, 3, 4]) assert.equal((await call("PATCH", `/retros/${code}`, { phase: p })).status, 200);
  assert.equal((await call("PATCH", `/retros/${code}`, { phase: 5 })).status, 400);
  assert.equal((await call("PATCH", `/retros/${code}`, { phase: -1 })).status, 400);
});
test("Dada una mirada inválida o nota vacía, cuando se crea la nota, entonces se rechaza", async () => {
  const { code } = await mk();
  assert.equal((await call("POST", `/retros/${code}/items`, { phase: 1, lens: "otra", text: "x" })).status, 400);
  assert.equal((await call("POST", `/retros/${code}/items`, { phase: 1, lens: "equipo", text: "  " })).status, 400);
  assert.equal((await call("POST", `/retros/${code}/items`, { phase: 0, lens: "equipo", text: "x" })).status, 400);
});
test("Dada una nota, cuando se edita y se borra, entonces el estado lo refleja", async () => {
  const { code } = await mk();
  const id = (await call("POST", `/retros/${code}/items`, { phase: 2, lens: "producto", text: "a" })).json.id;
  assert.equal((await call("PATCH", `/retros/${code}/items/${id}`, { text: "b" })).status, 200);
  assert.equal((await call("GET", `/retros/${code}/state`)).json.items[0].text, "b");
  assert.equal((await call("DELETE", `/retros/${code}/items/${id}`)).status, 200);
  assert.equal((await call("GET", `/retros/${code}/state`)).json.items.length, 0);
});
test("Dado un código repetido, cuando se crea otra retro, entonces responde 409", async () => {
  const { code } = await mk();
  assert.equal((await call("POST", "/retros", { name: "Otra", code })).status, 409);
});
test("Dado un código inexistente, cuando se consulta, entonces responde 404 sin romper", async () => {
  assert.equal((await call("GET", "/retros/QQQQQQ/state")).status, 404);
  assert.equal((await call("GET", "/retros/xx")).status, 404);
});
test("Dada la portada y el canvas, cuando se piden, entonces se sirven", async () => {
  assert.equal((await fetch(BASE + "/")).status, 200);
  assert.equal((await fetch(BASE + "/img/retro-canvas.svg")).status, 200);
});

// ---------- Ejemplo ficticio ACME01 (solo lectura; estos tests nunca lo modifican) ----------
const acme = async () => (await call("GET", "/retros/ACME01/state")).json;
test("Dado ACME01, cuando se abre, entonces es una retro en la fase 4 marcada como ejemplo, con notas de las tres miradas", async () => {
  const s = await acme();
  assert.equal(s.retro.code, "ACME01"); assert.equal(s.retro.phase, 4); assert.ok(s.retro.demo);
  assert.match(s.retro.name, /ACME/);
  assert.ok(s.items.length >= 16 && s.items.length <= 20, "notas: " + s.items.length);
  for (const p of [1, 2, 3, 4]) assert.ok(s.items.some((n) => n.phase === p), "fase " + p);
  for (const l of ["producto", "proceso", "equipo"]) assert.ok(s.items.some((n) => n.lens === l), l);
  assert.ok(!/bayer/i.test(JSON.stringify(s)));
});
test("Dado ACME01, cuando se miran los votos, entonces la fase 3 tiene más votos que las fases 1 y 2", async () => {
  const s = await acme(); const v = (p) => s.items.filter((n) => n.phase === p).map((n) => n.votes);
  assert.ok(Math.min(...v(3)) > Math.max(...v(1), ...v(2)));
});
test("Dado ACME01, cuando se mira la fase 4, entonces hay 3 experimentos con quién, hasta cuándo y cómo sabremos", async () => {
  const e = (await acme()).items.filter((n) => n.phase === 4);
  assert.equal(e.length, 3);
  for (const n of e) assert.match(n.text, /Hasta el .*Sabremos que funcionó/s);
});
test("Dado ACME01, cuando alguien intenta escribir, votar o cambiar de fase, entonces la API responde 403 y no cambia nada", async () => {
  const before = JSON.stringify(await acme()); const id = JSON.parse(before).items[0].id;
  const rs = [
    await call("POST", "/retros/ACME01/items", { phase: 1, lens: "equipo", text: "intruso" }),
    await call("PATCH", `/retros/ACME01/items/${id}`, { text: "cambiada" }),
    await call("DELETE", `/retros/ACME01/items/${id}`),
    await call("POST", `/retros/ACME01/items/${id}/vote`, { delta: 1 }),
    await call("PATCH", "/retros/ACME01", { phase: 2 }),
    await call("POST", "/retros", { name: "Otra", code: "ACME01" }),
  ];
  for (const r of rs) assert.equal(r.status, 403);
  assert.equal(JSON.stringify(await acme()), before);
});
test("Dado ACME01, cuando se intenta borrar la retro, entonces responde 403 y sigue existiendo", async () => {
  assert.equal((await call("DELETE", "/retros/ACME01")).status, 403);
  assert.equal((await call("GET", "/retros/ACME01")).status, 200);
});
test("Dada una retro común, cuando se consulta, entonces no está marcada como ejemplo", async () => {
  const { code } = await mk();
  assert.ok(!(await call("GET", `/retros/${code}`)).json.demo);
});

// ---- Modo admin: /api/admin/boards (clave = APP_ADMIN_CLAVE; en local la inyecta el Makefile) ----
const CLAVE_ADMIN = process.env.ADMIN_CLAVE || "clave-de-prueba-local";
async function admin(method, path, clave) {
  const headers = {};
  if (clave !== undefined) headers["x-admin-clave"] = clave;
  const r = await fetch(BASE + "/api/admin" + path, { method, headers });
  let j = {}; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}
async function nuevoEquipoAdmin(name) {
  const r = await fetch(BASE + "/api/retros", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
  return (await r.json()).code;
}
test("Admin: sin clave o con clave mala, la lista da 403", async () => {
  assert.equal((await admin("GET", "/boards")).status, 403);
  assert.equal((await admin("GET", "/boards", "mala")).status, 403);
});
test("Admin: con la clave correcta se ven los equipos con código, fecha y marca de ejemplo", async () => {
  const code = await nuevoEquipoAdmin("TEST-Admin Lista");
  const r = await admin("GET", "/boards", CLAVE_ADMIN);
  assert.equal(r.status, 200);
  const mio = r.body.boards.find((x) => x.code === code);
  assert.equal(mio.name, "TEST-Admin Lista");
  assert.equal(mio.example, false);
  assert.ok(mio.created_at);
  assert.equal(r.body.boards.find((x) => x.code === "ACME01").example, true);
  await admin("DELETE", "/boards/" + code, CLAVE_ADMIN);
});
test("Admin: borrar un equipo común lo elimina; con clave mala no", async () => {
  const code = await nuevoEquipoAdmin("TEST-Admin Borra");
  assert.equal((await admin("DELETE", "/boards/" + code, "mala")).status, 403);
  assert.equal((await admin("DELETE", "/boards/" + code, CLAVE_ADMIN)).status, 200);
  assert.equal((await admin("DELETE", "/boards/" + code, CLAVE_ADMIN)).status, 404);
  assert.ok(!(await admin("GET", "/boards", CLAVE_ADMIN)).body.boards.some((x) => x.code === code));
});
test("Admin: ACME01 no se borra ni con la clave correcta", async () => {
  assert.equal((await admin("DELETE", "/boards/ACME01", CLAVE_ADMIN)).status, 403);
  const g = await fetch(BASE + "/api/retros/ACME01"); assert.equal(g.status, 200);
});
