#!/usr/bin/env python3 -I
# Compone public/index.html: estilos base del Team Canvas + estilos y contenido propios del listado de emociones.
import pathlib, re, json
root = pathlib.Path(__file__).resolve().parent
tc = (root.parent.parent / "packages" / "canvas-base" / "team-canvas.html").read_text(encoding="utf8")
css = tc[tc.index("<style>") + 7: tc.index("</style>")]
css = re.sub(r'url\("/_blob/[0-9a-f]+"\)', 'url("/emociones/img/emociones-medidor.svg")', css)
css = css[css.index("/* Layout"):] if "/* Layout" in css else css
css = re.sub(r"/\* Podcast \*/.*?(?=/\* Cuerpo \*/)", "", css, flags=re.S)
words = json.dumps(json.loads((root / "functions" / "words.json").read_text(encoding="utf8")), ensure_ascii=False, separators=(",", ":"))
src = (root / "index.src.html").read_text(encoding="utf8")
out = src.replace("/*BASE_CSS*/", css).replace("/*WORDS_JSON*/null", words.replace("</", "<\\/"))
assert "/_blob/" not in out and "WORDS_JSON" not in out
(root / "public" / "index.html").write_text(out, encoding="utf8")
print("ok", len(out))
