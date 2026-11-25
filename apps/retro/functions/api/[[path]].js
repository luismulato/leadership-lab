// API de Retro de Equipo sobre Cloudflare D1. Sin cuentas: el código de la retro es la llave.
const LENSES = ["producto", "proceso", "equipo"];
const CODE_RE = /^[A-Z0-9]{6}$/;
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_ITEMS = 600;
const MAX_RETROS_PER_HOUR = 40;

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const bad = (msg, status = 400) => json({ error: msg }, status);
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
const rand = (n) => { const b = new Uint8Array(n); crypto.getRandomValues(b); return [...b].map((x) => ALPHA[x % ALPHA.length]).join(""); };

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
      const { results } = await db.prepare("SELECT code, name, created_at, demo AS example FROM retros ORDER BY created_at DESC").all();
      return json({ boards: results.map((b) => ({ ...b, example: b.example === 1 })) });
    }
    if (parts.length === 3 && method === "DELETE") {
      const c = String(parts[2]).toUpperCase();
      const b = await db.prepare("SELECT demo AS example FROM retros WHERE code = ?").bind(c).first();
      if (!b) return bad("No existe ese equipo", 404);
      if (b.example === 1) return bad("El ejemplo no se borra desde acá.", 403);
      await db.batch([db.prepare("DELETE FROM items WHERE code = ?").bind(c), db.prepare("DELETE FROM retros WHERE code = ?").bind(c)]);
      return json({ ok: true });
    }
    return bad("Método no permitido", 405);
  }
  let body = {};
  if (method === "POST" || method === "PATCH") {
    try { body = await request.json(); } catch { body = {}; }
  }

  // POST /api/retros
  if (parts[0] === "retros" && parts.length === 1 && method === "POST") {
    const name = clean(body.name, 60);
    if (name.length < 2) return bad("Escribí el nombre del equipo (mínimo 2 letras).");
    let code = String(body.code || "").toUpperCase();
    const taken = await db.prepare("SELECT demo FROM retros WHERE code = ?").bind(code).first();
    if (taken && taken.demo) return bad("Ese ejemplo es de solo lectura.", 403);
    const since = new Date(Date.now() - 3600e3).toISOString();
    const recent = await db.prepare("SELECT COUNT(*) AS n FROM retros WHERE demo = 0 AND created_at > ?").bind(since).first();
    if (recent && recent.n >= MAX_RETROS_PER_HOUR) return bad("Se crearon muchas retros seguidas. Probá de nuevo en un rato.", 429);
    if (!CODE_RE.test(code)) code = rand(6);
    const r = await db.prepare("INSERT OR IGNORE INTO retros (code, name, phase, created_at) VALUES (?, ?, 0, ?)").bind(code, name, new Date().toISOString()).run();
    if (r.meta.changes !== 1) return bad("Ese código ya existe", 409);
    return json({ code, name, phase: 0 }, 201);
  }

  const code = String(parts[1] || "").toUpperCase();
  if (parts[0] !== "retros" || !CODE_RE.test(code)) return bad("No encontrado", 404);
  const retro = await db.prepare("SELECT code, name, phase, demo FROM retros WHERE code = ?").bind(code).first();
  if (!retro) return bad("No existe esa retro", 404);
  if (retro.demo && method !== "GET") return bad("Ejemplo ficticio de ACME: es de solo lectura.", 403);

  // GET /api/retros/:code
  if (parts.length === 2 && method === "GET") return json(retro);
  // PATCH /api/retros/:code  { phase }
  if (parts.length === 2 && method === "PATCH") {
    const phase = Number(body.phase);
    if (!Number.isInteger(phase) || phase < 0 || phase > 4) return bad("Fase inválida");
    await db.prepare("UPDATE retros SET phase = ? WHERE code = ?").bind(phase, code).run();
    return json({ ok: true, phase });
  }
  // GET /api/retros/:code/state
  if (parts[2] === "state" && parts.length === 3 && method === "GET") {
    const { results } = await db.prepare("SELECT id, phase, lens, text, votes, at FROM items WHERE code = ? ORDER BY at, id").bind(code).all();
    return json({ retro, items: results });
  }
  if (parts[2] !== "items") return bad("No encontrado", 404);

  // POST /api/retros/:code/items
  if (parts.length === 3 && method === "POST") {
    const phase = Number(body.phase), lens = String(body.lens || ""), text = clean(body.text, 400);
    if (!Number.isInteger(phase) || phase < 1 || phase > 4) return bad("Fase inválida");
    if (!LENSES.includes(lens)) return bad("Elegí Producto, Proceso o Equipo");
    if (!text) return bad("La nota está vacía");
    const c = await db.prepare("SELECT COUNT(*) AS n FROM items WHERE code = ?").bind(code).first();
    if (c && c.n >= MAX_ITEMS) return bad("Esta retro llegó al máximo de notas.", 429);
    const id = rand(9), at = new Date().toISOString();
    await db.prepare("INSERT INTO items (id, code, phase, lens, text, votes, at) VALUES (?, ?, ?, ?, ?, 0, ?)").bind(id, code, phase, lens, text, at).run();
    return json({ id, phase, lens, text, votes: 0, at }, 201);
  }
  if (parts.length >= 4) {
    const id = String(parts[3]).toUpperCase();
    // POST /api/retros/:code/items/:id/vote { delta }
    if (parts[4] === "vote" && method === "POST") {
      const delta = Number(body.delta) === -1 ? -1 : 1;
      const r = await db.prepare("UPDATE items SET votes = MAX(0, votes + ?) WHERE id = ? AND code = ?").bind(delta, id, code).run();
      return r.meta.changes === 1 ? json({ ok: true }) : bad("No existe esa nota", 404);
    }
    if (parts.length === 4 && method === "PATCH") {
      const text = clean(body.text, 400);
      if (!text) return bad("La nota está vacía");
      const r = await db.prepare("UPDATE items SET text = ? WHERE id = ? AND code = ?").bind(text, id, code).run();
      return r.meta.changes === 1 ? json({ ok: true }) : bad("No existe esa nota", 404);
    }
    if (parts.length === 4 && method === "DELETE") {
      await db.prepare("DELETE FROM items WHERE id = ? AND code = ?").bind(id, code).run();
      return json({ ok: true });
    }
  }
  return bad("Método no permitido", 405);
}
