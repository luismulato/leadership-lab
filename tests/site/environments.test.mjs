// LL-2: three environments (dev, test, prod) defined in a single config file; same code in all of them.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const R = path.resolve(import.meta.dirname, "../..");
const cfg = JSON.parse(fs.readFileSync(path.join(R, "config/environments.json"), "utf8"));
const OUT = path.join(R, "build/.tests");        // tests never touch build/<env>: a running dev server may be serving it
const build = (env, extra = []) => execFileSync("python3", ["-I", path.join(R, "scripts/build.py"), "--env", env, "--out", path.join(OUT, env), ...extra], { cwd: R, encoding: "utf8" });
const toml = (env) => fs.readFileSync(path.join(OUT, env, "wrangler.toml"), "utf8");
const envjs = (env) => fs.readFileSync(path.join(OUT, env, "public/env.js"), "utf8");
const field = (t, k) => (t.match(new RegExp("^" + k + "\\s*=\\s*\"([^\"]*)\"", "m")) || [])[1];

test("config defines exactly dev, test and prod", () => {
  assert.deepEqual(Object.keys(cfg.environments).sort(), ["dev", "prod", "test"]);
});

test("dev and test run locally; prod runs on Cloudflare", () => {
  assert.equal(cfg.environments.dev.target, "local");
  assert.equal(cfg.environments.test.target, "local");
  assert.equal(cfg.environments.prod.target, "cloudflare");
});

test("environments do not share ports, local data dirs or Cloudflare resources", () => {
  const e = cfg.environments;
  const ports = Object.values(e).map((x) => x.local?.port).filter(Boolean);
  assert.equal(new Set(ports).size, ports.length, "ports must differ");
  const dirs = Object.values(e).map((x) => x.local?.data_dir).filter(Boolean);
  assert.equal(new Set(dirs).size, dirs.length, "data dirs must differ");
  const dbs = Object.values(e).map((x) => x.cloudflare?.d1_database).filter(Boolean);
  assert.equal(new Set(dbs).size, dbs.length, "D1 databases must differ");
  const projects = Object.values(e).map((x) => x.cloudflare?.pages_project).filter(Boolean);
  assert.equal(new Set(projects).size, projects.length, "Pages projects must differ");
  assert.equal(e.prod.cloudflare.pages_project, "leadership-lab");
  assert.equal(e.prod.cloudflare.d1_database, "leadership-lab");
});

test("each environment builds with ONE D1 and ONE KV, its own names and its own env.js", () => {
  for (const name of Object.keys(cfg.environments)) {
    build(name);
    const t = toml(name);
    assert.equal((t.match(/\[\[d1_databases\]\]/g) || []).length, 1, name);
    assert.equal((t.match(/\[\[kv_namespaces\]\]/g) || []).length, 1, name);
    assert.equal(field(t, "database_name"), cfg.environments[name].cloudflare.d1_database, name);
    assert.equal(field(t, "name"), cfg.environments[name].cloudflare.pages_project, name);
    assert.match(envjs(name), new RegExp(`"name":\\s*"${name}"`));
  }
});

test("the application code is identical in every environment (only env.js and wrangler.toml differ)", () => {
  const files = (d) => fs.readdirSync(d, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.relative(d, path.join(e.parentPath ?? e.path, e.name)));
  const a = files(path.join(OUT, "dev")).filter((f) => !["wrangler.toml", "public/env.js"].includes(f)).sort();
  const b = files(path.join(OUT, "prod")).filter((f) => !["wrangler.toml", "public/env.js"].includes(f)).sort();
  assert.deepEqual(a, b);
  for (const f of a.filter((x) => x.startsWith("public/") || x.startsWith("functions/")))
    assert.ok(fs.readFileSync(path.join(OUT, "dev", f)).equals(fs.readFileSync(path.join(OUT, "prod", f))), `${f} differs between envs`);
});

const TALLY_FORM = "https://tally.so/embed/bZW1bL?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";

test("the feedback form (Tally) is configured in every environment and can be disabled", () => {
  for (const name of Object.keys(cfg.environments)) {
    assert.equal(cfg.environments[name].feedback_form_url, TALLY_FORM, `${name}: feedback_form_url`);
    assert.ok(!("feedback_url" in cfg.environments[name]), `${name}: the old external feedback service is gone`);
    build(name);
    assert.ok(envjs(name).includes(JSON.stringify(TALLY_FORM)), `${name}: env.js must carry the form url`);
  }
  build("dev", ["--set", "feedback_form_url="]);
  assert.match(envjs("dev"), /"feedbackFormUrl":\s*""/);
  build("dev");
});

test("test can move to Cloudflare by flipping one value: it keeps its own project and D1", () => {
  build("test", ["--set", "target=cloudflare"]);
  const t = toml("test");
  assert.equal(field(t, "name"), "leadership-lab-test");
  assert.equal(field(t, "database_name"), "leadership-lab-test");
  build("test");
});

test("local environments get a throwaway local database binding, never the production id", () => {
  build("dev");
  assert.ok(!toml("dev").includes(cfg.environments.prod.cloudflare.d1_id || "__none__"));
});

test("building with --out leaves build/<env> untouched (a dev server may be serving it)", () => {
  const sentinel = path.join(R, "build/dev/.sentinel-do-not-touch");
  fs.mkdirSync(path.dirname(sentinel), { recursive: true });
  fs.writeFileSync(sentinel, "x");
  try {
    build("dev");
    build("prod");
    assert.ok(fs.existsSync(sentinel), "tests rebuilt build/dev: that breaks a running dev server");
  } finally { fs.rmSync(sentinel, { force: true }); }
});

test("a local environment is served from its own copy (.local/<env>/site), not from build/<env>", () => {
  const sh = fs.readFileSync(path.join(R, "scripts/local.sh"), "utf8");
  assert.match(sh, /SITE="\$DATA\/site"/);
  assert.match(sh, /rsync[^\n]*build\/\$ENV\/[^\n]*\$SITE\//);
  assert.ok(!/cd "build\/\$ENV" && exec nohup/.test(sh), "the server must not run inside build/<env>");
});

test("make status only reports 'up' when the apps answer, not just the root", () => {
  const sh = fs.readFileSync(path.join(R, "scripts/local.sh"), "utf8");
  assert.match(sh, /for app in \$\(cfg app-ids\)/);
});
