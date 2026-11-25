/* Inicio tipo appstore: arma el menú lateral desde window.APPS y dibuja el catálogo en el home.
   Colores y tipografías salen de los tokens del skin activo (--bg, --fg, --muted, --border, --card, --accent). */
(function () {
  var APPS = window.APPS || [], CATS = window.CATEGORIAS || [], ICONOS = window.ICONOS || {};
  var idx = {}; APPS.forEach(function (a, i) { a._i = i; idx[a.id] = a; });

  /* --- Menú lateral: disponibles abren embebidas; "pronto" quedan en un grupo gris --- */
  function mini(a) {
    return '<span class="mini" style="background:var(--ico-' + (a._i % 3) + ', ' + a.color + ')"><svg viewBox="0 0 24 24">' + (ICONOS[a.icono] || "") + "</svg></span>";
  }
  var disp = APPS.filter(function (a) { return a.estado === "disponible" && a.url; });
  var pronto = APPS.filter(function (a) { return a.estado !== "disponible" || !a.url; });
  window.DASHBOARD_MENU = disp.map(function (a) { return { kind: "app", id: a.id, label: a.nombre, icon: mini(a), href: a.url }; })
    .concat(!pronto.length ? [] : [{ kind: "group", label: "Próximamente", icon: "", items: pronto.map(function (a) { return { kind: "planned", label: a.nombre, icon: mini(a) }; }) }]);

  /* --- Home --- */
  var state = { q: "", cat: "Todas" }, lastFocus = null;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function icon(a) {
    var d = el("span", "ico"); d.style.background = "var(--ico-" + (a._i % 3) + ", " + a.color + ")"; d.setAttribute("aria-hidden", "true");
    d.innerHTML = '<svg viewBox="0 0 24 24">' + (ICONOS[a.icono] || "") + "</svg>"; return d;
  }
  function abrir(a) { var dlg = document.getElementById("store-dlg"); if (dlg && dlg.open) dlg.close(); location.hash = a.id; }
  function boton(a) {
    if (a.estado === "disponible" && a.url) { var b = el("button", "pill", "Abrir"); b.type = "button"; b.addEventListener("click", function (e) { e.stopPropagation(); abrir(a); }); return b; }
    var p = el("button", "pill off", "Pronto"); p.disabled = true; return p;
  }
  function match(a) {
    if (state.cat !== "Todas" && a.categoria !== state.cat) return false;
    return !state.q || norm(a.nombre + " " + a.subtitulo + " " + a.resumen).indexOf(norm(state.q)) >= 0;
  }

  window.DASHBOARD_EXTRA_HOME = function (root) {
    var store = el("div", "store"); root.appendChild(store);
    var feat = el("div"), chips = el("div", "chips"), groups = el("div");
    var search = el("input", "store-search"); search.type = "search"; search.placeholder = "Buscar apps"; search.setAttribute("aria-label", "Buscar apps");
    search.addEventListener("input", function () { state.q = search.value.trim(); renderGroups(); });
    var dlg = el("dialog"); dlg.id = "store-dlg"; var sheet = el("div", "sheet"); dlg.appendChild(sheet);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
    store.appendChild(feat); store.appendChild(search); store.appendChild(chips); store.appendChild(groups); store.appendChild(dlg);

    var hoy = idx["team-canvas"] || disp[0];
    if (hoy) {
      var f = el("article", "feature"); f.appendChild(el("p", "mono", "Recomendado del día")); f.appendChild(el("h2", "", hoy.nombre)); f.appendChild(el("p", "", hoy.resumen));
      var row = el("div", "feature-row"); row.appendChild(icon(hoy)); row.appendChild(boton(hoy));
      var more = el("button", "close", "Ver ficha"); more.type = "button"; more.addEventListener("click", function () { ficha(hoy, more); }); row.appendChild(more);
      f.appendChild(row); feat.appendChild(f);
    }

    function renderChips() {
      chips.textContent = "";
      ["Todas"].concat(CATS).forEach(function (c) {
        var b = el("button", "chip", c); b.type = "button"; b.setAttribute("aria-pressed", String(state.cat === c));
        b.addEventListener("click", function () { state.cat = c; renderChips(); renderGroups(); }); chips.appendChild(b);
      });
    }
    function renderGroups() {
      groups.textContent = ""; var any = false;
      [["disponible", "Disponibles"], ["pronto", "Próximamente"]].forEach(function (g) {
        var items = APPS.filter(function (a) { return a.estado === g[0] && match(a); }); if (!items.length) return; any = true;
        var s = el("section", "group"); s.appendChild(el("h3", "", g[1])); var l = el("div", "list");
        items.forEach(function (a) {
          var r = el("div", "row"); r.tabIndex = 0; r.setAttribute("role", "button"); r.setAttribute("aria-label", "Ver ficha de " + a.nombre); r.appendChild(icon(a));
          var i = el("div", "info"); i.appendChild(el("b", "", a.nombre)); i.appendChild(el("span", "", a.subtitulo)); i.appendChild(el("span", "mono", a.categoria)); r.appendChild(i);
          r.appendChild(boton(a));
          r.addEventListener("click", function () { ficha(a, r); });
          r.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ficha(a, r); } });
          l.appendChild(r);
        });
        s.appendChild(l);
        if (g[0] === "pronto") {   // closing call to action of the coming-soon section; it only exists while that section is shown
          var note = el("p", "soon-note");
          var link = el("a", "", "Enterate de primera mano");
          link.href = "https://www.linkedin.com/in/luismulato"; link.target = "_blank"; link.setAttribute("rel", "noopener");
          note.appendChild(link); note.appendChild(document.createTextNode(" →")); s.appendChild(note);
        }
        groups.appendChild(s);
      });
      if (!any) groups.appendChild(el("p", "empty", "No encontramos apps con ese filtro."));
    }
    function ficha(a, from) {
      lastFocus = from; sheet.textContent = "";
      var head = el("div", "sheet-head"); head.appendChild(icon(a)); var t = el("div"); t.appendChild(el("h2", "", a.nombre)); t.appendChild(el("span", "mono", a.categoria)); head.appendChild(t); sheet.appendChild(head);
      sheet.appendChild(el("p", "", a.resumen)); sheet.appendChild(el("p", "mono", "Qué incluye"));
      var ul = el("ul"); (a.incluye || []).forEach(function (x) { ul.appendChild(el("li", "", x)); }); sheet.appendChild(ul);
      var meta = el("div", "meta"); meta.appendChild(el("span", "mono", "Sale del " + a.dia + " del taller")); sheet.appendChild(meta);
      var acts = el("div", "acts"); var c = el("button", "close", "Cerrar"); c.type = "button"; c.addEventListener("click", function () { dlg.close(); });
      if (a.estado === "disponible" && a.ejemplo) { var ex = el("a", "close", "Ver ejemplo de ACME"); ex.href = a.ejemplo; ex.target = "_blank"; ex.rel = "noopener"; acts.appendChild(ex); }
      acts.appendChild(c); acts.appendChild(boton(a)); sheet.appendChild(acts); dlg.showModal();
    }
    renderChips(); renderGroups();
  };
})();
