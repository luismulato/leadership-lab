#!/usr/bin/env node
// Generate docs/html/ (a friendly, offline-capable website) from the Spanish markdown documentation.
//   node scripts/build-docs.mjs        (or: make docs)
// Sources: README.md (home page) and docs/*.md. The markdown files remain the single source of truth.
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "docs/html");
const MERMAID = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js";

// Page order = menu order. `src` is relative to the repository root.
const PAGES = [
  { id: "index", src: "README.md", label: "Inicio", hint: "Qué es y cómo arrancar" },
  { id: "stack-tecnologico", src: "docs/stack-tecnologico.md", label: "Stack tecnológico", hint: "Qué usa cada capa y cada app" },
  { id: "arquitectura", src: "docs/arquitectura.md", label: "Arquitectura", hint: "Cómo encaja todo" },
  { id: "ambientes", src: "docs/ambientes.md", label: "Ambientes", hint: "dev, test y prod" },
  { id: "base-de-datos", src: "docs/base-de-datos.md", label: "Base de datos", hint: "Una D1, tablas y migraciones" },
  { id: "desarrollo", src: "docs/desarrollo.md", label: "Desarrollo", hint: "Requisitos y flujo de trabajo" },
  { id: "pruebas", src: "docs/pruebas.md", label: "Pruebas", hint: "Niveles y cómo correrlos" },
  { id: "despliegue", src: "docs/despliegue.md", label: "Despliegue", hint: "Publicar en Cloudflare" },
];
const CREDIT_HTML = 'Design with love ❤️ by <a href="https://tewaconsulting.com" target="_blank" rel="noopener">Tewa</a> &amp; <a href="https://www.linkedin.com/in/luismulato" target="_blank" rel="noopener">Luis Mulato</a>';
const byPath = new Map(PAGES.map((p) => [p.src, p]));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unesc = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const stripTags = (s) => unesc(s.replace(/<[^>]+>/g, ""));
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Resolve a markdown link written inside `fromSrc` to either an HTML page or a repo-file marker.
function resolveHref(fromSrc, href) {
  if (/^(https?:|mailto:)/.test(href)) return { external: href };
  if (href.startsWith("#")) return { anchor: href };
  const [file, hash = ""] = href.split("#");
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(fromSrc), file));
  const page = byPath.get(target);
  if (page) return { page: page.id + ".html" + (hash ? "#" + hash : "") };
  return { repoFile: target };
}

function render(page) {
  const md = fs.readFileSync(path.join(ROOT, page.src), "utf8");
  let html = marked.parse(md, { gfm: true });
  const headings = [];
  const used = new Set();

  // heading ids + collect for the table of contents
  html = html.replace(/<h([1-4])>([\s\S]*?)<\/h\1>/g, (_, lvl, inner) => {
    let id = slug(stripTags(inner)) || "seccion";
    while (used.has(id)) id += "-2";
    used.add(id);
    if (lvl === "2" || lvl === "3") headings.push({ lvl: +lvl, id, text: stripTags(inner) });
    const anchor = lvl === "1" ? "" : `<a class="anchor" href="#${id}" aria-label="Enlace a esta sección">#</a>`;
    return `<h${lvl} id="${id}">${inner}${anchor}</h${lvl}>`;
  });

  // links: other documents -> .html, repo files -> non-clickable chip, external -> new tab
  html = html.replace(/<a href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g, (all, href, rest, text) => {
    if (all.includes('class="anchor"')) return all;
    const r = resolveHref(page.src, unesc(href));
    if (r.external) return `<a href="${esc(r.external)}" target="_blank" rel="noopener">${text}</a>`;
    if (r.anchor) return `<a href="${esc(r.anchor)}">${text}</a>`;
    if (r.page) return `<a href="${r.page}">${text}</a>`;
    return `<span class="repo-file" title="Archivo del repositorio: ${esc(r.repoFile)}">${text}</span>`;
  });

  // mermaid diagrams, code blocks with a copy button, scrollable tables
  let hasMermaid = false;
  html = html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, (_, code) => {
    hasMermaid = true;
    return `<pre class="mermaid">${code}</pre>`;
  });
  html = html.replace(/<pre><code(?: class="language-([\w-]+)")?>([\s\S]*?)<\/code><\/pre>/g, (_, lang, code) =>
    `<div class="code-block"><button type="button" class="copy" data-copy>Copiar</button>${lang ? `<span class="lang">${lang}</span>` : ""}<pre><code>${code}</code></pre></div>`);
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, '<div class="table-wrap"><table>$1</table></div>');

  // The "Design with love" credit closes every markdown file; in HTML it lives in the page footer, not in the article.
  html = html.replace(/\s*<hr\s*\/?>\s*<p>Design with love[\s\S]*?<\/p>\s*$/, "\n");

  const title = stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, page.label])[1]);
  return { html, headings, title, hasMermaid, text: stripTags(html).replace(/\s+/g, " ").trim() };
}

function layout(page, idx, r) {
  const prev = PAGES[idx - 1], next = PAGES[idx + 1];
  const nav = PAGES.map((p) =>
    `<li><a href="${p.id}.html"${p.id === page.id ? ' aria-current="page"' : ""}><span class="nav-label">${esc(p.label)}</span><span class="nav-hint">${esc(p.hint)}</span></a></li>`).join("");
  const toc = r.headings.length
    ? `<aside class="toc" aria-label="En esta página"><p>En esta página</p><ul>${r.headings.map((h) => `<li class="l${h.lvl}"><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")}</ul></aside>`
    : "";
  const pager = `<nav class="pager" aria-label="Páginas">${prev ? `<a class="prev" href="${prev.id}.html"><small>Anterior</small>${esc(prev.label)}</a>` : "<span></span>"}${next ? `<a class="next" href="${next.id}.html"><small>Siguiente</small>${esc(next.label)}</a>` : "<span></span>"}</nav>`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${esc(idx === 0 ? "Leadership Lab · Documentación" : r.title + " · Leadership Lab")}</title>
<meta name="description" content="Documentación técnica de Leadership Lab: stack, arquitectura, ambientes, base de datos, desarrollo, pruebas y despliegue.">
<link rel="stylesheet" href="assets/docs.css">
</head>
<body${r.hasMermaid ? ' data-mermaid="' + MERMAID + '"' : ""}>
<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="topbar">
  <button type="button" class="menu-btn" aria-label="Abrir el menú" aria-expanded="false" aria-controls="sidebar">☰</button>
  <a class="brand" href="index.html">Leadership Lab <span>Documentación</span></a>
  <button type="button" class="theme-btn" aria-label="Cambiar entre modo claro y oscuro" title="Cambiar tema"></button>
</header>
<div class="shell">
  <nav class="sidebar" id="sidebar" aria-label="Documentación">
    <div class="search">
      <input type="search" id="q" placeholder="Buscar en la documentación" aria-label="Buscar en la documentación" autocomplete="off">
      <ul id="results" class="results" hidden></ul>
    </div>
    <ul class="nav">${nav}</ul>
    <p class="side-foot">Generado desde los archivos <code>.md</code>.<br>Para cambiarlo, editá el markdown y corré <code>make docs</code>.</p>
  </nav>
  <main id="contenido" class="content">
    <article class="doc">
${r.html}
    </article>
    ${pager}
    <footer class="credit">${CREDIT_HTML}</footer>
  </main>
  ${toc}
</div>
<script src="assets/search-index.js"></script>
<script src="assets/docs.js"></script>
${r.hasMermaid ? `<script src="${MERMAID}" defer></script>` : ""}
</body>
</html>
`;
}

fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
const index = [];
PAGES.forEach((page, i) => {
  const r = render(page);
  fs.writeFileSync(path.join(OUT, page.id + ".html"), layout(page, i, r));
  index.push({ id: page.id, url: page.id + ".html", title: i === 0 ? "Inicio" : page.label, text: r.text.slice(0, 6000) });
});
fs.writeFileSync(path.join(OUT, "assets/search-index.js"), "/* GENERATED by scripts/build-docs.mjs */\nwindow.DOCS_INDEX = " + JSON.stringify(index) + ";\n");
console.log(`docs/html ready: ${PAGES.length} pages`);
