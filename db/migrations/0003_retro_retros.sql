CREATE TABLE retros (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phase INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL REFERENCES retros(code),
  phase INTEGER NOT NULL,
  lens TEXT NOT NULL,
  text TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0,
  at TEXT NOT NULL
);
CREATE INDEX items_code ON items(code, at);
