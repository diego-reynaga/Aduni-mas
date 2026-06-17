-- Semilla de usuarios de prueba para el esquema limpio `aduniplus`.
-- Borra todas las cuentas existentes y crea un set controlado para pruebas.
--
-- Ejecucion sugerida desde la raiz del proyecto:
--   mysql -u root -p aduniplus < database/seed_usuarios_prueba.sql

USE aduniplus;

START TRANSACTION;

-- Limpiar datos transaccionales que dependen de usuario para poder borrar cuentas
-- sin romper llaves foraneas.
DELETE FROM auditoria;
DELETE FROM error_importacion_excel;
DELETE FROM calificacion_competencia_trimestre;
DELETE FROM calificacion_detalle_trimestre;
DELETE FROM nota;
DELETE FROM calificacion;
DELETE FROM promedio_academico;
DELETE FROM importacion_excel;
DELETE FROM usuario_rol;
DELETE FROM usuario;

INSERT INTO rol (nombre)
VALUES
  ('ADMINISTRADOR'),
  ('DOCENTE'),
  ('ESTUDIANTE'),
  ('PADRE_FAMILIA')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

SET @rol_admin = (SELECT id FROM rol WHERE nombre = 'ADMINISTRADOR');
SET @rol_docente = (SELECT id FROM rol WHERE nombre = 'DOCENTE');
SET @rol_estudiante = (SELECT id FROM rol WHERE nombre = 'ESTUDIANTE');
SET @rol_padre = (SELECT id FROM rol WHERE nombre = 'PADRE_FAMILIA');

-- Estructura academica minima para probar importacion, registro y consulta.
INSERT INTO gestion_academica (anio, nombre, fecha_inicio, fecha_fin, activa)
VALUES (2025, 'Gestion academica 2025', '2025-03-01', '2025-12-20', TRUE)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  nombre = VALUES(nombre),
  fecha_inicio = VALUES(fecha_inicio),
  fecha_fin = VALUES(fecha_fin),
  activa = VALUES(activa);
SET @gestion_id = LAST_INSERT_ID();

INSERT INTO nivel_educativo (gestion_academica_id, nombre, turno, descripcion, activo)
VALUES (@gestion_id, 'SECUNDARIA', 'MANANA', 'Nivel de prueba para 1RO ALFA', TRUE)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  descripcion = VALUES(descripcion),
  activo = VALUES(activo);
SET @nivel_id = LAST_INSERT_ID();

INSERT INTO periodo_academico (gestion_academica_id, nombre, orden, fecha_inicio, fecha_fin, cerrado)
VALUES
  (@gestion_id, 'I TRIMESTRE', 1, '2025-03-01', '2025-05-31', FALSE),
  (@gestion_id, 'II TRIMESTRE', 2, '2025-06-01', '2025-08-31', FALSE),
  (@gestion_id, 'III TRIMESTRE', 3, '2025-09-01', '2025-12-20', FALSE)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  orden = VALUES(orden),
  fecha_inicio = VALUES(fecha_inicio),
  fecha_fin = VALUES(fecha_fin),
  cerrado = VALUES(cerrado);
SET @periodo_i = (SELECT id FROM periodo_academico WHERE gestion_academica_id = @gestion_id AND orden = 1);
SET @periodo_ii = (SELECT id FROM periodo_academico WHERE gestion_academica_id = @gestion_id AND orden = 2);
SET @periodo_iii = (SELECT id FROM periodo_academico WHERE gestion_academica_id = @gestion_id AND orden = 3);

INSERT INTO aula (nivel_educativo_id, nombre, paralelo, activo)
VALUES (@nivel_id, 'PRIMERO', 'A', TRUE)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  activo = VALUES(activo);
SET @aula_id = LAST_INSERT_ID();

INSERT INTO asignatura (codigo, nombre, area, activa)
VALUES ('MAT-1A', 'MATEMATICA', 'MATEMATICA', TRUE)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  nombre = VALUES(nombre),
  area = VALUES(area),
  activa = VALUES(activa);
SET @asignatura_id = LAST_INSERT_ID();

INSERT INTO curso (aula_id, asignatura_id, activo)
VALUES (@aula_id, @asignatura_id, TRUE)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  activo = VALUES(activo);
SET @curso_id = LAST_INSERT_ID();

-- Personas y usuarios de prueba.
INSERT INTO persona (
  tipo_persona, tipo_documento, numero_documento, nombre_persona, apellido_persona,
  estado_persona, correo_persona, genero_persona, direccion, telefono
)
VALUES (
  'Persona', 'DNI', 'TEST-ADMIN-001', 'ADMIN', 'ADUNI',
  TRUE, 'admin.test@aduniplus.local', NULL, 'San Jeronimo', '900000001'
)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  tipo_persona = VALUES(tipo_persona),
  nombre_persona = VALUES(nombre_persona),
  apellido_persona = VALUES(apellido_persona),
  estado_persona = VALUES(estado_persona),
  correo_persona = VALUES(correo_persona),
  direccion = VALUES(direccion),
  telefono = VALUES(telefono);
SET @persona_admin = LAST_INSERT_ID();

INSERT INTO persona (
  tipo_persona, tipo_documento, numero_documento, nombre_persona, apellido_persona,
  estado_persona, correo_persona, genero_persona, direccion, telefono
)
VALUES (
  'DOCENTE', 'DNI', 'TEST-DOC-001', 'DANIEL', 'CARDENAS',
  TRUE, 'docente.test@aduniplus.local', 'MASCULINO', 'San Jeronimo', '900000002'
)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  tipo_persona = VALUES(tipo_persona),
  nombre_persona = VALUES(nombre_persona),
  apellido_persona = VALUES(apellido_persona),
  estado_persona = VALUES(estado_persona),
  correo_persona = VALUES(correo_persona),
  genero_persona = VALUES(genero_persona),
  direccion = VALUES(direccion),
  telefono = VALUES(telefono);
SET @persona_docente = LAST_INSERT_ID();

INSERT INTO docente (persona_id, codigo_docente, especialidad, area_academica, activo)
VALUES (@persona_docente, 'DOC-TEST-001', 'Matematica', 'MATEMATICA', TRUE)
ON DUPLICATE KEY UPDATE
  codigo_docente = VALUES(codigo_docente),
  especialidad = VALUES(especialidad),
  area_academica = VALUES(area_academica),
  activo = VALUES(activo);

INSERT INTO persona (
  tipo_persona, tipo_documento, numero_documento, nombre_persona, apellido_persona,
  estado_persona, correo_persona, genero_persona, direccion, telefono
)
VALUES (
  'APODERADO', 'DNI', 'TEST-PADRE-001', 'FAMILIA', 'PRUEBA',
  TRUE, 'familia.test@aduniplus.local', NULL, 'San Jeronimo', '900000003'
)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  tipo_persona = VALUES(tipo_persona),
  nombre_persona = VALUES(nombre_persona),
  apellido_persona = VALUES(apellido_persona),
  estado_persona = VALUES(estado_persona),
  correo_persona = VALUES(correo_persona),
  direccion = VALUES(direccion),
  telefono = VALUES(telefono);
SET @persona_padre = LAST_INSERT_ID();

INSERT INTO apoderado (persona_id, ocupacion, activo)
VALUES (@persona_padre, 'Apoderado de prueba', TRUE)
ON DUPLICATE KEY UPDATE
  ocupacion = VALUES(ocupacion),
  activo = VALUES(activo);

INSERT INTO persona (
  tipo_persona, tipo_documento, numero_documento, nombre_persona, apellido_persona,
  estado_persona, correo_persona, genero_persona, direccion, telefono
)
VALUES (
  'ESTUDIANTE', 'DNI', 'TEST-EST-001', 'YHOSHUA ADRIEL', 'APARCO BERROCAL',
  TRUE, 'estudiante.aparco@aduniplus.local', 'MASCULINO', 'San Jeronimo', '900000011'
)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  tipo_persona = VALUES(tipo_persona),
  nombre_persona = VALUES(nombre_persona),
  apellido_persona = VALUES(apellido_persona),
  estado_persona = VALUES(estado_persona),
  correo_persona = VALUES(correo_persona),
  genero_persona = VALUES(genero_persona),
  direccion = VALUES(direccion),
  telefono = VALUES(telefono);
SET @persona_est_1 = LAST_INSERT_ID();

INSERT INTO estudiante (persona_id, codigo_estudiante, activo)
VALUES (@persona_est_1, 'EST-EXCEL-001', TRUE)
ON DUPLICATE KEY UPDATE
  codigo_estudiante = VALUES(codigo_estudiante),
  activo = VALUES(activo);

INSERT INTO persona (
  tipo_persona, tipo_documento, numero_documento, nombre_persona, apellido_persona,
  estado_persona, correo_persona, genero_persona, direccion, telefono
)
VALUES (
  'ESTUDIANTE', 'DNI', 'TEST-EST-002', 'DANILO', 'ATAO MAUCAYLLE',
  TRUE, 'estudiante.atao@aduniplus.local', 'MASCULINO', 'San Jeronimo', '900000012'
)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  tipo_persona = VALUES(tipo_persona),
  nombre_persona = VALUES(nombre_persona),
  apellido_persona = VALUES(apellido_persona),
  estado_persona = VALUES(estado_persona),
  correo_persona = VALUES(correo_persona),
  genero_persona = VALUES(genero_persona),
  direccion = VALUES(direccion),
  telefono = VALUES(telefono);
SET @persona_est_2 = LAST_INSERT_ID();

INSERT INTO estudiante (persona_id, codigo_estudiante, activo)
VALUES (@persona_est_2, 'EST-EXCEL-002', TRUE)
ON DUPLICATE KEY UPDATE
  codigo_estudiante = VALUES(codigo_estudiante),
  activo = VALUES(activo);

INSERT INTO persona (
  tipo_persona, tipo_documento, numero_documento, nombre_persona, apellido_persona,
  estado_persona, correo_persona, genero_persona, direccion, telefono
)
VALUES (
  'ESTUDIANTE', 'DNI', 'TEST-EST-003', 'BRITNY', 'CARBAJAL QUIQUINLLA',
  TRUE, 'estudiante.carbajal@aduniplus.local', 'FEMENINO', 'San Jeronimo', '900000013'
)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  tipo_persona = VALUES(tipo_persona),
  nombre_persona = VALUES(nombre_persona),
  apellido_persona = VALUES(apellido_persona),
  estado_persona = VALUES(estado_persona),
  correo_persona = VALUES(correo_persona),
  genero_persona = VALUES(genero_persona),
  direccion = VALUES(direccion),
  telefono = VALUES(telefono);
SET @persona_est_3 = LAST_INSERT_ID();

INSERT INTO estudiante (persona_id, codigo_estudiante, activo)
VALUES (@persona_est_3, 'EST-EXCEL-003', TRUE)
ON DUPLICATE KEY UPDATE
  codigo_estudiante = VALUES(codigo_estudiante),
  activo = VALUES(activo);

INSERT INTO apoderadoestudiante (apoderado_id, estudiante_id, parentesco, es_principal, estado)
VALUES (@persona_padre, @persona_est_1, 'APODERADO', TRUE, TRUE)
ON DUPLICATE KEY UPDATE
  parentesco = VALUES(parentesco),
  es_principal = VALUES(es_principal),
  estado = VALUES(estado);

INSERT INTO matricula (codigo_matricula, estudiante_id, aula_id, fecha_matricula, estado)
VALUES
  ('MATR-TEST-001', @persona_est_1, @aula_id, '2025-03-01', 'ACTIVA'),
  ('MATR-TEST-002', @persona_est_2, @aula_id, '2025-03-01', 'ACTIVA'),
  ('MATR-TEST-003', @persona_est_3, @aula_id, '2025-03-01', 'ACTIVA')
ON DUPLICATE KEY UPDATE
  aula_id = VALUES(aula_id),
  fecha_matricula = VALUES(fecha_matricula),
  estado = VALUES(estado);

SET @matricula_est_1 = (SELECT id FROM matricula WHERE codigo_matricula = 'MATR-TEST-001');
SET @matricula_est_2 = (SELECT id FROM matricula WHERE codigo_matricula = 'MATR-TEST-002');
SET @matricula_est_3 = (SELECT id FROM matricula WHERE codigo_matricula = 'MATR-TEST-003');

INSERT INTO detallematricula (matricula_id, asignatura_id, fecha_registro, estado)
VALUES
  (@matricula_est_1, @asignatura_id, '2025-03-01', TRUE),
  (@matricula_est_2, @asignatura_id, '2025-03-01', TRUE),
  (@matricula_est_3, @asignatura_id, '2025-03-01', TRUE)
ON DUPLICATE KEY UPDATE
  fecha_registro = VALUES(fecha_registro),
  estado = VALUES(estado);

INSERT INTO asignaciondocente (docente_id, curso_id, periodo_academico_id, fecha_asignacion, estado)
VALUES
  (@persona_docente, @curso_id, @periodo_i, '2025-03-01', 'ACTIVA'),
  (@persona_docente, @curso_id, @periodo_ii, '2025-06-01', 'ACTIVA'),
  (@persona_docente, @curso_id, @periodo_iii, '2025-09-01', 'ACTIVA')
ON DUPLICATE KEY UPDATE
  fecha_asignacion = VALUES(fecha_asignacion),
  estado = VALUES(estado);

-- Cuentas. Las contrasenas estan hasheadas con BCrypt.
INSERT INTO usuario (username, password, activo, persona_id)
VALUES ('admin.test', '$2a$10$zz9YdWnm50Ml.xA.mzk6UOoCWj2h0aUmWbJlcqQWiskYpOdUS4jG2', TRUE, @persona_admin)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  username = VALUES(username),
  password = VALUES(password),
  activo = VALUES(activo),
  persona_id = VALUES(persona_id);
SET @usuario_admin = LAST_INSERT_ID();

INSERT INTO usuario (username, password, activo, persona_id)
VALUES ('docente.test', '$2a$10$koyqELBVnFZuDWXGMKl6dOOJ0uD4CZ8Itg7SYRWIHmnm8Y1qLbpP6', TRUE, @persona_docente)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  username = VALUES(username),
  password = VALUES(password),
  activo = VALUES(activo),
  persona_id = VALUES(persona_id);
SET @usuario_docente = LAST_INSERT_ID();

INSERT INTO usuario (username, password, activo, persona_id)
VALUES ('familia.test', '$2a$10$yhLVDjKPCUPauh3PpJfpg.VPP6WY0K2SliIOIjm4UA1ctF3nYRa5e', TRUE, @persona_padre)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  username = VALUES(username),
  password = VALUES(password),
  activo = VALUES(activo),
  persona_id = VALUES(persona_id);
SET @usuario_padre = LAST_INSERT_ID();

INSERT INTO usuario (username, password, activo, persona_id)
VALUES ('estudiante.aparco', '$2a$10$A.1U0TYMKpfz2oT4JdBydOjBxBhmpdbq0enUZesGDH7ZIrH8sAgdC', TRUE, @persona_est_1)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  username = VALUES(username),
  password = VALUES(password),
  activo = VALUES(activo),
  persona_id = VALUES(persona_id);
SET @usuario_est_1 = LAST_INSERT_ID();

INSERT INTO usuario (username, password, activo, persona_id)
VALUES ('estudiante.atao', '$2a$10$A.1U0TYMKpfz2oT4JdBydOjBxBhmpdbq0enUZesGDH7ZIrH8sAgdC', TRUE, @persona_est_2)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  username = VALUES(username),
  password = VALUES(password),
  activo = VALUES(activo),
  persona_id = VALUES(persona_id);
SET @usuario_est_2 = LAST_INSERT_ID();

INSERT INTO usuario (username, password, activo, persona_id)
VALUES ('estudiante.carbajal', '$2a$10$A.1U0TYMKpfz2oT4JdBydOjBxBhmpdbq0enUZesGDH7ZIrH8sAgdC', TRUE, @persona_est_3)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  username = VALUES(username),
  password = VALUES(password),
  activo = VALUES(activo),
  persona_id = VALUES(persona_id);
SET @usuario_est_3 = LAST_INSERT_ID();

INSERT INTO usuario_rol (usuario_id, rol_id)
VALUES
  (@usuario_admin, @rol_admin),
  (@usuario_docente, @rol_docente),
  (@usuario_padre, @rol_padre),
  (@usuario_est_1, @rol_estudiante),
  (@usuario_est_2, @rol_estudiante),
  (@usuario_est_3, @rol_estudiante)
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

COMMIT;
