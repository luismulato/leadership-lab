// Motor genérico de dashboards de Hogar. Esta misma página
// (apps/dashboard/index.html) sirve cualquier nivel del árbol — qué
// mostrar lo define el query param ?menu=<ruta a un menu.js>,
// relativa a este directorio (apps/dashboard/).
//
// Ese menu.js define:
//   window.DASHBOARD_INFO = { title, lead }
//   window.DASHBOARD_UP = { label, href } | null        (link "volver")
//   window.DASHBOARD_MENU = [
//     { id, label, icon, kind: "page", href, desc },   // navega (misma pestaña si es
//                                                       // relativa; nueva pestaña si href
//                                                       // es absoluta http(s) — sitio externo)
//     { id, label, icon, kind: "app",  href, desc },   // embebe en iframe acá mismo
//     { id, label, icon, kind: "planned", desc },       // gris, sin link
//     { kind: "group", label, icon, items: [...] },     // sección colapsable en el sidebar
//                                                       // (1.5.0) y en el home (1.6.0);
//                                                       // items acepta las mismas entradas,
//                                                       // incluido otro "group" (un nivel de anidado)
//     { kind: "separator" },
//   ]
//   window.DASHBOARD_DEPENDENCIES = ["ruta/a/otro-data.js", ...]  // opcional
//   window.DASHBOARD_EXTRA_HOME = function(container) {...}       // opcional
//
// Todos los `href` (de "page", "app" y de DASHBOARD_UP) y las rutas de
// DASHBOARD_DEPENDENCIES son relativos a apps/dashboard/, no a la
// carpeta original del menu.js — es la página real la que decide
// desde dónde se resuelven.

(function () {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(s);
    });
  }

  function fail(message) {
    document.body.innerHTML = `<p style="padding:2rem;font-family:-apple-system,sans-serif;color:#b91c1c">${message}</p>`;
  }

  function isExternal(href) {
    return /^https?:\/\//i.test(href || "");
  }

  const menuPath = new URLSearchParams(location.search).get("menu");
  if (!menuPath) {
    fail("Falta el parámetro <code>?menu=</code> en la URL.");
    return;
  }

  loadScript(menuPath)
    .then(() => {
      const deps = window.DASHBOARD_DEPENDENCIES || [];
      return deps.reduce((p, dep) => p.then(() => loadScript(dep)), Promise.resolve());
    })
    .then(init)
    .catch((err) => fail(`Error cargando el dashboard: ${err.message}`));

  function init() {
    const info = window.DASHBOARD_INFO || { title: "Hogar", lead: "" };
    const up = window.DASHBOARD_UP || null;
    const menu = window.DASHBOARD_MENU || [];

    const sidebar = document.getElementById("sidebar");
    const homePanel = document.getElementById("home-panel");
    const frame = document.getElementById("app-frame");
    const appShell = document.getElementById("app-shell");
    const sidebarOpenBtn = document.getElementById("sidebar-open-btn");

    document.title = info.title;

    /* El shell no tiene selector de tema propio (desde 1.3.0): el
       control vive dentro de cada app embebida, que es donde el
       usuario lo ve aplicarse sobre el contenido real. Un botón en el
       shell no puede re-tematizar un <iframe> ya cargado — solo podía
       dejarle un default al próximo load, así que parecía roto. El
       chrome del shell sigue el tema del sistema vía
       prefers-color-scheme (ver style.css). */

    /* --- Keys de localStorage derivadas de DASHBOARD_INFO.title, mismo
       patrón que usaba el theme-picker (ver CHANGELOG 1.1.0) — así las
       3 copias del motor no chocan si terminan bajo el mismo origen. */
    function slugify(s) {
      return (s || "dashboard")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "dashboard";
    }
    const KEY_PREFIX = `dashboard-${slugify(info.title)}`;

    /* --- Colapsar/mostrar sidebar entera (estilo Notion), desde 1.4.0 --- */
    const SIDEBAR_STORAGE_KEY = `${KEY_PREFIX}-sidebar-collapsed`;

    function setSidebarCollapsed(collapsed) {
      appShell.classList.toggle("sidebar-collapsed", collapsed);
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
    }
    sidebarOpenBtn.addEventListener("click", () => setSidebarCollapsed(false));
    setSidebarCollapsed(localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1");

    /* --- Grupos colapsables del menú (desde 1.5.0) ---
       Cada grupo persiste su estado colapsado por separado, con key
       derivada del label. Por defecto: expandido (mostrar todo). Los
       botones "contraer/expandir todo" recorren el registro. */
    const groupRegistry = [];

    function groupKey(label) {
      return `${KEY_PREFIX}-grp-${slugify(label)}`;
    }

    function setGroupCollapsed(rec, collapsed) {
      rec.el.classList.toggle("collapsed", collapsed);
      rec.headerBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      try {
        localStorage.setItem(rec.key, collapsed ? "1" : "0");
      } catch (e) {}
    }

    function menuHasGroups(entries) {
      return (entries || []).some(
        (e) => e && (e.kind === "group" || (e.items && menuHasGroups(e.items)))
      );
    }

    const SVG_CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
    const SVG_COLLAPSE_ALL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 13l5-5 5 5"/><path d="M7 19l5-5 5 5"/></svg>';
    const SVG_EXPAND_ALL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11l5 5 5-5"/><path d="M7 5l5 5 5-5"/></svg>';

    function buildToolbar(barClass, btnClass, registry, setter) {
      const toolbar = document.createElement("div");
      toolbar.className = barClass;
      [
        ["Contraer todo", "Contraer todos los grupos", SVG_COLLAPSE_ALL, true],
        ["Expandir todo", "Expandir todos los grupos", SVG_EXPAND_ALL, false],
      ].forEach(([title, aria, svg, collapsed]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = btnClass;
        btn.title = title;
        btn.setAttribute("aria-label", aria);
        btn.innerHTML = svg;
        btn.addEventListener("click", () =>
          registry.forEach((rec) => setter(rec, collapsed))
        );
        toolbar.appendChild(btn);
      });
      return toolbar;
    }

    /* --- Sidebar --- */
    if (up) {
      const upEl = document.createElement("a");
      upEl.className = "nav-up";
      upEl.href = up.href;
      upEl.textContent = `← ${up.label}`;
      sidebar.appendChild(upEl);
    }

    const headerEl = document.createElement("div");
    headerEl.className = "sidebar-header";
    const titleEl = document.createElement("div");
    titleEl.className = "sidebar-title";
    titleEl.textContent = info.title;
    const collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "sidebar-toggle-btn";
    collapseBtn.title = "Ocultar barra lateral";
    collapseBtn.setAttribute("aria-label", "Ocultar barra lateral");
    collapseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><path d="M14 9l-2 3 2 3"/></svg>';
    collapseBtn.addEventListener("click", () => setSidebarCollapsed(true));
    headerEl.appendChild(titleEl);
    headerEl.appendChild(collapseBtn);
    sidebar.appendChild(headerEl);

    const homeItem = document.createElement("a");
    homeItem.className = "nav-item";
    homeItem.dataset.target = "home";
    homeItem.innerHTML = `<span class="nav-icon">🏠</span> Inicio`;
    sidebar.appendChild(homeItem);

    const sep = document.createElement("div");
    sep.className = "nav-sep";
    sidebar.appendChild(sep);

    const navItems = [homeItem];

    /* Barra minimalista "contraer todo / expandir todo" — solo si el
       menú tiene al menos un grupo. Desde 1.6.0 la arma una función
       compartida: el sidebar y el home usan los mismos 2 SVG, cada uno
       sobre su propio registro de grupos. */
    if (menuHasGroups(menu)) {
      sidebar.appendChild(
        buildToolbar("nav-toolbar", "nav-toolbar-btn", groupRegistry, setGroupCollapsed)
      );
    }

    function renderNavEntries(entries, container) {
      (entries || []).forEach((entry) => {
        if (!entry) return;
        if (entry.kind === "separator") {
          const s = document.createElement("div");
          s.className = "nav-sep";
          container.appendChild(s);
          return;
        }
        if (entry.kind === "group") {
          const groupEl = document.createElement("div");
          groupEl.className = "nav-group";
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "nav-group-header";
          btn.innerHTML =
            `<span class="nav-group-chevron">${SVG_CHEVRON}</span>` +
            `<span class="nav-group-label">${entry.icon ? entry.icon + " " : ""}${entry.label || ""}</span>`;
          const body = document.createElement("div");
          body.className = "nav-group-body";
          groupEl.appendChild(btn);
          groupEl.appendChild(body);
          container.appendChild(groupEl);

          const rec = { el: groupEl, headerBtn: btn, key: groupKey(entry.label) };
          groupRegistry.push(rec);
          let stored = null;
          try {
            stored = localStorage.getItem(rec.key);
          } catch (e) {}
          setGroupCollapsed(rec, stored === "1"); // default (null) => expandido
          btn.addEventListener("click", () =>
            setGroupCollapsed(rec, !groupEl.classList.contains("collapsed"))
          );

          renderNavEntries(entry.items, body);
          return;
        }
        if (entry.kind === "planned") {
          const el = document.createElement("span");
          el.className = "nav-item disabled";
          el.title = "Próximamente";
          el.innerHTML = `<span class="nav-icon">${entry.icon || "•"}</span> ${entry.label}`;
          container.appendChild(el);
          return;
        }
        if (entry.kind === "page") {
          const el = document.createElement("a");
          el.className = "nav-item";
          el.href = entry.href;
          if (isExternal(entry.href)) {
            el.target = "_blank";
            el.rel = "noopener noreferrer";
          }
          el.innerHTML = `<span class="nav-icon">${entry.icon || "•"}</span> ${entry.label}${isExternal(entry.href) ? ' <span class="nav-external">↗</span>' : ""}`;
          container.appendChild(el);
          return;
        }
        if (entry.kind === "app") {
          const el = document.createElement("a");
          el.className = "nav-item";
          el.dataset.target = entry.id;
          el.dataset.src = entry.href;
          el.innerHTML = `<span class="nav-icon">${entry.icon || "•"}</span> ${entry.label}`;
          container.appendChild(el);
          navItems.push(el);
          return;
        }
      });
    }

    renderNavEntries(menu, sidebar);

    /* --- Grupos colapsables del home (desde 1.6.0) ---
       Mismo mecanismo que los del sidebar, pero registro y keys propios
       (`-home-grp-`): el home arranca COLAPSADO por defecto (la grilla
       se lee como un índice de categorías) mientras que el sidebar
       sigue arrancando expandido. Así ninguno pisa el estado del otro. */
    const homeGroupRegistry = [];

    function homeGroupKey(label) {
      return `${KEY_PREFIX}-home-grp-${slugify(label)}`;
    }

    function setHomeGroupCollapsed(rec, collapsed) {
      rec.el.classList.toggle("collapsed", collapsed);
      rec.headerBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      try {
        localStorage.setItem(rec.key, collapsed ? "1" : "0");
      } catch (e) {}
    }

    /* --- Home: título + grilla de categorías + extra opcional --- */
    const h1 = document.createElement("h1");
    h1.textContent = info.title;
    const lead = document.createElement("p");
    lead.className = "lead";
    lead.textContent = info.lead || "";
    homePanel.appendChild(h1);
    homePanel.appendChild(lead);

    function cardFor(entry) {
      if (entry.kind === "planned") {
        const card = document.createElement("div");
        card.className = "category-card disabled";
        card.innerHTML = `
          <span class="category-card-icon">${entry.icon || "•"}</span>
          <span class="category-card-title">${entry.label}</span>
          <span class="category-card-desc">${entry.desc || ""}</span>
          <span class="category-card-tag">Próximamente</span>`;
        return card;
      }
      const card = document.createElement(entry.kind === "page" ? "a" : "div");
      card.className = "category-card";
      if (entry.kind === "page") {
        card.href = entry.href;
        if (isExternal(entry.href)) {
          card.target = "_blank";
          card.rel = "noopener noreferrer";
        }
      }
      if (entry.kind === "app") {
        card.dataset.target = entry.id;
        card.dataset.src = entry.href;
      }
      card.innerHTML = `
        <span class="category-card-icon">${entry.icon || "•"}</span>
        <span class="category-card-title">${entry.label}${entry.kind === "page" && isExternal(entry.href) ? ' <span class="category-card-external">↗</span>' : ""}</span>
        <span class="category-card-desc">${entry.desc || ""}</span>`;
      return card;
    }

    function renderCards(entries, container, depth) {
      let currentGrid = null;
      const flushGrid = () => { currentGrid = null; };
      (entries || []).forEach((entry) => {
        if (!entry || entry.kind === "separator") { flushGrid(); return; }
        if (entry.kind === "group") {
          flushGrid();
          const groupEl = document.createElement("section");
          groupEl.className = `category-group depth-${depth}`;
          const heading = document.createElement("button");
          heading.type = "button";
          heading.className = `category-group-heading depth-${depth}`;
          heading.innerHTML =
            `<span class="category-group-chevron">${SVG_CHEVRON}</span>` +
            `<span class="category-group-label">${entry.icon ? entry.icon + " " : ""}${entry.label || ""}</span>`;
          const body = document.createElement("div");
          body.className = "category-group-body";
          groupEl.appendChild(heading);
          groupEl.appendChild(body);
          container.appendChild(groupEl);

          const rec = { el: groupEl, headerBtn: heading, key: homeGroupKey(entry.label) };
          homeGroupRegistry.push(rec);
          let stored = null;
          try {
            stored = localStorage.getItem(rec.key);
          } catch (e) {}
          setHomeGroupCollapsed(rec, stored !== "0"); // default (null) => colapsado
          heading.addEventListener("click", () =>
            setHomeGroupCollapsed(rec, !groupEl.classList.contains("collapsed"))
          );

          renderCards(entry.items, body, depth + 1);
          return;
        }
        if (!currentGrid) {
          currentGrid = document.createElement("div");
          currentGrid.className = "category-grid";
          container.appendChild(currentGrid);
        }
        currentGrid.appendChild(cardFor(entry));
      });
    }

    if (menuHasGroups(menu)) {
      const wrap = document.createElement("div");
      wrap.className = "category-groups";
      renderCards(menu, wrap, 0);
      homePanel.appendChild(
        buildToolbar("home-toolbar", "home-toolbar-btn", homeGroupRegistry, setHomeGroupCollapsed)
      );
      homePanel.appendChild(wrap);
    } else {
      const grid = document.createElement("div");
      grid.className = "category-grid";
      menu.forEach((entry) => {
        if (entry.kind === "separator") return;
        grid.appendChild(cardFor(entry));
      });
      homePanel.appendChild(grid);
    }

    homePanel.addEventListener("click", (e) => {
      const card = e.target.closest(".category-card[data-target]");
      if (!card) return;
      location.hash = card.dataset.target;
      activate(card.dataset.target);
    });

    if (typeof window.DASHBOARD_EXTRA_HOME === "function") {
      const extra = document.createElement("div");
      homePanel.appendChild(extra);
      window.DASHBOARD_EXTRA_HOME(extra);
    }

    /* --- Routing: home vs. app embebida en iframe --- */
    function activate(target) {
      navItems.forEach((el) => el.classList.toggle("active", el.dataset.target === target));

      if (target === "home" || !navItems.some((el) => el.dataset.target === target)) {
        homePanel.hidden = false;
        frame.hidden = true;
        return;
      }

      homePanel.hidden = true;
      frame.hidden = false;
      const item = navItems.find((el) => el.dataset.target === target);

      /* Si el ítem activo vive dentro de grupos colapsados, expandirlos
         para que quede visible en el sidebar. */
      let node = item.parentElement;
      while (node && node !== sidebar) {
        if (node.classList && node.classList.contains("nav-group")) {
          const rec = groupRegistry.find((r) => r.el === node);
          if (rec) setGroupCollapsed(rec, false);
        }
        node = node.parentElement;
      }

      if (frame.dataset.loaded !== item.dataset.src) {
        frame.src = item.dataset.src;
        frame.dataset.loaded = item.dataset.src;
      }
    }

    navItems.forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const target = el.dataset.target;
        location.hash = target === "home" ? "" : target;
        activate(target);
      });
    });

    window.addEventListener("hashchange", () => {
      activate(location.hash.replace("#", "") || "home");
    });

    activate(location.hash.replace("#", "") || "home");
  }
})();
