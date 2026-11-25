CREATE TABLE orgs (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  readonly INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE decisions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL REFERENCES orgs(code),
  data TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX decisions_code ON decisions(code, at);
