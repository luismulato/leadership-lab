CREATE TABLE emo_boards (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE emo_checkins (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL REFERENCES emo_boards(code),
  nick TEXT NOT NULL,
  word TEXT NOT NULL,
  quadrant TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  need TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX emo_checkins_code ON emo_checkins(code, at);
