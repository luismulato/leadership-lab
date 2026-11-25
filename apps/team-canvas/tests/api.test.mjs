// Pruebas de la API del Team Canvas. Uso: BASE=http://localhost:8814 node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = (process.env.BASE || "http://localhost:8815/team-canvas").replace(/\/$/, "");
const SECS = ["proposito", "objetivos", "iniciativas", "personas", "capacidades", "principios", "acuerdos", "bienestar", "aprendizaje"];
const NOMBRE = "Test automatico " + Date.now();

async function call(method, path, body) {
  const r = await fetch(BASE + "/api" + path, { method, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

let code, noteId;

test("Dado un nombre válido, cuando se crea un canvas, entonces responde 201 con un código de 6 caracteres", async () => {
  const r = await call("POST", "/canvases", { name: NOMBRE });
  assert.equal(r.status, 201);
  assert.match(r.body.code, /^[A-Z0-9]{6}$/);
  code = r.body.code;
  const g = await call("GET", "/canvases/" + code);
  assert.equal(g.status, 200);
  assert.equal(g.body.name, NOMBRE);
});

test("Dado un nombre demasiado corto, cuando se crea, entonces responde 400", async () => {
  assert.equal((await call("POST", "/canvases", { name: "a" })).status, 400);
});

test("Dado un código que ya existe, cuando se crea otro canvas con ese código, entonces responde 409", async () => {
  const r = await call("POST", "/canvases", { name: NOMBRE + " bis", code });
  assert.equal(r.status, 409);
});

test("Dado un canvas, cuando se agrega una idea, entonces queda listada", async () => {
  const r = await call("POST", `/canvases/${code}/notes`, { sec: "proposito", text: "Una idea de prueba" });
  assert.equal(r.status, 201);
  noteId = r.body.id;
  const l = await call("GET", `/canvases/${code}/notes`);
  assert.ok(l.body.notes.some((n) => n.id === noteId && n.text === "Una idea de prueba"));
});

test("Dado una sección inválida, cuando se agrega una idea, entonces responde 400", async () => {
  assert.equal((await call("POST", `/canvases/${code}/notes`, { sec: "otra", text: "x" })).status, 400);
});

test("Dado una idea, cuando se edita, entonces el texto cambia", async () => {
  assert.equal((await call("PATCH", `/canvases/${code}/notes/${noteId}`, { text: "Texto nuevo" })).status, 200);
  const l = await call("GET", `/canvases/${code}/notes`);
  assert.equal(l.body.notes.find((n) => n.id === noteId).text, "Texto nuevo");
});

test("Dado una idea, cuando se borra, entonces ya no aparece", async () => {
  assert.equal((await call("DELETE", `/canvases/${code}/notes/${noteId}`)).status, 200);
  const l = await call("GET", `/canvases/${code}/notes`);
  assert.ok(!l.body.notes.some((n) => n.id === noteId));
});

test("Dado un código inexistente, cuando se consulta, entonces responde 404", async () => {
  assert.equal((await call("GET", "/canvases/ZZZZZ9")).status, 404);
  assert.equal((await call("GET", "/canvases/ZZZZZ9/notes")).status, 404);
});

test("Dado ACME01, cuando se consulta, entonces existe, se llama Experiencia Cliente de ACME y está marcado como ejemplo", async () => {
  const r = await call("GET", "/canvases/ACME01");
  assert.equal(r.status, 200);
  assert.equal(r.body.name, "Experiencia Cliente de ACME");
  assert.equal(r.body.locked, true);
});

test("Dado ACME01, cuando se piden las ideas, entonces hay ideas en las nueve secciones (1 o 2 de propósito y de 3 a 5 en el resto)", async () => {
  const l = await call("GET", "/canvases/ACME01/notes");
  assert.equal(l.status, 200);
  for (const s of SECS) {
    const n = l.body.notes.filter((x) => x.sec === s).length;
    assert.ok(s === "proposito" ? n >= 1 && n <= 2 : n >= 3 && n <= 5, `${s} tiene ${n} ideas`);
  }
});

test("Dado ACME01, cuando se leen las ideas de personas, entonces están los 8 nombres", async () => {
  const l = await call("GET", "/canvases/ACME01/notes");
  const txt = l.body.notes.filter((x) => x.sec === "personas").map((x) => x.text).join(" ");
  for (const n of ["Marta", "Diego", "Lucía", "Tomás", "Valeria", "Joaquín", "Camila", "Nico"]) assert.ok(txt.includes(n), n);
});

test("Dado ACME01, cuando se intenta agregar una idea, entonces responde 403", async () => {
  assert.equal((await call("POST", "/canvases/ACME01/notes", { sec: "proposito", text: "intruso" })).status, 403);
});

test("Dado ACME01, cuando se intenta editar una idea, entonces responde 403", async () => {
  const l = await call("GET", "/canvases/ACME01/notes");
  assert.equal((await call("PATCH", `/canvases/ACME01/notes/${l.body.notes[0].id}`, { text: "intruso" })).status, 403);
});

test("Dado ACME01, cuando se intenta borrar una idea, entonces responde 403 y la idea sigue", async () => {
  const l = await call("GET", "/canvases/ACME01/notes");
  const id = l.body.notes[0].id;
  assert.equal((await call("DELETE", `/canvases/ACME01/notes/${id}`)).status, 403);
  const l2 = await call("GET", "/canvases/ACME01/notes");
  assert.equal(l2.body.notes.length, l.body.notes.length);
});

test("Dado ACME01, cuando se intenta borrar el canvas, entonces responde 403", async () => {
  assert.equal((await call("DELETE", "/canvases/ACME01")).status, 403);
  assert.equal((await call("GET", "/canvases/ACME01")).status, 200);
});

test("Dado ACME01, cuando se intenta crear un canvas con ese código, entonces responde 403", async () => {
  assert.equal((await call("POST", "/canvases", { name: "Falso ACME", code: "ACME01" })).status, 403);
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
  const r = await fetch(BASE + "/api/canvases", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
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
  const g = await fetch(BASE + "/api/canvases/ACME01"); assert.equal(g.status, 200);
});
