// API de Delegation Poker sobre Cloudflare D1. Sin cuentas: el código de la organización es la llave.
const CODE_RE = /^[A-Z0-9]{4,8}$/;
const ID_RE = /^[A-Z0-9]{9}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EJEMPLO = "ACME01";
const DEMO_BASE = Date.UTC(2026, 10, 4);
const MAX_DECISIONS = 500;
const MAX_ORGS_PER_HOUR = 40;
const MAX_BODY = 4000;

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const bad = (msg, status = 400) => json({ error: msg }, status);
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
const rand = (n) => { const b = new Uint8Array(n); crypto.getRandomValues(b); return [...b].map((x) => ALPHA[x % ALPHA.length]).join(""); };

function validDate(s) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}
// Devuelve la decisión limpia (solo campos conocidos) o un texto de error.
function parseDecision(b) {
  const o = {
    title: clean(b.title, 120), area: clean(b.area, 60), team: clean(b.team, 60),
    leaderName: clean(b.leaderName, 80), leaderRole: clean(b.leaderRole, 80),
    current: b.current, desired: b.desired,
    startDate: String(b.startDate || ""), targetDate: String(b.targetDate || ""), note: clean(b.note, 400)
  };
  if (!o.title) return "Escribí qué decisión es.";
  if (!o.leaderName) return "Indicá la persona con autoridad.";
  for (const k of ["current", "desired"]) if (!Number.isInteger(o[k]) || o[k] < 1 || o[k] > 7) return "El nivel debe ser un número del 1 al 7.";
  if (!validDate(o.targetDate)) return "La fecha objetivo no es válida.";
  if (!validDate(o.startDate)) o.startDate = o.targetDate;
  return o;
}
// El ejemplo guarda fechas respecto de un día base y las corre al día de hoy, para que siempre tenga una vencida.
function shift(iso, days) { return new Date(Date.parse(iso + "T00:00:00Z") + days * 86400000).toISOString().slice(0, 10); }

async function claveOk(request, env) {
  if (!env.APP_ADMIN_CLAVE) return false;
  const enc = new TextEncoder(), dato = request.headers.get("x-admin-clave") || "";
  const [a, b] = await Promise.all([dato, env.APP_ADMIN_CLAVE].map((x) => crypto.subtle.digest("SHA-256", enc.encode(x))));
  const va = new Uint8Array(a), vb = new Uint8Array(b);
  let d = 0; for (let i = 0; i < va.length; i++) d |= va[i] ^ vb[i];
  if (d !== 0) await new Promise((r) => setTimeout(r, 600)); // freno básico a la fuerza bruta
  return d === 0;
}

export async function onRequest({ request, env, params }) {
  const db = env.DB;
  if (!db) return bad("Falta la base de datos", 500);
  const parts = [].concat(params.path || []);
  const method = request.method;
  // Modo admin (solo con la clave): GET /api/admin/boards · DELETE /api/admin/boards/:code
  if (parts[0] === "admin") {
    if (!(await claveOk(request, env))) return bad("Clave incorrecta", 403);
    if (parts[1] !== "boards") return bad("No encontrado", 404);
    if (parts.length === 2 && method === "GET") {
      const { results } = await db.prepare("SELECT code, name, created_at, readonly AS example FROM orgs ORDER BY created_at DESC").all();
      return json({ boards: results.map((b) => ({ ...b, example: b.example === 1 })) });
    }
    if (parts.length === 3 && method === "DELETE") {
      const c = String(parts[2]).toUpperCase();
      const b = await db.prepare("SELECT readonly AS example FROM orgs WHERE code = ?").bind(c).first();
      if (!b) return bad("No existe ese equipo", 404);
      if (b.example === 1) return bad("El ejemplo no se borra desde acá.", 403);
      await db.batch([db.prepare("DELETE FROM decisions WHERE code = ?").bind(c), db.prepare("DELETE FROM orgs WHERE code = ?").bind(c)]);
      return json({ ok: true });
    }
    return bad("Método no permitido", 405);
  }
  let body = {};
  if (method === "POST" || method === "PUT") {
    const text = await request.text();
    if (text.length > MAX_BODY) return bad("El contenido es demasiado grande.", 413);
    try { body = JSON.parse(text); } catch { return bad("Cuerpo inválido"); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return bad("Cuerpo inválido");
  }
  if (parts[0] !== "orgs") return bad("No encontrado", 404);

  // POST /api/orgs
  if (parts.length === 1 && method === "POST") {
    const name = clean(body.name, 60);
    if (name.length < 2) return bad("Escribí el nombre de la organización (mínimo 2 letras).");
    const since = new Date(Date.now() - 3600e3).toISOString();
    const recent = await db.prepare("SELECT COUNT(*) AS n FROM orgs WHERE created_at > ? AND readonly = 0").bind(since).first();
    if (recent && recent.n >= MAX_ORGS_PER_HOUR) return bad("Se crearon muchas organizaciones seguidas. Probá de nuevo en un rato.", 429);
    let code = String(body.code || "").toUpperCase();
    if (code === EJEMPLO) return bad("Ese código ya existe", 409);
    if (!/^[A-Z0-9]{6}$/.test(code)) code = rand(6);
    const r = await db.prepare("INSERT OR IGNORE INTO orgs (code, name, readonly, created_at) VALUES (?, ?, 0, ?)").bind(code, name, new Date().toISOString()).run();
    if (r.meta.changes !== 1) return bad("Ese código ya existe", 409);
    return json({ code, name }, 201);
  }

  const code = String(parts[1] || "").toUpperCase();
  if (!CODE_RE.test(code)) return bad("No encontrado", 404);
  const org = await db.prepare("SELECT code, name, readonly FROM orgs WHERE code = ?").bind(code).first();
  const readonly = !!(org && org.readonly);

  // GET /api/orgs/:code
  if (parts.length === 2 && method === "GET") return org ? json({ code: org.code, name: org.name, readonly }) : bad("No existe esa organización", 404);
  if (!org) return bad("No existe esa organización", 404);
  if (parts.length === 2 && method === "DELETE") {
    if (readonly) return bad("El ejemplo de ACME es de solo lectura.", 403);
    await db.batch([db.prepare("DELETE FROM decisions WHERE code = ?").bind(code), db.prepare("DELETE FROM orgs WHERE code = ?").bind(code)]);
    return json({ ok: true });
  }
  if (parts[2] !== "decisions") return bad("No encontrado", 404);

  // GET /api/orgs/:code/decisions
  if (parts.length === 3 && method === "GET") {
    const { results } = await db.prepare("SELECT id, data FROM decisions WHERE code = ? ORDER BY at, id").bind(code).all();
    const days = readonly ? Math.round((Date.now() - DEMO_BASE) / 86400000) : 0;
    const decisions = results.map((r) => {
      const d = JSON.parse(r.data);
      if (days) { d.startDate = shift(d.startDate, days); d.targetDate = shift(d.targetDate, days); }
      d.id = r.id;
      return d;
    });
    return json({ decisions });
  }
  if (readonly && method !== "GET") return bad("El ejemplo de ACME es de solo lectura.", 403);

  // POST /api/orgs/:code/decisions
  if (parts.length === 3 && method === "POST") {
    const d = parseDecision(body);
    if (typeof d === "string") return bad(d);
    const c = await db.prepare("SELECT COUNT(*) AS n FROM decisions WHERE code = ?").bind(code).first();
    if (c && c.n >= MAX_DECISIONS) return bad("Esta organización llegó al máximo de decisiones.", 429);
    const id = rand(9);
    await db.prepare("INSERT INTO decisions (id, code, data, at) VALUES (?, ?, ?, ?)").bind(id, code, JSON.stringify(d), new Date().toISOString()).run();
    return json({ id }, 201);
  }
  // PUT / DELETE /api/orgs/:code/decisions/:id
  if (parts.length === 4) {
    const id = String(parts[3]).toUpperCase();
    if (!ID_RE.test(id)) return bad("No encontrado", 404);
    if (method === "PUT") {
      const d = parseDecision(body);
      if (typeof d === "string") return bad(d);
      const r = await db.prepare("UPDATE decisions SET data = ? WHERE id = ? AND code = ?").bind(JSON.stringify(d), id, code).run();
      if (r.meta.changes === 1) return json({ ok: true });
      // Alta con id propuesto por el navegador (la interfaz lo genera antes de guardar)
      const exists = await db.prepare("SELECT 1 AS x FROM decisions WHERE id = ?").bind(id).first();
      if (exists) return bad("Ese id ya existe", 409);
      const c = await db.prepare("SELECT COUNT(*) AS n FROM decisions WHERE code = ?").bind(code).first();
      if (c && c.n >= MAX_DECISIONS) return bad("Esta organización llegó al máximo de decisiones.", 429);
      await db.prepare("INSERT INTO decisions (id, code, data, at) VALUES (?, ?, ?, ?)").bind(id, code, JSON.stringify(d), new Date().toISOString()).run();
      return json({ ok: true }, 201);
    }
    if (method === "DELETE") {
      await db.prepare("DELETE FROM decisions WHERE id = ? AND code = ?").bind(id, code).run();
      return json({ ok: true });
    }
  }
  return bad("Método no permitido", 405);
}
