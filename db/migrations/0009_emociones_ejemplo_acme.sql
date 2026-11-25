-- Ejemplo ficticio de ACME, solo lectura. Código fijo ACME01.
ALTER TABLE emo_boards ADD COLUMN example INTEGER NOT NULL DEFAULT 0;
INSERT INTO emo_boards (code, name, created_at, example) VALUES ('ACME01', 'Check-in del lunes · Experiencia Cliente de ACME', '2026-10-26T09:00:00.000Z', 1);
INSERT INTO emo_checkins (id, code, nick, word, quadrant, note, need, owner, at) VALUES
 ('ACMEEJ001', 'ACME01', 'Marta', 'Orgulloso', 'aa', 'El lanzamiento salió y el equipo se la jugó entera. Quiero que se note.', 'reconocimiento', 'ejemplo-sin-dueno', '2026-10-26T09:01:00.000Z'),
 ('ACMEEJ002', 'ACME01', 'Diego', 'Abrumado', 'ad', 'El viernes entraron 40 reembolsos y siguen abiertos. No sé por cuál empezar.', 'claridad', 'ejemplo-sin-dueno', '2026-10-26T09:02:00.000Z'),
 ('ACMEEJ003', 'ACME01', 'Lucía', 'Tenso', 'ad', 'Todavía me late el chat del lanzamiento. Reviso el celular a cada rato.', 'seguridad', 'ejemplo-sin-dueno', '2026-10-26T09:03:00.000Z'),
 ('ACMEEJ004', 'ACME01', 'Tomás', 'Frustrado', 'ad', 'La herramienta nueva no deja reasignar tickets en lote y perdí media mañana.', 'autonomía', 'ejemplo-sin-dueno', '2026-10-26T09:04:00.000Z'),
 ('ACMEEJ005', 'ACME01', 'Valeria', 'Cansado', 'bd', 'Dormí poco desde el lanzamiento. Hoy voy más lento.', 'descanso', 'ejemplo-sin-dueno', '2026-10-26T09:05:00.000Z'),
 ('ACMEEJ006', 'ACME01', 'Joaquín', 'Satisfecho', 'ba', 'Bajó el tiempo de primera respuesta y se nota en los mensajes de clientes.', 'contribución', 'ejemplo-sin-dueno', '2026-10-26T09:06:00.000Z'),
 ('ACMEEJ007', 'ACME01', 'Camila', 'Tranquilo', 'ba', 'Armé mi lista del día y por fin sé qué viene primero.', 'claridad', 'ejemplo-sin-dueno', '2026-10-26T09:07:00.000Z'),
 ('ACMEEJ008', 'ACME01', 'Nico', 'Curioso', 'aa', 'Quiero entender por qué subieron los reembolsos antes de opinar.', 'aprendizaje', 'ejemplo-sin-dueno', '2026-10-26T09:08:00.000Z');
