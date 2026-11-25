// One shared D1 schema for every app (schema checks only; per-environment wiring is tested in tests/site).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const R = path.resolve(import.meta.dirname, "../..");
test("en una base vacía, las migraciones crean las 10 tablas y los ejemplos ACME de cada app", () => {
  const dir = path.join(R, "db/migrations");
  const sql = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
  const q = (extra) => execFileSync("sqlite3", [":memory:"], { input: sql + "\n" + extra, encoding: "utf8" }).trim();
  const tablas = q("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;").split("\n");
  assert.deepEqual(tablas, ["canvases", "decisions", "emo_boards", "emo_checkins", "eventos", "items", "notes", "orgs", "retros", "sesiones"]);
  for (const [t, c] of [["canvases", "code"], ["retros", "code"], ["orgs", "code"], ["emo_boards", "code"], ["eventos", "code"]])
    assert.equal(q(`SELECT count(*) FROM ${t} WHERE ${c}='ACME01';`), "1", `falta el ejemplo ACME01 en ${t}`);
});

test("los nombres de tabla no chocan entre apps (una tabla = una app)", () => {
  const dir = path.join(R, "db/migrations");
  const nombres = fs.readdirSync(dir).flatMap((f) => [...fs.readFileSync(path.join(dir, f), "utf8").matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/gi)].map((m) => m[1]));
  assert.equal(new Set(nombres).size, nombres.length, "hay tablas repetidas: " + nombres.join(","));
});
