import { defineConfig } from "@playwright/test";
// Uses the installed Google Chrome (no browser download). Usage: APP=retro BASE=http://localhost:8190 npx playwright test -c e2e/playwright.config.mjs
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  workers: 1,
  reporter: [["list"]],
  use: { channel: "chrome", headless: true, viewport: { width: 1000, height: 800 } },
});
