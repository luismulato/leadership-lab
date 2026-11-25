// POST /app-admin/api/activar {clave, tema} → guarda el tema activo en KV.
// La palabra clave es el secreto APP_ADMIN_CLAVE (wrangler pages secret put).
// Temas = index.json (versionado: solo "default") + instalados.json (lo genera scripts/build.py desde las carpetas temas/*/tema.json).
async function leerTemas(request, env) {
  const leer = async (p) => {
    try { const r = await env.ASSETS.fetch(new URL(p, request.url)); const j = r.ok ? await r.json() : []; return Array.isArray(j) ? j : []; }
    catch { return []; }
  };
  const base = await leer("/skin/temas/index.json");
  const extra = (await leer("/skin/temas/instalados.json")).filter((t) => t && /^[a-z0-9-]+$/.test(t.id) && !base.some((b) => b.id === t.id));
  return base.concat(extra);
}
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function iguales(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([a, b].map((x) => crypto.subtle.digest("SHA-256", enc.encode(x))));
  const va = new Uint8Array(ha), vb = new Uint8Array(hb);
  let d = 0;
  for (let i = 0; i < va.length; i++) d |= va[i] ^ vb[i];
  return d === 0;
}

export async function onRequestPost({ request, env }) {
  let d;
  try { d = await request.json(); } catch { return json({ error: "json inválido" }, 400); }
  if (!env.APP_ADMIN_CLAVE) return json({ error: "deshabilitado" }, 403);
  if (!(await iguales(String(d.clave ?? ""), env.APP_ADMIN_CLAVE))) {
    await new Promise((r) => setTimeout(r, 600)); // freno básico a la fuerza bruta
    return json({ error: "clave" }, 403);
  }
  const temas = await leerTemas(request, env);
  const tema = String(d.tema ?? "");
  if (!temas.some((t) => t.id === tema)) return json({ error: "tema inexistente" }, 400);
  await env.SKIN.put("activo", tema);
  return json({ activo: tema });
}
