/* Leadership Lab docs: theme toggle, mobile menu, search, copy buttons, mermaid, table-of-contents highlight. No dependencies. */
(function () {
  var root = document.documentElement;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function dark() { return root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; }

  // theme
  var saved = store("ll-docs-theme");
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  var themeBtn = document.querySelector(".theme-btn");
  themeBtn.addEventListener("click", function () {
    root.dataset.theme = dark() ? "light" : "dark";
    store("ll-docs-theme", root.dataset.theme);
    renderMermaid();
  });

  // mobile menu
  var menuBtn = document.querySelector(".menu-btn");
  function setMenu(open) { document.body.classList.toggle("menu-open", open); menuBtn.setAttribute("aria-expanded", String(open)); }
  menuBtn.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setMenu(false); results.hidden = true; } });
  document.querySelectorAll(".nav a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("click", function (e) { if (document.body.classList.contains("menu-open") && !e.target.closest(".sidebar") && !e.target.closest(".menu-btn")) setMenu(false); });

  // copy buttons
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.parentNode.querySelector("code").innerText;
      function done(ok) { btn.textContent = ok ? "Copiado" : "Seleccioná y copiá"; setTimeout(function () { btn.textContent = "Copiar"; }, 1600); }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      else { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand("copy"); } catch (e) {} ta.remove(); done(ok); }
    });
  });

  // search (index is a plain script so it also works from file://)
  var input = document.getElementById("q"), results = document.getElementById("results");
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function search(q) {
    var words = norm(q).split(/\s+/).filter(Boolean), out = [];
    (window.DOCS_INDEX || []).forEach(function (p) {
      var t = norm(p.text), title = norm(p.title), score = 0, first = -1;
      for (var i = 0; i < words.length; i++) {
        var at = t.indexOf(words[i]);
        if (at < 0 && title.indexOf(words[i]) < 0) return;
        if (title.indexOf(words[i]) >= 0) score += 10;
        if (at >= 0) { score += 1; if (first < 0) first = at; }
      }
      var from = Math.max(0, first - 40), snippet = first < 0 ? "" : (from ? "…" : "") + p.text.slice(from, from + 110) + "…";
      out.push({ p: p, score: score, snippet: snippet });
    });
    return out.sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
  }
  input.addEventListener("input", function () {
    var q = input.value.trim();
    if (q.length < 2) { results.hidden = true; return; }
    var found = search(q);
    results.innerHTML = found.length
      ? found.map(function (r) { return '<li><a href="' + r.p.url + '"><b>' + esc(r.p.title) + "</b><small>" + esc(r.snippet) + "</small></a></li>"; }).join("")
      : '<li><a href="#" onclick="return false"><small>Sin resultados</small></a></li>';
    results.hidden = false;
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".search")) results.hidden = true; });
  document.addEventListener("keydown", function (e) { if (e.key === "/" && document.activeElement !== input && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); } });

  // mermaid (loaded from CDN only on pages with diagrams; offline the source stays readable).
  // The original diagram text is saved NOW, before the library loads: mermaid auto-renders on load and would replace it with the SVG.
  document.querySelectorAll("pre.mermaid").forEach(function (n) { n.dataset.src = n.textContent; });
  function renderMermaid() {
    if (!window.mermaid) return;
    var nodes = document.querySelectorAll("pre.mermaid");
    nodes.forEach(function (n) { n.textContent = n.dataset.src; n.removeAttribute("data-processed"); });
    window.mermaid.initialize({ startOnLoad: false, theme: dark() ? "dark" : "neutral", securityLevel: "strict" });
    window.mermaid.run({ nodes: nodes });
  }
  var m = document.querySelector("script[src*='mermaid']");
  if (m) m.addEventListener("load", renderMermaid);

  // table of contents highlight
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (links.length && "IntersectionObserver" in window) {
    var map = {}; links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { links.forEach(function (a) { a.classList.remove("active"); }); map[en.target.id].classList.add("active"); } });
    }, { rootMargin: "-70px 0px -70% 0px" });
    Object.keys(map).forEach(function (id) { var h = document.getElementById(id); if (h) io.observe(h); });
  }
})();
