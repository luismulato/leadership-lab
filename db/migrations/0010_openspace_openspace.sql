CREATE TABLE eventos (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pregunta TEXT NOT NULL DEFAULT '',
  lugares TEXT NOT NULL,
  horarios TEXT NOT NULL,
  facilitador TEXT NOT NULL,
  demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE sesiones (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL REFERENCES eventos(code),
  titulo TEXT NOT NULL,
  autor TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT '',
  lugar INTEGER NOT NULL,
  hora INTEGER NOT NULL,
  interes INTEGER NOT NULL DEFAULT 0,
  token TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'propuesta',
  notas TEXT NOT NULL DEFAULT '',
  decisiones TEXT NOT NULL DEFAULT '',
  proximo_paso TEXT NOT NULL DEFAULT '',
  at TEXT NOT NULL
);
-- una sola tarjeta por celda lugar x horario
CREATE UNIQUE INDEX sesiones_celda ON sesiones(code, lugar, hora);
