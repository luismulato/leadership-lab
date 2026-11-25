// Pruebas de la API de OpenSpace / Mercado de temas. Uso: node --test tests/   (BASE por defecto: local)
import test, { after } from "node:test";
import assert from "node:assert/strict";
const BASE = (process.env.BASE || "http://localhost:8815/openspace").replace(/\/$/, "");
const made = [];
const call = async (method, path, body, headers = {}) => {
  const r = await fetch(BASE + "/api" + path, { method, headers: { "content-type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => { let c = "ZT"; for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)]; return c; };
const EV = { name: "Evento test", pregunta: "¿Cómo lidero hoy?", lugares: ["Sala 1", "Sala 2"], horarios: ["10:00", "11:00"] };
const mkEvento = async (extra = {}) => { const code = newCode(); const r = await call("POST", "/eventos", { ...EV, code, ...extra }); made.push(code); return { code, fac: r.json.facilitador, r }; };
const mkSesion = async (code, extra = {}) => call("POST", `/eventos/${code}/sesiones`, { titulo: "Cómo delegar", autor: "Ana", lugar: 0, hora: 0, ...extra });
const state = async (code) => (await call("GET", `/eventos/${code}/state`)).json;
after(async () => { const h = { "x-admin-clave": process.env.ADMIN_CLAVE || "clave-de-prueba-local" }; for (const c of made) await call("DELETE", `/admin/eventos/${c}`, null, h); if (made.length) console.log("# eventos de prueba creados y borrados:", made.length); });

test("Dado un facilitador, cuando crea un evento con pregunta, lugares y horarios, entonces recibe código y token y entra a la agenda vacía", async () => {
  const { code, r } = await mkEvento();
  assert.equal(r.status, 201); assert.match(r.json.code, /^[A-Z0-9]{6}$/); assert.ok(r.json.facilitador && r.json.facilitador.length >= 16);
  const s = await state(code);
  assert.equal(s.evento.pregunta, "¿Cómo lidero hoy?"); assert.deepEqual(s.evento.lugares, ["Sala 1", "Sala 2"]); assert.deepEqual(s.evento.horarios, ["10:00", "11:00"]); assert.equal(s.sesiones.length, 0);
  assert.equal(s.evento.facilitador, undefined);
});
test("Dado un evento sin nombre, sin lugares o sin horarios, cuando se crea, entonces se rechaza", async () => {
  assert.equal((await call("POST", "/eventos", { ...EV, name: "" })).status, 400);
  assert.equal((await call("POST", "/eventos", { ...EV, lugares: [] })).status, 400);
  assert.equal((await call("POST", "/eventos", { ...EV, horarios: [] })).status, 400);
});
test("Dado un código repetido, cuando se crea otro evento, entonces responde 409", async () => {
  const { code } = await mkEvento();
  assert.equal((await call("POST", "/eventos", { ...EV, code })).status, 409);
});
test("Dada una persona con nombre, cuando propone una sesión en una celda libre, entonces queda pegada y la ven todas", async () => {
  const { code } = await mkEvento();
  const r = await mkSesion(code, { tipo: "ayuda" });
  assert.equal(r.status, 201); assert.ok(r.json.token); assert.equal(r.json.interes, 0);
  const s = await state(code);
  assert.equal(s.sesiones.length, 1); assert.equal(s.sesiones[0].titulo, "Cómo delegar"); assert.equal(s.sesiones[0].autor, "Ana"); assert.equal(s.sesiones[0].tipo, "ayuda");
  assert.equal(s.sesiones[0].token, undefined);
});
test("Dada una sesión sin título, sin nombre o con celda inexistente, cuando se propone, entonces se rechaza", async () => {
  const { code } = await mkEvento();
  assert.equal((await mkSesion(code, { titulo: " " })).status, 400);
  assert.equal((await mkSesion(code, { autor: "" })).status, 400);
  assert.equal((await mkSesion(code, { lugar: 5 })).status, 400);
  assert.equal((await mkSesion(code, { hora: -1 })).status, 400);
  assert.equal((await mkSesion(code, { tipo: "otra" })).status, 400);
});
test("Dada una celda ocupada, cuando alguien intenta pegar otra tarjeta, entonces responde 409", async () => {
  const { code } = await mkEvento();
  assert.equal((await mkSesion(code)).status, 201);
  const r = await mkSesion(code, { titulo: "Otra", autor: "Beto" });
  assert.equal(r.status, 409);
  assert.equal((await state(code)).sesiones.length, 1);
});
test("Dada una tarjeta, cuando se toca me interesa, entonces el contador sube sin mostrar quién y no baja de 0; sin tope por persona", async () => {
  const { code } = await mkEvento();
  const id = (await mkSesion(code)).json.id;
  for (let i = 0; i < 3; i++) assert.equal((await call("POST", `/eventos/${code}/sesiones/${id}/interes`, { delta: 1 })).status, 200);
  let s = (await state(code)).sesiones[0]; assert.equal(s.interes, 3); assert.equal(s.interesados, undefined);
  for (let i = 0; i < 5; i++) await call("POST", `/eventos/${code}/sesiones/${id}/interes`, { delta: -1 });
  s = (await state(code)).sesiones[0]; assert.equal(s.interes, 0);
});
test("Dada una persona, cuando mueve su propia tarjeta a una celda libre, entonces se mueve", async () => {
  const { code } = await mkEvento();
  const m = (await mkSesion(code)).json;
  const r = await call("PATCH", `/eventos/${code}/sesiones/${m.id}`, { lugar: 1, hora: 1 }, { "x-token": m.token });
  assert.equal(r.status, 200);
  const s = (await state(code)).sesiones[0]; assert.equal(s.lugar, 1); assert.equal(s.hora, 1);
});
test("Dada la tarjeta de otra persona, cuando se intenta moverla sin su token, entonces responde 403 y no se mueve", async () => {
  const { code } = await mkEvento();
  const m = (await mkSesion(code)).json;
  assert.equal((await call("PATCH", `/eventos/${code}/sesiones/${m.id}`, { lugar: 1, hora: 1 })).status, 403);
  assert.equal((await call("PATCH", `/eventos/${code}/sesiones/${m.id}`, { lugar: 1, hora: 1 }, { "x-token": "otro-token" })).status, 403);
  const s = (await state(code)).sesiones[0]; assert.equal(s.lugar, 0); assert.equal(s.hora, 0);
});
test("Dado el facilitador con su token, cuando mueve la tarjeta de cualquiera, entonces se mueve; un token de otro evento no sirve", async () => {
  const { code, fac } = await mkEvento(); const otro = await mkEvento();
  const m = (await mkSesion(code)).json;
  assert.equal((await call("PATCH", `/eventos/${code}/sesiones/${m.id}`, { lugar: 1, hora: 0 }, { "x-facilitador": otro.fac })).status, 403);
  assert.equal((await call("PATCH", `/eventos/${code}/sesiones/${m.id}`, { lugar: 1, hora: 0 }, { "x-facilitador": fac })).status, 200);
  assert.equal((await state(code)).sesiones[0].lugar, 1);
});
test("Dado un movimiento a una celda ocupada, entonces responde 409", async () => {
  const { code } = await mkEvento();
  const a = (await mkSesion(code)).json; await mkSesion(code, { titulo: "B", autor: "Beto", lugar: 1, hora: 0 });
  assert.equal((await call("PATCH", `/eventos/${code}/sesiones/${a.id}`, { lugar: 1, hora: 0 }, { "x-token": a.token })).status, 409);
});
test("Dada una sesión, cuando quien convoca la abre, registra lo conversado y la cierra, entonces los demás lo leen", async () => {
  const { code } = await mkEvento();
  const m = (await mkSesion(code)).json; const h = { "x-token": m.token };
  assert.equal((await state(code)).sesiones[0].estado, "propuesta");
  assert.equal((await call("PATCH", `/eventos/${code}/sesiones/${m.id}/registro`, { estado: "abierta" }, h)).status, 200);
  assert.equal((await call("PATCH", `/eventos/${code}/sesiones/${m.id}/registro`, { notas: "Hablamos de delegar", decisiones: "Probar delegation poker", proximo_paso: "Agendar taller" }, h)).status, 200);
  assert.equal((await call("PATCH", `/eventos/${code}/sesiones/${m.id}/registro`, { estado: "cerrada" }, h)).status, 200);
  const s = (await state(code)).sesiones[0];
  assert.equal(s.estado, "cerrada"); assert.equal(s.notas, "Hablamos de delegar"); assert.equal(s.decisiones, "Probar delegation poker"); assert.equal(s.proximo_paso, "Agendar taller");
});
test("Dado el registro de una sesión ajena, cuando se intenta escribir sin ser quien convoca ni el facilitador, entonces responde 403; estado inválido responde 400", async () => {
  const { code } = await mkEvento();
  const m = (await mkSesion(code)).json;
  assert.equal((await call("PATCH", `/eventos/${code}/sesiones/${m.id}/registro`, { notas: "x" })).status, 403);
  assert.equal((await call("PATCH", `/eventos/${code}/sesiones/${m.id}/registro`, { estado: "rara" }, { "x-token": m.token })).status, 400);
});
test("Dada una sesión, cuando quien convoca la borra, entonces la celda queda libre; otra persona no puede", async () => {
  const { code } = await mkEvento();
  const m = (await mkSesion(code)).json;
  assert.equal((await call("DELETE", `/eventos/${code}/sesiones/${m.id}`)).status, 403);
  assert.equal((await call("DELETE", `/eventos/${code}/sesiones/${m.id}`, null, { "x-token": m.token })).status, 200);
  assert.equal((await state(code)).sesiones.length, 0);
  assert.equal((await mkSesion(code)).status, 201);
});
test("Dado un código inexistente o mal formado, cuando se consulta, entonces responde 404 sin romper", async () => {
  assert.equal((await call("GET", "/eventos/QQQQQQ/state")).status, 404);
  assert.equal((await call("GET", "/eventos/xx/state")).status, 404);
});
test("Dado el ejemplo ACME01, cuando se abre, entonces trae sesiones y cualquier escritura responde 403", async () => {
  const s = await state("ACME01");
  assert.equal(s.evento.demo, true); assert.ok(s.sesiones.length >= 6);
  assert.ok(s.sesiones.some((x) => x.estado === "cerrada" && x.notas)); assert.ok(s.sesiones.some((x) => x.interes > 0));
  assert.equal((await mkSesion("ACME01", { lugar: 1, hora: 1 })).status, 403);
  assert.equal((await call("POST", `/eventos/ACME01/sesiones/${s.sesiones[0].id}/interes`, { delta: 1 })).status, 403);
  assert.equal((await call("PATCH", `/eventos/ACME01/sesiones/${s.sesiones[0].id}`, { lugar: 0, hora: 0 }, { "x-facilitador": "x" })).status, 403);
  assert.equal((await call("POST", "/eventos", { ...EV, code: "ACME01" })).status, 403);
});
test("Dado el admin, sin clave o con clave mala responde 403; con clave lista eventos, borra uno común y no borra el ejemplo", async () => {
  const clave = process.env.ADMIN_CLAVE || "clave-de-prueba-local";
  assert.equal((await call("GET", "/admin/eventos")).status, 403);
  assert.equal((await call("GET", "/admin/eventos", null, { "x-admin-clave": "mala" })).status, 403);
  const { code } = await mkEvento(); await mkSesion(code);
  const l = await call("GET", "/admin/eventos", null, { "x-admin-clave": clave });
  assert.equal(l.status, 200); assert.ok(l.json.eventos.some((e) => e.code === code)); assert.equal(l.json.eventos.find((e) => e.code === "ACME01").example, true);
  assert.equal((await call("DELETE", "/admin/eventos/ACME01", null, { "x-admin-clave": clave })).status, 403);
  assert.equal((await call("DELETE", `/admin/eventos/${code}`, null, { "x-admin-clave": clave })).status, 200);
  assert.equal((await call("GET", `/eventos/${code}/state`)).status, 404);
});
test("Dada la portada y el admin, cuando se piden, entonces se sirven", async () => {
  assert.equal((await fetch(BASE + "/")).status, 200);
  assert.equal((await fetch(BASE + "/admin/")).status, 200);
});
