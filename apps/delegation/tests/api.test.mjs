// Pruebas de la API de Delegation Poker. Uso: node --test tests/   (BASE=https://... para producción)
import test, { after } from "node:test";
import assert from "node:assert/strict";

const BASE = (process.env.BASE || "http://localhost:8815/delegation").replace(/\/$/, "");
const creadas = [];

async function call(method, path, body) {
  const r = await fetch(BASE + "/api" + path, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}
const decision = (o = {}) => Object.assign({ title: "Aprobar descuentos", area: "Comercial", team: "Ventas", leaderName: "Marta Ríos", leaderRole: "Gerenta", current: 2, desired: 5, startDate: "2026-11-04", targetDate: "2027-02-04", note: "Con tope" }, o);
async function nuevaOrg(name = "Org de prueba") {
  const r = await call("POST", "/orgs", { name });
  assert.equal(r.status, 201);
  creadas.push(r.body.code);
  return r.body.code;
}

// Limpieza: los tests de producción no dejan datos (salvo ACME01).
after(async () => {
  for (const c of creadas) await call("DELETE", "/orgs/" + c + "").catch(() => {});
});

test("Dado un nombre, cuando se crea la organización, entonces recibe un código y entra al tablero", async () => {
  const code = await nuevaOrg("Cooperativa de prueba");
  assert.match(code, /^[A-Z0-9]{6}$/);
  const g = await call("GET", "/orgs/" + code);
  assert.equal(g.status, 200);
  assert.equal(g.body.name, "Cooperativa de prueba");
  assert.equal(g.body.readonly, false);
  const l = await call("GET", "/orgs/" + code + "/decisions");
  assert.deepEqual(l.body.decisions, []);
});

test("Dado un nombre demasiado corto, cuando se crea, entonces se rechaza", async () => {
  const r = await call("POST", "/orgs", { name: "a" });
  assert.equal(r.status, 400);
});

test("Dada una decisión completa, cuando se guarda, entonces se lista igual al volver a pedirla", async () => {
  const code = await nuevaOrg();
  const w = await call("POST", "/orgs/" + code + "/decisions", decision());
  assert.equal(w.status, 201);
  assert.match(w.body.id, /^[A-Z0-9]{9}$/);
  const l = await call("GET", "/orgs/" + code + "/decisions");
  assert.equal(l.body.decisions.length, 1);
  const d = l.body.decisions[0];
  assert.equal(d.id, w.body.id);
  assert.equal(d.title, "Aprobar descuentos");
  assert.equal(d.current, 2); assert.equal(d.desired, 5);
  assert.equal(d.targetDate, "2027-02-04");
});

test("Dada una decisión guardada, cuando se edita con PUT y se borra, entonces cambia y desaparece", async () => {
  const code = await nuevaOrg();
  const w = await call("POST", "/orgs/" + code + "/decisions", decision());
  const e = await call("PUT", "/orgs/" + code + "/decisions/" + w.body.id, decision({ title: "Otro título", desired: 6 }));
  assert.equal(e.status, 200);
  let l = await call("GET", "/orgs/" + code + "/decisions");
  assert.equal(l.body.decisions[0].title, "Otro título");
  assert.equal(l.body.decisions[0].desired, 6);
  const x = await call("DELETE", "/orgs/" + code + "/decisions/" + w.body.id);
  assert.equal(x.status, 200);
  l = await call("GET", "/orgs/" + code + "/decisions");
  assert.equal(l.body.decisions.length, 0);
});

test("Dada una decisión inválida, cuando se guarda, entonces se rechaza con 400", async () => {
  const code = await nuevaOrg();
  for (const mal of [decision({ title: "" }), decision({ leaderName: "" }), decision({ current: 0 }), decision({ desired: 8 }), decision({ targetDate: "mañana" }), decision({ current: "x" })]) {
    const r = await call("POST", "/orgs/" + code + "/decisions", mal);
    assert.equal(r.status, 400, JSON.stringify(mal));
  }
});

test("Dada una decisión con campos de más y textos largos, cuando se guarda, entonces se ignoran los extra y se acotan los textos", async () => {
  const code = await nuevaOrg();
  const w = await call("POST", "/orgs/" + code + "/decisions", decision({ title: "x".repeat(500), note: "n".repeat(2000), hack: "<script>" }));
  assert.equal(w.status, 201);
  const d = (await call("GET", "/orgs/" + code + "/decisions")).body.decisions[0];
  assert.equal(d.title.length, 120);
  assert.equal(d.note.length, 400);
  assert.equal(d.hack, undefined);
});

test("Dado un código inexistente, cuando se consulta, entonces responde 404", async () => {
  const r = await call("GET", "/orgs/ZZZZZZ");
  assert.equal(r.status, 404);
  const w = await call("POST", "/orgs/ZZZZZZ/decisions", decision());
  assert.equal(w.status, 404);
});

test("Dado el código ACME01, cuando se abre, entonces es el ejemplo ficticio en solo lectura con unas 8 decisiones", async () => {
  const g = await call("GET", "/orgs/ACME01");
  assert.equal(g.status, 200);
  assert.equal(g.body.readonly, true);
  assert.match(g.body.name, /ACME/);
  const l = await call("GET", "/orgs/ACME01/decisions");
  assert.ok(l.body.decisions.length >= 7 && l.body.decisions.length <= 9);
  const lideres = new Set(l.body.decisions.map((d) => d.leaderName));
  assert.ok(lideres.has("Marta"));
  const hoy = new Date().toISOString().slice(0, 10);
  const estado = l.body.decisions.map((d) => ({ d, venc: d.current !== d.desired && d.targetDate < hoy }));
  assert.ok(estado.some((x) => x.venc && x.d.desired > x.d.current), "falta una vencida");
  assert.ok(l.body.decisions.some((d) => d.desired < d.current && d.targetDate >= hoy), "falta una recentralizando");
  assert.ok(l.body.decisions.some((d) => d.current === d.desired), "falta una ya delegada");
});

test("Dado ACME01, cuando se intenta crear, editar o borrar, entonces la API responde 403 y no cambia nada", async () => {
  const antes = (await call("GET", "/orgs/ACME01/decisions")).body.decisions;
  assert.equal((await call("POST", "/orgs/ACME01/decisions", decision())).status, 403);
  assert.equal((await call("PUT", "/orgs/ACME01/decisions/" + antes[0].id, decision({ title: "hack" }))).status, 403);
  assert.equal((await call("DELETE", "/orgs/ACME01/decisions/" + antes[0].id)).status, 403);
  assert.equal((await call("DELETE", "/orgs/ACME01")).status, 403);
  assert.equal((await call("POST", "/orgs", { name: "Copia", code: "ACME01" })).status, 409);
  const despues = (await call("GET", "/orgs/ACME01/decisions")).body.decisions;
  assert.equal(despues.length, antes.length);
  assert.equal(despues[0].title, antes[0].title);
});

test("Dado que ACME01 reemplaza al ejemplo anterior, cuando se consulta DEMO42, entonces ya no existe", async () => {
  assert.equal((await call("GET", "/orgs/DEMO42")).status, 404);
});

test("Dado el ejemplo, cuando se crean organizaciones, entonces ACME01 no cuenta para el tope por hora", async () => {
  const c = await nuevaOrg("Cuenta");
  assert.ok(c);
});

test("Dado un tope de decisiones, cuando se pasa, entonces responde 429 (se prueba solo en local)", { skip: !/localhost|127\.0\.0\.1/.test(BASE) }, async () => {
  const code = await nuevaOrg("Tope");
  const lote = [];
  for (let i = 0; i < 500; i++) lote.push(call("POST", "/orgs/" + code + "/decisions", decision({ title: "d" + i })));
  const rs = await Promise.all(lote);
  assert.ok(rs.filter((r) => r.status === 201).length <= 500);
  const extra = await call("POST", "/orgs/" + code + "/decisions", decision());
  assert.equal(extra.status, 429);
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
  const r = await fetch(BASE + "/api/orgs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
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
  const g = await fetch(BASE + "/api/orgs/ACME01"); assert.equal(g.status, 200);
});
