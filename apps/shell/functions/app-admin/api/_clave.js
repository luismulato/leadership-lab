// Compara la clave de admin (secreto APP_ADMIN_CLAVE) en tiempo constante.
export async function claveOk(clave, env) {
  if (!env.APP_ADMIN_CLAVE) return false;
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([String(clave ?? ""), env.APP_ADMIN_CLAVE].map((x) => crypto.subtle.digest("SHA-256", enc.encode(x))));
  const va = new Uint8Array(ha), vb = new Uint8Array(hb);
  let d = 0;
  for (let i = 0; i < va.length; i++) d |= va[i] ^ vb[i];
  if (d !== 0) await new Promise((r) => setTimeout(r, 600));
  return d === 0;
}
export const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
