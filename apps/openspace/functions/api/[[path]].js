// API de OpenSpace / Mercado de temas sobre Cloudflare D1. Sin cuentas: el código del evento es la llave.
// Quien propone una sesión recibe un token secreto para moverla y registrarla; el facilitador recibe el suyo al crear el evento.
const CODE_RE = /^[A-Z0-9]{6}$/;
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TIPOS = ["", "pregunta", "ayuda", "funciono"];
const ESTADOS = ["propuesta", "abierta", "cerrada"];
const MAX_EVENTOS_PER_HOUR = 40, MAX_SESIONES = 300, MAX_CELDAS = 24;

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const bad = (msg, status = 400) => json({ error: msg }, status);
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
const rand = (n, alpha = ALPHA) => { const b = new Uint8Array(n); crypto.getRandomValues(b); return [...b].map((x) => alpha[x % alpha.length]).join(""); };
const token = () => rand(24, ALPHA + ALPHA.toLowerCase());
const lista = (v, maxItems, maxLen) => (Array.isArray(v) ? v : []).map((x) => clean(x, maxLen)).filter(Boolean).slice(0, maxItems);

async function igual(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", enc.encode(String(s)))));
  const va = new Uint8Array(x), vb = new Uint8Array(y);
  let d = 0; for (let i = 0; i < va.length; i++) d |= va[i] ^ vb[i];
  return d === 0;
}
async function claveOk(request, env) {
  if (!env.APP_ADMIN_CLAVE) return false;
  const ok = await igual(request.headers.get("x-admin-clave") || "", env.APP_ADMIN_CLAVE);
  if (!ok) await new Promise((r) => setTimeout(r, 600)); // freno básico a la fuerza bruta
  return ok;
}
const publico = (s) => ({ id: s.id, titulo: s.titulo, autor: s.autor, tipo: s.tipo, lugar: s.lugar, hora: s.hora, interes: s.interes, estado: s.estado, notas: s.notas, decisiones: s.decisiones, proximo_paso: s.proximo_paso, at: s.at });

export async function onRequest({ request, env, params }) {
  const db = env.DB;
  if (!db) return bad("Falta la base de datos", 500);
  const parts = [].concat(params.path || []);
  const method = request.method;

  // Modo admin (solo con la clave): GET /api/admin/eventos · DELETE /api/admin/eventos/:code
  if (parts[0] === "admin") {
    if (!(await claveOk(request, env))) return bad("Clave incorrecta", 403);
    if (parts[1] !== "eventos") return bad("No encontrado", 404);
    if (parts.length === 2 && method === "GET") {
      const { results } = await db.prepare("SELECT code, name, created_at, demo AS example FROM eventos ORDER BY created_at DESC").all();
      return json({ eventos: results.map((b) => ({ ...b, example: b.example === 1 })) });
    }
    if (parts.length === 3 && method === "DELETE") {
      const c = String(parts[2]).toUpperCase();
      const b = await db.prepare("SELECT demo AS example FROM eventos WHERE code = ?").bind(c).first();
      if (!b) return bad("No existe ese evento", 404);
      if (b.example === 1) return bad("El ejemplo no se borra desde acá.", 403);
      await db.batch([db.prepare("DELETE FROM sesiones WHERE code = ?").bind(c), db.prepare("DELETE FROM eventos WHERE code = ?").bind(c)]);
      return json({ ok: true });
    }
    return bad("Método no permitido", 405);
  }

  let body = {};
  if (method === "POST" || method === "PATCH") {
    try { body = await request.json(); } catch { body = {}; }
  }

  // POST /api/eventos { name, pregunta, lugares[], horarios[], code? }
  if (parts[0] === "eventos" && parts.length === 1 && method === "POST") {
    const name = clean(body.name, 80);
    if (name.length < 2) return bad("Escribí el nombre del evento (mínimo 2 letras).");
    const lugares = lista(body.lugares, 8, 40), horarios = lista(body.horarios, 8, 40);
    if (!lugares.length) return bad("Agregá al menos un lugar.");
    if (!horarios.length) return bad("Agregá al menos un horario.");
    if (lugares.length * horarios.length > MAX_CELDAS) return bad("Demasiadas celdas (máximo " + MAX_CELDAS + ").");
    let code = String(body.code || "").toUpperCase();
    const taken = await db.prepare("SELECT demo FROM eventos WHERE code = ?").bind(code).first();
    if (taken && taken.demo) return bad("Ese ejemplo es de solo lectura.", 403);
    const since = new Date(Date.now() - 3600e3).toISOString();
    const recent = await db.prepare("SELECT COUNT(*) AS n FROM eventos WHERE demo = 0 AND created_at > ?").bind(since).first();
    if (recent && recent.n >= MAX_EVENTOS_PER_HOUR) return bad("Se crearon muchos eventos seguidos. Probá de nuevo en un rato.", 429);
    if (!CODE_RE.test(code)) code = rand(6);
    const facilitador = token();
    const r = await db.prepare("INSERT OR IGNORE INTO eventos (code, name, pregunta, lugares, horarios, facilitador, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(code, name, clean(body.pregunta, 300), JSON.stringify(lugares), JSON.stringify(horarios), facilitador, new Date().toISOString()).run();
    if (r.meta.changes !== 1) return bad("Ese código ya existe", 409);
    return json({ code, name, facilitador }, 201);
  }

  const code = String(parts[1] || "").toUpperCase();
  if (parts[0] !== "eventos" || !CODE_RE.test(code)) return bad("No encontrado", 404);
  const ev = await db.prepare("SELECT code, name, pregunta, lugares, horarios, facilitador, demo FROM eventos WHERE code = ?").bind(code).first();
  if (!ev) return bad("No existe ese evento", 404);
  const evento = { code: ev.code, name: ev.name, pregunta: ev.pregunta, lugares: JSON.parse(ev.lugares), horarios: JSON.parse(ev.horarios), demo: ev.demo === 1 };
  if (ev.demo && method !== "GET") return bad("Ejemplo ficticio de ACME: es de solo lectura.", 403);

  // GET /api/eventos/:code/state
  if (parts[2] === "state" && parts.length === 3 && method === "GET") {
    const { results } = await db.prepare("SELECT * FROM sesiones WHERE code = ? ORDER BY at, id").bind(code).all();
    return json({ evento, sesiones: results.map(publico) });
  }
  if (parts[2] !== "sesiones") return bad("No encontrado", 404);

  const esFacilitador = async () => {
    const f = request.headers.get("x-facilitador");
    return (f && (await igual(f, ev.facilitador))) || (await claveOk(request, env));
  };
  const celdaValida = (lugar, hora) => Number.isInteger(lugar) && Number.isInteger(hora) && lugar >= 0 && hora >= 0 && lugar < evento.lugares.length && hora < evento.horarios.length;

  // POST /api/eventos/:code/sesiones { titulo, autor, tipo?, lugar, hora }
  if (parts.length === 3 && method === "POST") {
    const titulo = clean(body.titulo, 120), autor = clean(body.autor, 60), tipo = String(body.tipo || "");
    if (!titulo) return bad("Escribí el título de tu sesión.");
    if (!autor) return bad("Escribí tu nombre.");
    if (!TIPOS.includes(tipo)) return bad("Tipo inválido");
    const lugar = Number(body.lugar), hora = Number(body.hora);
    if (!celdaValida(lugar, hora)) return bad("Esa celda no existe.");
    const c = await db.prepare("SELECT COUNT(*) AS n FROM sesiones WHERE code = ?").bind(code).first();
    if (c && c.n >= MAX_SESIONES) return bad("Este evento llegó al máximo de sesiones.", 429);
    const id = rand(9), tk = token(), at = new Date().toISOString();
    const r = await db.prepare("INSERT OR IGNORE INTO sesiones (id, code, titulo, autor, tipo, lugar, hora, interes, token, estado, at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'propuesta', ?)")
      .bind(id, code, titulo, autor, tipo, lugar, hora, tk, at).run();
    if (r.meta.changes !== 1) return bad("Esa celda ya está ocupada. Elegí otra.", 409);
    return json({ id, titulo, autor, tipo, lugar, hora, interes: 0, estado: "propuesta", token: tk, at }, 201);
  }

  const id = String(parts[3] || "").toUpperCase();
  const s = parts.length >= 4 ? await db.prepare("SELECT * FROM sesiones WHERE id = ? AND code = ?").bind(id, code).first() : null;
  if (!s) return bad("No existe esa sesión", 404);
  // Quien convoca (token de la tarjeta) o el facilitador
  const puede = async () => {
    const t = request.headers.get("x-token");
    return (t && (await igual(t, s.token))) || (await esFacilitador());
  };

  // POST /api/eventos/:code/sesiones/:id/interes { delta }  (solo cuenta, sin nombres, sin tope por persona)
  if (parts[4] === "interes" && parts.length === 5 && method === "POST") {
    const delta = Number(body.delta) === -1 ? -1 : 1;
    await db.prepare("UPDATE sesiones SET interes = MAX(0, interes + ?) WHERE id = ? AND code = ?").bind(delta, id, code).run();
    return json({ ok: true });
  }
  // PATCH /api/eventos/:code/sesiones/:id/registro { estado?, notas?, decisiones?, proximo_paso? }
  if (parts[4] === "registro" && parts.length === 5 && method === "PATCH") {
    if (!(await puede())) return bad("Solo quien convoca la sesión o el facilitador puede registrar.", 403);
    const sets = [], vals = [];
    if (body.estado !== undefined) { if (!ESTADOS.includes(body.estado)) return bad("Estado inválido"); sets.push("estado = ?"); vals.push(body.estado); }
    for (const [k, max] of [["notas", 4000], ["decisiones", 2000], ["proximo_paso", 1000]]) if (body[k] !== undefined) { sets.push(k + " = ?"); vals.push(clean(body[k], max)); }
    if (!sets.length) return bad("Nada para guardar");
    await db.prepare(`UPDATE sesiones SET ${sets.join(", ")} WHERE id = ? AND code = ?`).bind(...vals, id, code).run();
    return json({ ok: true });
  }
  if (parts.length === 4) {
    // PATCH /api/eventos/:code/sesiones/:id { lugar, hora }  (mover la tarjeta; también titulo)
    if (method === "PATCH") {
      if (!(await puede())) return bad("Solo podés mover tu propia tarjeta.", 403);
      const lugar = body.lugar === undefined ? s.lugar : Number(body.lugar), hora = body.hora === undefined ? s.hora : Number(body.hora);
      if (!celdaValida(lugar, hora)) return bad("Esa celda no existe.");
      const titulo = body.titulo === undefined ? s.titulo : clean(body.titulo, 120);
      if (!titulo) return bad("El título está vacío");
      try { await db.prepare("UPDATE sesiones SET lugar = ?, hora = ?, titulo = ? WHERE id = ? AND code = ?").bind(lugar, hora, titulo, id, code).run(); }
      catch { return bad("Esa celda ya está ocupada. Elegí otra.", 409); }
      return json({ ok: true });
    }
    // DELETE /api/eventos/:code/sesiones/:id
    if (method === "DELETE") {
      if (!(await puede())) return bad("Solo quien convoca la sesión o el facilitador puede borrarla.", 403);
      await db.prepare("DELETE FROM sesiones WHERE id = ? AND code = ?").bind(id, code).run();
      return json({ ok: true });
    }
  }
  return bad("Método no permitido", 405);
}
