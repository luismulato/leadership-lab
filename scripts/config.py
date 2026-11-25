#!/usr/bin/env python3 -I
"""Read config/environments.json.

Usage:
  config.py envs                      list environment names
  config.py get <env> <dotted.path>   print a value, e.g. `get dev local.port` (empty string if missing)
  config.py app-ids                   list the apps under apps/ that are part of the site (one per line)
  config.py set <env> <path> <value>  persist a value (used by cloudflare-bootstrap.sh)
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG_FILE = ROOT / "config" / "environments.json"
APPS_DIR = ROOT / "apps"


def load():
    return json.loads(CFG_FILE.read_text(encoding="utf8"))


def resolve(cfg, env, dotted):
    """Environment config with `target` etc.; dotted path inside it."""
    node = cfg["environments"][env]
    for key in dotted.split(".") if dotted else []:
        node = node.get(key, "") if isinstance(node, dict) else ""
    return node


def app_ids():
    return sorted(p.name for p in APPS_DIR.iterdir() if p.is_dir() and p.name != "shell")


def main(argv):
    cmd = argv[1] if len(argv) > 1 else ""
    cfg = load()
    if cmd == "envs":
        print("\n".join(cfg["environments"]))
    elif cmd == "get":
        value = resolve(cfg, argv[2], argv[3])
        print("" if value is None else value if not isinstance(value, bool) else str(value).lower())
    elif cmd == "app-ids":
        print("\n".join(app_ids()))
    elif cmd == "set":
        env, dotted, value = argv[2], argv[3], argv[4]
        node = cfg["environments"][env]
        *path, last = dotted.split(".")
        for key in path:
            node = node[key]
        node[last] = value
        CFG_FILE.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
