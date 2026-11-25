/* Aplica el tema activo (skin/activo.json) al shell y a las apps embebidas (mismo origen). */
(function () {
  var BASE = new URL("./", document.currentScript.src).href;       // .../skin/
  var cssHref = null;

  function addCss(doc, href) {
    var l = doc.createElement("link"); l.rel = "stylesheet"; l.href = href; l.dataset.skin = "1";
    doc.head.appendChild(l);
  }
  function aplicarEnFrame() {
    var f = document.getElementById("app-frame");
    try {
      var d = f.contentDocument;
      if (!d || !d.head || !cssHref || d.querySelector("link[data-skin]")) return;
      addCss(d, cssHref);
    } catch (e) { /* otro origen o PDF: se deja como está */ }
  }
  function montarLogo(src) {
    var sb = document.getElementById("sidebar");
    if (!sb || sb.querySelector(".skin-logo")) return;
    var img = new Image(); img.className = "skin-logo"; img.alt = ""; img.src = src;
    sb.insertBefore(img, sb.firstChild);
  }

  fetch(new URL("../app-admin/api/estado", BASE).href, { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .catch(function () { return { activo: "default" }; })
    .then(function (a) {
      var tema = (a && /^[a-z0-9-]+$/.test(a.activo)) ? a.activo : "default";
      var dir = BASE + "temas/" + tema + "/";
      return fetch(dir + "tema.json", { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw 0; return r.json();
      }).then(function (t) { return { dir: dir, t: t }; })
        .catch(function () { return fetch(BASE + "temas/default/tema.json").then(function (r) { return r.json(); }).then(function (t) { return { dir: BASE + "temas/default/", t: t }; }); });
    })
    .then(function (x) {
      cssHref = x.dir + "tema.css";
      addCss(document, cssHref);
      document.documentElement.style.setProperty("--footer-h", x.t.sponsors ? (window.innerWidth <= 700 ? "76px" : "98px") : "30px");
      // El crédito vive en index.html (no depende del tema); el tema solo suma los sponsors.
      if (x.t.sponsors) {
        var sp = new Image(); sp.className = "skin-sponsors"; sp.alt = ""; sp.src = x.dir + x.t.sponsors;
        document.getElementById("skin-footer").insertBefore(sp, document.getElementById("skin-footer").firstChild);
      }
      if (x.t.logo) {
        var mo = new MutationObserver(function () { montarLogo(x.dir + x.t.logo); });
        mo.observe(document.getElementById("sidebar"), { childList: true });
        montarLogo(x.dir + x.t.logo);
      }
      var f = document.getElementById("app-frame");
      f.addEventListener("load", aplicarEnFrame);
      aplicarEnFrame();
    });
})();
