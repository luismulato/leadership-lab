CREATE TABLE canvases (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL REFERENCES canvases(code),
  sec TEXT NOT NULL,
  text TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX notes_code ON notes(code, at);
