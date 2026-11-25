// GET /app-admin/api/estado → { activo, temas }. El tema activo vive en KV (clave "activo").
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
export async function onRequestGet({ request, env }) {
  const temas = await leerTemas(request, env);
  let activo = (env.SKIN && (await env.SKIN.get("activo"))) || "default";
  if (!temas.some((t) => t.id === activo)) activo = "default";
  return new Response(JSON.stringify({ activo, temas }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
