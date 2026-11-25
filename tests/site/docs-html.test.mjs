// LL-6: friendly HTML version of the (Spanish) documentation, generated from the markdown files.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const R = path.resolve(import.meta.dirname, "../..");
const H = path.join(R, "docs/html");
const PAGES = ["index", "stack-tecnologico", "arquitectura", "ambientes", "base-de-datos", "desarrollo", "pruebas", "despliegue"];
const read = (f) => fs.readFileSync(path.join(H, f), "utf8");

test("every document has an HTML page (the README is the home page)", () => {
  for (const p of PAGES) assert.ok(fs.existsSync(path.join(H, p + ".html")), `missing docs/html/${p}.html`);
  assert.ok(fs.existsSync(path.join(H, "assets/docs.css")) && fs.existsSync(path.join(H, "assets/docs.js")));
});

test("the HTML is up to date with the markdown (regenerating changes nothing)", () => {
  const before = Object.fromEntries(PAGES.map((p) => [p, read(p + ".html")]));
  execFileSync("node", [path.join(R, "scripts/build-docs.mjs")], { cwd: R, stdio: "pipe" });
  for (const p of PAGES) assert.equal(read(p + ".html"), before[p], `docs/html/${p}.html was out of date: run make docs`);
});

test("each page has the side menu with every page and marks the current one", () => {
  for (const p of PAGES) {
    const html = read(p + ".html");
    for (const q of PAGES) assert.match(html, new RegExp(`href="${q}\\.html"`), `${p}: menu lacks ${q}`);
    assert.match(html, new RegExp(`aria-current="page"[^>]*href="${p}\\.html"|href="${p}\\.html"[^>]*aria-current="page"`), `${p}: current page not marked`);
    assert.match(html, /<html lang="es"/);
  }
});

test("links between documents point to HTML pages and none is broken", () => {
  for (const p of PAGES) {
    const html = read(p + ".html");
    assert.ok(!/href="[^"#]*\.md(#[^"]*)?"/.test(html), `${p}: still links to a .md file`);
    for (const m of html.matchAll(/href="([^"#:]+\.html)(#[^"]*)?"/g)) assert.ok(fs.existsSync(path.join(H, m[1])), `${p}: broken link ${m[1]}`);
  }
});

test("mermaid diagrams are rendered, code blocks have a copy button, tables are wrapped for small screens", () => {
  assert.match(read("arquitectura.html"), /<pre class="mermaid">/);
  assert.match(read("desarrollo.html"), /class="code-block"[\s\S]*?data-copy/);
  assert.match(read("stack-tecnologico.html"), /<div class="table-wrap"><table>/);
});

test("the page works offline: no external stylesheet or font, mermaid is the only external script", () => {
  for (const p of PAGES) {
    const html = read(p + ".html");
    assert.ok(!/<link[^>]+href="https?:/.test(html), `${p}: external stylesheet`);
    const scripts = [...html.matchAll(/<script[^>]+src="(https?:[^"]+)"/g)].map((m) => m[1]);
    for (const s of scripts) assert.match(s, /cdn\.jsdelivr\.net\/npm\/mermaid@\d+\.\d+\.\d+\//, `${p}: unexpected external script ${s}`);
  }
});

test("the page is responsive and supports dark mode", () => {
  const css = fs.readFileSync(path.join(H, "assets/docs.css"), "utf8");
  assert.match(css, /prefers-color-scheme:\s*dark/);
  assert.match(css, /@media\s*\(max-width/);
  assert.match(read("index.html"), /name="viewport"/);
});

// LL-8: "Design with love" credit (same text and links as the shell footer), in markdown and in HTML.
const CREDIT_MD = "Design with love ❤️ by [Tewa](https://tewaconsulting.com) & [Luis Mulato](https://www.linkedin.com/in/luismulato)";

test("every markdown document ends with the 'Design with love' credit", () => {
  const files = ["README.md", ...fs.readdirSync(path.join(R, "docs")).filter((f) => f.endsWith(".md")).map((f) => "docs/" + f)];
  assert.ok(files.length >= 8);
  for (const f of files) {
    const md = fs.readFileSync(path.join(R, f), "utf8").trimEnd();
    assert.ok(md.endsWith(CREDIT_MD), `${f} must end with the credit line`);
    assert.match(md, /\n---\n\n[^\n]*$/, `${f}: the credit goes after a horizontal rule`);
  }
});

test("every HTML page shows the credit once, in the footer, with both links", () => {
  for (const p of PAGES) {
    const html = read(p + ".html");
    assert.equal((html.match(/Design with love/g) || []).length, 1, `${p}: credit must appear exactly once`);
    const footer = html.match(/<footer class="credit">([\s\S]*?)<\/footer>/);
    assert.ok(footer, `${p}: missing <footer class="credit">`);
    assert.match(footer[1], /href="https:\/\/tewaconsulting\.com"[^>]*>Tewa<\/a>/);
    assert.match(footer[1], /href="https:\/\/www\.linkedin\.com\/in\/luismulato"[^>]*>Luis Mulato<\/a>/);
    assert.ok(html.indexOf('<footer class="credit">') > html.indexOf("</article>"), `${p}: the footer goes after the article`);
  }
});
