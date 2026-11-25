#!/usr/bin/env python3 -I
# Genera apps/team-canvas/public/index.html a partir de packages/canvas-base/team-canvas.html (la versión del artefacto), cambiando solo la capa de plataforma.
import re, pathlib
root = pathlib.Path(__file__).resolve().parent
src = (root.parent.parent / "packages" / "canvas-base" / "team-canvas.html").read_text(encoding="utf8")

SHIM = r'''<script>
/* Capa para sitio público: ofrece la misma interfaz que usaba el artefacto, sobre la API propia (/api) y descargas normales. */
(function () {
  function api(method, path, body) {
    return fetch("/team-canvas/api" + path, { method: method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || "No se pudo completar la acción."); e.code = r.status === 404 ? "not_found" : "api_" + r.status; e.status = r.status; throw e; } return j; }); });
  }
  function ref(path) {
    var p = path.split("/"), code = p[1], id = p[3];
    return {
      id: id || code, path: path,
      get: function () {
        return api("GET", "/canvases/" + code).then(function (c) { return { exists: true, data: function () { return c; } }; })
          .catch(function (e) { if (e.status === 404) return { exists: false, data: function () { return undefined; } }; throw e; });
      },
      set: function (d) { return api("POST", "/canvases", { code: code, name: d.name }).then(function () {}); },
      update: function (d) { return api("PATCH", "/canvases/" + code + "/notes/" + id, { text: d.text }).then(function () {}); },
      delete: function () { return api("DELETE", "/canvases/" + code + "/notes/" + id).then(function () {}); }
    };
  }
  function notesCol(path) {
    var code = path.split("/")[1];
    return {
      add: function (n) { return api("POST", "/canvases/" + code + "/notes", { sec: n.sec, text: n.text }).then(function (r) { return { id: r.id }; }); },
      onSnapshot: function (next, onErr) {
        var stop = false, timer = null, last = "";
        function tick() {
          if (stop) return;
          api("GET", "/canvases/" + code + "/notes").then(function (r) {
            if (stop) return;
            var s = JSON.stringify(r.notes);
            if (s !== last || last === "") { last = s; next({ docs: r.notes.map(function (n) { return { id: n.id, data: function () { return { sec: n.sec, text: n.text, at: n.at }; } }; }) }); }
          }).catch(function (e) { if (onErr && !stop) onErr(e); }).then(function () { if (!stop) timer = setTimeout(tick, document.hidden ? 15000 : 4000); });
        }
        tick();
        return function () { stop = true; clearTimeout(timer); };
      }
    };
  }
  var db = {
    doc: function (p) { return ref(p); },
    collection: function (p) { return notesCol(p); }
  };
  var downloads = {
    save: function (o) {
      return new Promise(function (resolve) {
        var blob = o.data instanceof Blob ? o.data : new Blob([o.data], { type: "application/pdf" });
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = o.filename;
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        resolve({ status: "saved" });
      });
    }
  };
  var mcp = {
    callTool: function () {
      return fetch("/team-canvas/canvas-equipos-que-enamoran.pdf").then(function (r) { if (!r.ok) throw { code: "tool_error" }; return r.arrayBuffer(); })
        .then(function (buf) { var u = new Uint8Array(buf), s = "", i; for (i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return { payload: { content: btoa(s) } }; });
    }
  };
  var user = { id: function () { return Promise.resolve(null); }, can: function () { return true; } };
  window.claude = { use: function (n) { return Promise.resolve({ db: db, downloads: downloads, mcp: mcp, user: user }[n] || null); } };
})();
</script>
'''

head_end = src.index('<div id="v-guide">')
head, body = src[:head_end], src[head_end:]
head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
head = head.replace('<script src="https://cdnjs', SHIM + '<script src="https://cdnjs', 1)
head = head.replace('<style>', '<style>\n:root { color-scheme: light; }\nbody { margin: 0; }\nimg { max-width: 100%; }\n[hidden] { display: none !important; }', 1)
page = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="description" content="Guía, podcast y constructor colaborativo del Canvas de Equipos que Enamoran.">\n'
        + head + '</head>\n<body>\n' + body + '\n</body>\n</html>\n')

# recursos propios en lugar de los del artefacto
page = page.replace('/_blob/4668ef65b915728d2d2a7a9d8be07bfe', '/team-canvas/img/canvas.png')
for i, h in enumerate(["c7c323e386249a1e77c0cb08e5706541", "ed541ac919636a5bdca636bdc696b35d", "18e314aaa2ab8c5bfb4d6b6d4856c58f", "c187dfa1ad3dda538d1a55884fcdf487", "ab9dfe918d5cd99aea4cfa8b01bda013"], 1):
    page = page.replace('/_blob/' + h, '/team-canvas/audio/ep%d.mp4' % i)
page = page.replace('Para armar un canvas hace falta el almacenamiento de Claude. Abrí la página desde claude.ai.', 'No pude conectar con el servidor. Revisá tu conexión y recargá la página.')
page = page.replace('El almacenamiento compartido no está disponible. Abrí esta página con tu sesión de claude.ai.', 'No pude conectar con el servidor. Revisá tu conexión y recargá la página.')
# ---- Ejemplo de ACME (ACME01): solo lectura, botón de entrada, link #ejemplo y aviso arriba ----
def swap(a, b):
    global page
    assert page.count(a) == 1, "no encontré el bloque a reemplazar: " + a[:60]
    page = page.replace(a, b)

swap('<div class="b-notice" id="b-ro" hidden>',
     '<div class="b-notice" id="b-ex" hidden><span>Ejemplo ficticio de ACME. Es de solo lectura.</span><button class="btn sm primary" id="b-mine" type="button">Armar el mío</button></div>\n        <div class="b-notice" id="b-ro" hidden>')
swap('<button class="btn sm" id="b-join" type="submit">Entrar</button></div>',
     '<button class="btn sm" id="b-join" type="submit">Entrar</button></div>\n            <p class="b-acme-line">¿Solo quieres ver cómo funciona? <button class="btn sm quiet" id="b-acme" type="button">Abrir el ejemplo de ACME</button></p>')
# el canvas de ejemplo no se puede editar ni queda en "recientes"
swap('S.code = code; S.name = knownName || (s.data() || {}).name || code;',
     'S.code = code; S.name = knownName || (s.data() || {}).name || code; S.example = !!(s.data() || {}).locked; S.canWrite = !S.example;')
swap('$("b-ro").hidden = S.canWrite;',
     '$("b-ro").hidden = S.canWrite || !!S.example; $("b-ex").hidden = !S.example; $("b-chip").hidden = !!S.example; $("b-leave").textContent = S.example ? "Volver" : "Salir";')
OPEN_EXAMPLE = (
    'function openExample(code) {\n'
    '    var tries = 0;\n'
    '    (function wait() { if (S.db) { enter(code || "ACME01"); return; } if (++tries < 50) setTimeout(wait, 100); else err("No pude conectar con el servidor. Revisá tu conexión y recargá la página."); })();\n'
    '  }\n'
    '  $("b-acme").addEventListener("click", function () { if (S.code) leave(); enter("ACME01"); });\n'
    '  $("b-mine").addEventListener("click", function () { leave(); S.canWrite = true; $("in-name").focus(); });\n'
    '  setTimeout(function () {\n'
    '    var h = location.hash; /* se lee antes de go(), que reescribe el hash a #armar */\n'
    '    if (h === "#armar") go("build");\n'
    '    else if (h === "#ejemplo") { go("build"); openExample(); try { history.replaceState(null, "", "#ejemplo"); } catch (e) {} }\n'
    '    else if (/^#[A-Za-z0-9]{6}$/.test(h)) { go("build"); openExample(h.slice(1).toUpperCase()); }\n'
    '  }, 0);')
swap('setTimeout(function () { if (location.hash === "#armar") go("build"); }, 0);', OPEN_EXAMPLE)
swap('<style>\n', '<style>\n.b-panel p.b-acme-line{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font-size:14px;margin:0}\n')

assert '/_blob/' not in page, "quedó una referencia al artefacto"
(root / "public" / "index.html").write_text(page, encoding="utf8")
print("ok", len(page))
