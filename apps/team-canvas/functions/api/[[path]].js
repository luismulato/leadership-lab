// API del Canvas de Equipos que Enamoran sobre Cloudflare D1. Sin cuentas: el código del canvas es la llave.
const SECS = ["proposito", "objetivos", "iniciativas", "personas", "capacidades", "principios", "acuerdos", "bienestar", "aprendizaje"];
const CODE_RE = /^[A-Z0-9]{6}$/;
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_NOTES = 600;
const MAX_CANVASES_PER_HOUR = 40;

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const bad = (msg, status = 400) => json({ error: msg }, status);
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);

function newId() {
  const b = new Uint8Array(9); crypto.getRandomValues(b);
  return [...b].map((x) => ALPHA[x % ALPHA.length]).join("");
}
function newCode() {
  const b = new Uint8Array(6); crypto.getRandomValues(b);
  return [...b].map((x) => ALPHA[x % ALPHA.length]).join("");
}

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
      const { results } = await db.prepare("SELECT code, name, created_at, locked AS example FROM canvases ORDER BY created_at DESC").all();
      return json({ boards: results.map((b) => ({ ...b, example: b.example === 1 })) });
    }
    if (parts.length === 3 && method === "DELETE") {
      const c = String(parts[2]).toUpperCase();
      const b = await db.prepare("SELECT locked AS example FROM canvases WHERE code = ?").bind(c).first();
      if (!b) return bad("No existe ese equipo", 404);
      if (b.example === 1) return bad("El ejemplo no se borra desde acá.", 403);
      await db.batch([db.prepare("DELETE FROM notes WHERE code = ?").bind(c), db.prepare("DELETE FROM canvases WHERE code = ?").bind(c)]);
      return json({ ok: true });
    }
    return bad("Método no permitido", 405);
  }
  // El canvas de ejemplo (locked = 1) es de solo lectura: cualquier escritura sobre él da 403.
  const isLocked = async (c) => !!(await db.prepare("SELECT 1 AS x FROM canvases WHERE code = ? AND locked = 1").bind(c).first());
  if (method !== "GET" && method !== "HEAD" && parts[0] === "canvases" && parts[1]) {
    const c = String(parts[1]).toUpperCase();
    if (CODE_RE.test(c) && await isLocked(c)) return bad("Este es un ejemplo de solo lectura.", 403);
  }
  let body = {};
  if (method === "POST" || method === "PATCH") {
    try { body = await request.json(); } catch { return bad("Cuerpo inválido"); }
  }

  // POST /api/canvases
  if (parts[0] === "canvases" && parts.length === 1 && method === "POST") {
    const name = clean(body.name, 60);
    if (name.length < 2) return bad("Escribí el nombre del equipo (mínimo 2 letras).");
    const wanted = String(body.code || "").toUpperCase();
    if (CODE_RE.test(wanted) && await isLocked(wanted)) return bad("Ese código es de un ejemplo de solo lectura.", 403);
    const since = new Date(Date.now() - 3600e3).toISOString();
    const recent = await db.prepare("SELECT COUNT(*) AS n FROM canvases WHERE created_at > ? AND locked = 0").bind(since).first();
    if (recent && recent.n >= MAX_CANVASES_PER_HOUR) return bad("Se crearon muchos canvases seguidos. Probá de nuevo en un rato.", 429);
    let code = String(body.code || "").toUpperCase();
    if (!CODE_RE.test(code)) code = newCode();
    const r = await db.prepare("INSERT OR IGNORE INTO canvases (code, name, created_at) VALUES (?, ?, ?)").bind(code, name, new Date().toISOString()).run();
    if (r.meta.changes !== 1) return bad("Ese código ya existe", 409);
    return json({ code, name }, 201);
  }

  const code = String(parts[1] || "").toUpperCase();
  if (parts[0] !== "canvases" || !CODE_RE.test(code)) return bad("No encontrado", 404);
  const canvas = await db.prepare("SELECT code, name, locked FROM canvases WHERE code = ?").bind(code).first();

  // GET /api/canvases/:code
  if (parts.length === 2 && method === "GET") return canvas ? json({ code: canvas.code, name: canvas.name, locked: canvas.locked === 1 }) : bad("No existe ese canvas", 404);
  if (!canvas) return bad("No existe ese canvas", 404);
  if (parts[2] !== "notes") return bad("No encontrado", 404);

  // GET /api/canvases/:code/notes
  if (parts.length === 3 && method === "GET") {
    const { results } = await db.prepare("SELECT id, sec, text, at FROM notes WHERE code = ? ORDER BY at, id").bind(code).all();
    return json({ notes: results });
  }
  // POST /api/canvases/:code/notes
  if (parts.length === 3 && method === "POST") {
    const sec = String(body.sec || ""), text = clean(body.text, 400);
    if (!SECS.includes(sec)) return bad("Sección inválida");
    if (!text) return bad("La idea está vacía");
    const c = await db.prepare("SELECT COUNT(*) AS n FROM notes WHERE code = ?").bind(code).first();
    if (c && c.n >= MAX_NOTES) return bad("Este canvas llegó al máximo de ideas.", 429);
    const id = newId(), at = new Date().toISOString();
    await db.prepare("INSERT INTO notes (id, code, sec, text, at) VALUES (?, ?, ?, ?, ?)").bind(id, code, sec, text, at).run();
    return json({ id, sec, text, at }, 201);
  }
  // PATCH / DELETE /api/canvases/:code/notes/:id
  if (parts.length === 4) {
    const id = String(parts[3]).toUpperCase();
    if (method === "PATCH") {
      const text = clean(body.text, 400);
      if (!text) return bad("La idea está vacía");
      const r = await db.prepare("UPDATE notes SET text = ? WHERE id = ? AND code = ?").bind(text, id, code).run();
      return r.meta.changes === 1 ? json({ ok: true }) : bad("No existe esa idea", 404);
    }
    if (method === "DELETE") {
      await db.prepare("DELETE FROM notes WHERE id = ? AND code = ?").bind(id, code).run();
      return json({ ok: true });
    }
  }
  return bad("Método no permitido", 405);
}
