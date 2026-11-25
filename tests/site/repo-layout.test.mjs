// LL-1: open source repository layout, only working apps, no internal/management material.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const R = path.resolve(import.meta.dirname, "../..");
const exists = (...p) => fs.existsSync(path.join(R, ...p));
const read = (...p) => fs.readFileSync(path.join(R, ...p), "utf8");
const APPS = ["team-canvas", "retro", "delegation", "emociones", "openspace"];

test("standard open source files exist", () => {
  for (const f of ["README.md", "LICENSE", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "CHANGELOG.md",
    ".gitignore", ".editorconfig", ".env.example", ".nvmrc", "package.json", "Makefile",
    ".github/workflows/ci.yml", ".github/PULL_REQUEST_TEMPLATE.md", ".github/ISSUE_TEMPLATE/bug_report.md"])
    assert.ok(exists(f), `missing ${f}`);
});

test("mng/ holds the kanban board; there is no backup or third-party material folder", () => {
  assert.ok(exists("mng/leadership-lab.kanban.md"), "mng/leadership-lab.kanban.md is required");
  assert.match(read("mng/leadership-lab.kanban.md"), /^## WIP$/m);
  for (const d of ["backup", "docs/recursos", "docs/material", "docs/brand-book-tewa"]) assert.ok(!exists(d), `${d} must not exist`);
});

test("apps/ has the shell and exactly the five working apps", () => {
  const dirs = fs.readdirSync(path.join(R, "apps"), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  assert.deepEqual(dirs, [...APPS, "shell"].sort());
});

test("the shell catalog lists the 5 working apps and the 14 'coming soon' apps (no link)", () => {
  const js = read("apps/shell/assets/apps.js");
  const entries = [...js.matchAll(/  \{\n    id: "([^"]+)"[\s\S]*?\n  \}/g)].map((m) => ({ id: m[1], body: m[0] }));
  const ids = entries.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate app ids");
  const ready = entries.filter((e) => /estado: "disponible"/.test(e.body));
  const soon = entries.filter((e) => /estado: "pronto"/.test(e.body));
  assert.equal(ready.length, 5);
  assert.equal(soon.length, 14);
  assert.equal(entries.length, 19);
  for (const a of APPS) assert.ok(ready.some((e) => new RegExp(`url: "/${a}/"`).test(e.body)), `${a} must be available at /${a}/`);
  for (const e of soon) assert.match(e.body, /url: ""/, `${e.id}: a coming-soon app must have no url`);
  assert.deepEqual(soon.map((e) => e.id).slice(0, 3), ["tres-tableros", "acuerdos-1-2-4-todos", "listado-de-necesidades"]);
});

test("every category used by an app is declared, and the menu groups the coming-soon apps", () => {
  const js = read("apps/shell/assets/apps.js");
  const declared = JSON.parse(js.match(/window\.CATEGORIAS = (\[.*?\]);/)[1]);
  for (const c of new Set([...js.matchAll(/categoria: "([^"]+)"/g)].map((m) => m[1]))) assert.ok(declared.includes(c), `category ${c} is not declared`);
  assert.match(read("apps/shell/assets/appstore.js"), /label: "Próximamente"/);
});

test("secrets, data and build output are git-ignored", () => {
  const gi = read(".gitignore");
  for (const p of [".env", "build/", ".local/", "node_modules/", "test-results/"]) assert.ok(gi.split("\n").includes(p), `.gitignore must contain ${p}`);
  const tracked = execFileSync("git", ["ls-files"], { cwd: R, encoding: "utf8" }).split("\n");
  assert.ok(!tracked.includes(".env"), ".env must never be tracked by git (only .env.example)");
});

test("documentation is in Spanish and covers the technical basics", () => {
  for (const f of ["stack-tecnologico", "arquitectura", "ambientes", "base-de-datos", "desarrollo", "pruebas", "despliegue"]) assert.ok(exists("docs", f + ".md"), `missing docs/${f}.md`);
  assert.match(read("README.md"), /make dev/);
});
