// Pruebas de pantalla (BDD) del acceso por link /#CODIGO y del botón "Abrir" del admin.
// Bug que cubren: go("build") reescribía el hash a #armar y la app pedía el canvas "ARMAR".
// Crean y borran datos de prueba: SOLO corren contra localhost (ALLOW_REMOTE=1 para forzar, no recomendado).
import { test, expect } from "@playwright/test";

const APP = process.env.APP;
const ORIGEN = (process.env.BASE || "").replace(/\/$/, "");   // el sitio único (http://localhost:PUERTO)
const BASE = ORIGEN + "/" + APP;                                 // cada app vive bajo /<id>/
const CLAVE = process.env.ADMIN_CLAVE || "clave-de-prueba-local";
const mismo = (code, name) => ({ code, name });
const CFG = {
  "team-canvas": { crear: "/api/canvases", cuerpo: mismo, vista: "#b-app", borrar: "/api/admin/boards/" },
  retro: { crear: "/api/retros", cuerpo: mismo, vista: "#b-app", borrar: "/api/admin/boards/" },
  emociones: { crear: "/api/boards", cuerpo: mismo, vista: "#b-app", borrar: "/api/admin/boards/" },
  openspace: { crear: "/api/eventos", cuerpo: (code, name) => ({ code, name, pregunta: "¿Pregunta de prueba?", lugares: ["A"], horarios: ["10:00"] }), vista: "#v-app", borrar: "/api/admin/eventos/" },
};
const cfg = CFG[APP];

test.beforeAll(() => {
  if (!cfg) throw new Error(`Definí APP=${Object.keys(CFG).join("|")} (recibí: ${APP})`);
  if (!ORIGEN) throw new Error("Definí BASE=http://localhost:PUERTO");
  if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(ORIGEN) && process.env.ALLOW_REMOTE !== "1")
    throw new Error(`Estas pruebas crean datos: solo corren contra localhost (BASE=${ORIGEN})`);
});

const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const codigoNuevo = () => { let c = "ZE"; for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)]; return c; };
let code, nombre;

// Herméticas: se bloquea todo lo que no sea localhost (fuentes y librerías de CDN), así las pruebas no dependen de internet.
test.beforeEach(async ({ context }) => {
  await context.route((url) => !/^(localhost|127\.0\.0\.1)$/.test(url.hostname), (route) => route.abort());
});
const ir = (page, url) => page.goto(url, { waitUntil: "domcontentloaded" });

test.beforeEach(async ({ request }) => {
  code = codigoNuevo(); nombre = `Canvas E2E ${code}`;
  const r = await request.post(BASE + cfg.crear, { data: cfg.cuerpo(code, nombre) });
  expect(r.status(), "crear el canvas de prueba").toBe(201);
});
test.afterEach(async ({ request }) => {
  await request.delete(BASE + cfg.borrar + code, { headers: { "x-admin-clave": CLAVE } });
});

test.describe(`@${APP}`, () => {
  test("Dado un canvas común, cuando el admin entra con la clave y toca Abrir, entonces se abre ese canvas sin error", async ({ page }) => {
    await ir(page, BASE + "/admin/");
    await page.locator("#clave").fill(CLAVE);
    await page.locator("#f button").click();
    const fila = page.locator("tr", { hasText: code });
    await expect(fila).toBeVisible();
    const [popup] = await Promise.all([page.context().waitForEvent("page"), fila.getByRole("button", { name: "Abrir" }).click()]);
    await popup.waitForLoadState("domcontentloaded");
    await expect(popup.locator(cfg.vista)).toBeVisible();
    await expect(popup.getByText(nombre).first()).toBeVisible();
    await expect(popup.locator("#b-err")).toBeEmpty();
  });

  test("Dado el link /#CODIGO de un canvas existente, cuando alguien lo abre directo, entonces ve ese canvas y no se pide el canvas ARMAR", async ({ page }) => {
    const pedidos = [];
    page.on("request", (r) => pedidos.push(new URL(r.url()).pathname));
    await ir(page, `${BASE}/#${code}`);
    await expect(page.locator(cfg.vista)).toBeVisible();
    await expect(page.getByText(nombre).first()).toBeVisible();
    await expect(page.locator("#b-err")).toBeEmpty();
    expect(pedidos.filter((p) => /\/ARMAR(\/|$)/i.test(p)), "pedidos al canvas ARMAR").toEqual([]);
  });

  test("Dado el link /#CODIGO de un código que no existe, cuando se abre, entonces la pantalla lo dice y no rompe", async ({ page }) => {
    await ir(page, `${BASE}/#ZZZZZ9`);
    await expect(page.locator("#b-err")).toContainText("No hay", { timeout: 10_000 });
    await expect(page.locator(cfg.vista)).toBeHidden();
  });

  test("Dado el link /#armar, cuando se abre, entonces se muestra la pantalla de armar y no se consulta ningún canvas", async ({ page }) => {
    const pedidos = [];
    page.on("request", (r) => pedidos.push(new URL(r.url()).pathname));
    await ir(page, `${BASE}/#armar`);
    await page.waitForTimeout(1500);
    await expect(page.locator("#b-err")).toBeEmpty();
    await expect(page.locator(cfg.vista)).toBeHidden();
    expect(pedidos.filter((p) => /\/ARMAR(\/|$)/i.test(p)), "pedidos al canvas ARMAR").toEqual([]);
  });
});
