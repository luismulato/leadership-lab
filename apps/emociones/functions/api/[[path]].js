// API de Listado de Emociones sobre Cloudflare D1. Sin cuentas: el código del check-in es la llave.
import DATA from "../words.json";

const WORD_Q = {};
DATA.quadrants.forEach((q) => q.words.forEach((w) => { WORD_Q[w.w] = q.id; }));
const NEEDS = DATA.needs;
const CODE_RE = /^[A-Z0-9]{6}$/;
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_CHECKINS = 400;
const MAX_BOARDS_PER_HOUR = 40;
const MAX_TEXT = 300;

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const bad = (msg, status = 400) => json({ error: msg }, status);
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
const rand = (n) => { const b = new Uint8Array(n); crypto.getRandomValues(b); return [...b].map((x) => ALPHA[x % ALPHA.length]).join(""); };
async function hash(s) { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join(""); }

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
  let body = {};
  if (method === "POST" || method === "PATCH") {
    try { body = await request.json(); } catch { body = {}; }
    if (!body || typeof body !== "object" || Array.isArray(body)) body = {};
  }
  const ownerRaw = clean(request.headers.get("x-owner") || body.owner, 80);

  // Modo admin (solo con la clave): GET /api/admin/boards · DELETE /api/admin/boards/:code
  if (parts[0] === "admin") {
    if (!(await claveOk(request, env))) return bad("Clave incorrecta", 403);
    if (parts[1] !== "boards") return bad("No encontrado", 404);
    if (parts.length === 2 && method === "GET") {
      const { results } = await db.prepare("SELECT code, name, created_at, example FROM emo_boards ORDER BY created_at DESC").all();
      return json({ boards: results.map((b) => ({ ...b, example: b.example === 1 })) });
    }
    if (parts.length === 3 && method === "DELETE") {
      const c = String(parts[2]).toUpperCase();
      const b = await db.prepare("SELECT example FROM emo_boards WHERE code = ?").bind(c).first();
      if (!b) return bad("No existe ese equipo", 404);
      if (b.example === 1) return bad("El ejemplo ACME no se borra desde acá.", 403);
      await db.batch([db.prepare("DELETE FROM emo_checkins WHERE code = ?").bind(c), db.prepare("DELETE FROM emo_boards WHERE code = ?").bind(c)]);
      return json({ ok: true });
    }
    return bad("Método no permitido", 405);
  }

  // POST /api/boards
  if (parts[0] === "boards" && parts.length === 1 && method === "POST") {
    const name = clean(body.name, 60);
    if (name.length < 2) return bad("Escribí el nombre del equipo (mínimo 2 letras).");
    const since = new Date(Date.now() - 3600e3).toISOString();
    const recent = await db.prepare("SELECT COUNT(*) AS n FROM emo_boards WHERE created_at > ? AND example = 0").bind(since).first();
    if (recent && recent.n >= MAX_BOARDS_PER_HOUR) return bad("Se crearon muchos check-ins seguidos. Probá de nuevo en un rato.", 429);
    let code = String(body.code || "").toUpperCase();
    if (!CODE_RE.test(code)) code = rand(6);
    const r = await db.prepare("INSERT OR IGNORE INTO emo_boards (code, name, created_at) VALUES (?, ?, ?)").bind(code, name, new Date().toISOString()).run();
    if (r.meta.changes !== 1) return bad("Ese código ya existe", 409);
    return json({ code, name }, 201);
  }

  const code = String(parts[1] || "").toUpperCase();
  if (parts[0] !== "boards" || !CODE_RE.test(code)) return bad("No encontrado", 404);
  const board = await db.prepare("SELECT code, name, example FROM emo_boards WHERE code = ?").bind(code).first();
  if (!board) return bad("No existe ese check-in", 404);
  board.example = board.example === 1;
  // El ejemplo ficticio de ACME es de solo lectura: ninguna escritura.
  if (board.example && method !== "GET") return bad("Es un ejemplo ficticio de solo lectura. Armá el tuyo.", 403);

  // GET /api/boards/:code
  if (parts.length === 2 && method === "GET") return json(board);
  // GET /api/boards/:code/state
  if (parts[2] === "state" && parts.length === 3 && method === "GET") {
    const { results } = await db.prepare("SELECT id, nick, word, quadrant, note, need, at FROM emo_checkins WHERE code = ? ORDER BY at, id").bind(code).all();
    return json({ board, checkins: results });
  }
  if (parts[2] !== "checkins") return bad("No encontrado", 404);

  // Validación común de un check-in
  const parse = () => {
    const nick = clean(body.nick, 30), word = clean(body.word, 40), note = clean(body.note, MAX_TEXT), need = clean(body.need, 40).toLowerCase();
    if (nick.length < 1) return { e: "Escribí tu apodo." };
    if (!WORD_Q[word]) return { e: "Elegí una palabra del listado." };
    if (need && !NEEDS.includes(need)) return { e: "Elegí una necesidad de la lista." };
    return { nick, word, note, need, quadrant: WORD_Q[word] };
  };

  // POST /api/boards/:code/checkins
  if (parts.length === 3 && method === "POST") {
    if (ownerRaw.length < 8) return bad("Falta la identidad del navegador.");
    const v = parse(); if (v.e) return bad(v.e);
    const c = await db.prepare("SELECT COUNT(*) AS n FROM emo_checkins WHERE code = ?").bind(code).first();
    if (c && c.n >= MAX_CHECKINS) return bad("Este check-in llegó al máximo de notas.", 429);
    const id = rand(9), at = new Date().toISOString();
    await db.prepare("INSERT INTO emo_checkins (id, code, nick, word, quadrant, note, need, owner, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, code, v.nick, v.word, v.quadrant, v.note, v.need, await hash(ownerRaw), at).run();
    return json({ id, nick: v.nick, word: v.word, quadrant: v.quadrant, note: v.note, need: v.need, at }, 201);
  }
  if (parts.length === 4 && (method === "PATCH" || method === "DELETE")) {
    const id = String(parts[3]).toUpperCase();
    const row = await db.prepare("SELECT owner FROM emo_checkins WHERE id = ? AND code = ?").bind(id, code).first();
    if (!row) return bad("No existe ese check-in", 404);
    if (!ownerRaw || row.owner !== (await hash(ownerRaw))) return bad("Solo quien lo escribió puede cambiarlo, desde el mismo navegador.", 403);
    if (method === "DELETE") {
      await db.prepare("DELETE FROM emo_checkins WHERE id = ? AND code = ?").bind(id, code).run();
      return json({ ok: true });
    }
    const v = parse(); if (v.e) return bad(v.e);
    await db.prepare("UPDATE emo_checkins SET nick = ?, word = ?, quadrant = ?, note = ?, need = ? WHERE id = ? AND code = ?").bind(v.nick, v.word, v.quadrant, v.note, v.need, id, code).run();
    return json({ id, nick: v.nick, word: v.word, quadrant: v.quadrant, note: v.note, need: v.need });
  }
  return bad("Método no permitido", 405);
}
