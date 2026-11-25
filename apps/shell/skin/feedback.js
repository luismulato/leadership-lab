/* Feedback button: a side tab that opens a panel with the feedback form (Tally) embedded.
   The form URL comes from the environment config (config/environments.json -> feedback_form_url, injected by
   scripts/build.py as window.LL_ENV.feedbackFormUrl). Empty URL = no button.
   Nothing from Tally is loaded until the panel is opened for the first time. */
(function () {
  var formUrl = (window.LL_ENV && window.LL_ENV.feedbackFormUrl) || "";
  if (!formUrl) return;

  var TALLY_SCRIPT = "https://tally.so/widgets/embed.js";
  var d = document, loaded = false;

  function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  var tab = el("button", "fb-tab", "Feedback");
  tab.type = "button"; tab.setAttribute("aria-haspopup", "dialog"); tab.setAttribute("aria-expanded", "false");

  var overlay = el("div", "fb-overlay"); overlay.hidden = true;
  var panel = el("div", "fb-panel");
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-labelledby", "fb-title"); panel.tabIndex = -1;
  var head = el("div", "fb-head");
  var title = el("h2", "fb-title", "Feedback"); title.id = "fb-title";
  var close = el("button", "fb-close", "×"); close.type = "button"; close.setAttribute("aria-label", "Cerrar");
  head.appendChild(title); head.appendChild(close);
  var body = el("div", "fb-body");
  // Fallback: the same form in a new window. A discreet bar right under the title; the main option when the embed cannot load.
  var fallback = el("p", "fb-fallback");
  var fbMsg = el("span", "fb-msg", "¿No se ve el formulario? ");
  var fbLink = el("a", "fb-link", "Abrilo en una ventana nueva ↗");
  fbLink.href = formUrl; fbLink.target = "_blank"; fbLink.setAttribute("rel", "noopener");
  fallback.appendChild(fbMsg); fallback.appendChild(fbLink);
  // Another way to reach the author. It is only added to the fallback when the embed fails (see fail()).
  var fbContact = el("span", "fb-contact", "O contacta a ");
  var fbContactLink = el("a", "", "Luis Mulato");
  fbContactLink.href = "https://www.linkedin.com/in/luismulato/"; fbContactLink.target = "_blank"; fbContactLink.setAttribute("rel", "noopener");
  fbContact.appendChild(fbContactLink);
  panel.appendChild(head); panel.appendChild(fallback); panel.appendChild(body); overlay.appendChild(panel);

  var timer = null, frame = null;
  // The embed could not load (script blocked, offline, or the iframe never finished): show the link to the form in a new window as the main option.
  function fail() {
    clearTimeout(timer);
    panel.classList.add("fb-failed");
    fbMsg.textContent = "No pudimos mostrar el formulario acá. ";
    fbLink.textContent = "Abrir el formulario en una ventana nueva ↗";
    fallback.classList.add("fb-main");
    if (!fbContact.parentNode) fallback.appendChild(fbContact);
    if (frame) frame.hidden = true;
  }

  // Same embed as the code provided by Tally: an iframe with data-tally-src plus the loader script.
  function load() {
    if (loaded) return; loaded = true;
    if (navigator.onLine === false) { fail(); return; }
    var f = d.createElement("iframe");
    f.setAttribute("data-tally-src", formUrl);
    f.setAttribute("loading", "lazy"); f.setAttribute("width", "100%"); f.setAttribute("height", "829");
    f.setAttribute("frameborder", "0"); f.setAttribute("marginheight", "0"); f.setAttribute("marginwidth", "0");
    f.setAttribute("title", "Formulario de Feedback");
    frame = f;
    f.addEventListener("load", function () { if (f.getAttribute("src")) clearTimeout(timer); });
    timer = setTimeout(fail, 10000);   // if the iframe has not loaded by then, offer the link
    body.appendChild(f);
    var v = function () {
      if ("undefined" != typeof Tally) Tally.loadEmbeds();
      else d.querySelectorAll("iframe[data-tally-src]:not([src])").forEach(function (e) { e.src = e.dataset.tallySrc; });
    };
    if ("undefined" != typeof Tally) v();
    else if (d.querySelector('script[src="' + TALLY_SCRIPT + '"]') == null) {
      var s = d.createElement("script"); s.src = TALLY_SCRIPT; s.onload = v; s.onerror = fail; d.body.appendChild(s);
    }
  }

  function open() {
    load();
    if (navigator.onLine === false && !panel.classList.contains("fb-failed")) fail();
    overlay.hidden = false; tab.setAttribute("aria-expanded", "true"); d.documentElement.classList.add("fb-open"); panel.focus();
  }
  function shut() {
    if (overlay.hidden) return;
    overlay.hidden = true; tab.setAttribute("aria-expanded", "false"); d.documentElement.classList.remove("fb-open"); tab.focus();
  }

  tab.addEventListener("click", open);
  close.addEventListener("click", shut);
  overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) shut(); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") shut(); });

  function mount() { d.body.appendChild(tab); d.body.appendChild(overlay); }
  if (d.body) mount(); else d.addEventListener("DOMContentLoaded", mount);
})();
