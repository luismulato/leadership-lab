// Browser test: the shell's "Feedback" tab opens a panel with the Tally form embedded.
// Hermetic: every request that is not localhost is aborted (Tally included), so it needs no internet; we only assert the embed markup.
import { test, expect } from "@playwright/test";

const BASE = (process.env.BASE || "").replace(/\/$/, "");
const FORM = "https://tally.so/embed/bZW1bL?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";

test.beforeAll(() => {
  if (!BASE) throw new Error("Set BASE=http://localhost:PORT");
  if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) throw new Error(`Local only (BASE=${BASE})`);
});
test.beforeEach(async ({ context }) => {
  await context.route((url) => !/^(localhost|127\.0\.0\.1)$/.test(url.hostname), (route) => route.abort());
});

test.describe("@shell feedback", () => {
  test("Given the shell, when nobody opened the panel, then no Tally content is loaded", async ({ page }) => {
    const tally = [];
    page.on("request", (r) => { if (/tally\.so/.test(r.url())) tally.push(r.url()); });
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Feedback", exact: true })).toBeVisible();
    await page.waitForTimeout(500);
    expect(tally, "Tally must be lazy").toEqual([]);
    await expect(page.locator("iframe[data-tally-src]")).toHaveCount(0);
  });

  test("Given the Feedback tab, when it is clicked, then a dialog shows the Tally iframe with the requested attributes", async ({ page }) => {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Feedback", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const frame = dialog.locator("iframe[title='Formulario de Feedback']");
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute("data-tally-src", FORM);
    await expect(frame).toHaveAttribute("width", "100%");
    await expect(frame).toHaveAttribute("loading", "lazy");
  });

  test("Given the open panel, when Esc is pressed, or the X, or outside is clicked, then it closes and the tab keeps the focus", async ({ page }) => {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    const tab = page.getByRole("button", { name: "Feedback", exact: true });
    const dialog = page.getByRole("dialog");
    await tab.click(); await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape"); await expect(dialog).toBeHidden();
    await expect(tab).toBeFocused();
    await tab.click(); await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click(); await expect(dialog).toBeHidden();
    await tab.click(); await expect(dialog).toBeVisible();
    await page.mouse.click(5, 300); await expect(dialog).toBeHidden();
  });

  test("Given the panel was opened twice, then there is still a single iframe (not duplicated)", async ({ page }) => {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    const tab = page.getByRole("button", { name: "Feedback", exact: true });
    await tab.click(); await page.keyboard.press("Escape");
    await tab.click();
    await expect(page.locator("iframe[title='Formulario de Feedback']")).toHaveCount(1);
  });

  test("Given Tally cannot load, when the panel opens, then the 'open in a new window' link is the main option and opens the form", async ({ page, context }) => {
    // every external request is aborted in this suite, which is exactly "Tally cannot load"
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Feedback", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const link = dialog.getByRole("link", { name: /ventana nueva/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", FORM);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(dialog.locator(".fb-fallback")).toHaveClass(/fb-main/);          // prominent, not the discreet footer
    await expect(dialog.locator("iframe[title='Formulario de Feedback']")).toBeHidden();
    // The new window is opened and asks for the form (the request is aborted by this suite, so we assert the request, not the final page).
    const asked = context.waitForEvent("request", { predicate: (r) => r.url().includes("tally.so/embed/bZW1bL") });
    const [popup] = await Promise.all([context.waitForEvent("page"), link.click()]);
    expect((await asked).url()).toBe(FORM);
    await popup.close();
  });

  test("Given the browser is offline, when the panel opens, then the fallback link shows right away", async ({ page, context }) => {
    await page.goto(BASE + "/", { waitUntil: "load" });
    const tab = page.getByRole("button", { name: "Feedback", exact: true });
    await expect(tab).toBeVisible();          // the shell finished loading its own scripts before we go offline
    await context.setOffline(true);
    await tab.click();
    await expect(page.getByRole("dialog").getByRole("link", { name: /ventana nueva/i })).toBeVisible({ timeout: 1500 });
    await context.setOffline(false);
  });
});
