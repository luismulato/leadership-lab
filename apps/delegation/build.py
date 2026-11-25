#!/usr/bin/env python3 -I
# Genera public/index.html a partir de src/index.src.html y comprueba que no queden restos de la plataforma original.
import pathlib, re
root = pathlib.Path(__file__).resolve().parent
src = (root / "src" / "index.src.html").read_text(encoding="utf8")
for malo in ["window.claude", "claude.use", "claude.ai", "Contributor", "Bayer", "_blob"]:
    assert malo.lower() not in src.lower(), "quedó una referencia a: " + malo
assert not re.search("[\U0001F300-\U0001FAFF☀-➿]", src), "hay un emoji"
(root / "public").mkdir(exist_ok=True)
(root / "public" / "index.html").write_text(src, encoding="utf8")
print("ok", len(src))
