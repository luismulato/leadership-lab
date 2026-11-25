#!/usr/bin/env python3 -I
# Compone public/index.html: estilos base del Team Canvas + estilos y contenido propios de la retro.
import pathlib, re
root = pathlib.Path(__file__).resolve().parent
tc = (root.parent.parent / "packages" / "canvas-base" / "team-canvas.html").read_text(encoding="utf8")
css = tc[tc.index("<style>") + 7: tc.index("</style>")]
css = re.sub(r'url\("/_blob/[0-9a-f]+"\)', 'url("/retro/img/retro-canvas.svg")', css)
# se quita el reset repetido del bloque base y los estilos del podcast, que esta app no usa
css = css[css.index("/* Layout"):] if "/* Layout" in css else css
css = re.sub(r"/\* Podcast \*/.*?(?=/\* Cuerpo \*/)", "", css, flags=re.S)
src = (root / "index.src.html").read_text(encoding="utf8")
out = src.replace("/*BASE_CSS*/", css)
assert "/_blob/" not in out
(root / "public" / "index.html").write_text(out, encoding="utf8")
print("ok", len(out))
