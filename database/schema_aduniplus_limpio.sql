CREATE DATABASE IF NOT EXISTS aduniplus
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aduniplus;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS calificacion_competencia_trimestre;
DROP TABLE IF EXISTS calificacion_detalle_trimestre;
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS error_importacion_excel;
DROP TABLE IF EXISTS nota;
DROP TABLE IF EXISTS promedio_academico;
DROP TABLE IF EXISTS calificacion;
DROP TABLE IF EXISTS importacion_excel;
DROP TABLE IF EXISTS evaluacion;
DROP TABLE IF EXISTS asignaciondocente;
DROP TABLE IF EXISTS detallematricula;
DROP TABLE IF EXISTS apoderadoestudiante;
DROP TABLE IF EXISTS matricula;
DROP TABLE IF EXISTS curso;
DROP TABLE IF EXISTS asignatura;
DROP TABLE IF EXISTS aula;
DROP TABLE IF EXISTS periodo_academico;
DROP TABLE IF EXISTS nivel_educativo;
DROP TABLE IF EXISTS gestion_academica;
DROP TABLE IF EXISTS configuracion_institucional;
DROP TABLE IF EXISTS usuario_rol;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS rol;
DROP TABLE IF EXISTS apoderado;
DROP TABLE IF EXISTS estudiante;
DROP TABLE IF EXISTS docente;
DROP TABLE IF EXISTS persona;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE persona (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tipo_persona VARCHAR(30) NOT NULL,
  tipo_documento VARCHAR(20) NOT NULL DEFAULT 'DNI',
  numero_documento VARCHAR(20) NOT NULL,
  nombre_persona VARCHAR(100) NOT NULL,
  apellido_persona VARCHAR(120) NOT NULL,
  fech_naci_persona DATE NULL,
  estado_persona BOOLEAN NOT NULL DEFAULT TRUE,
  correo_persona VARCHAR(150) NULL,
  genero_persona VARCHAR(20) NULL,
  direccion VARCHAR(150) NULL,
  telefono VARCHAR(20) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_persona_documento (numero_documento),
  UNIQUE KEY uk_persona_correo (correo_persona)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rol (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(30) NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_rol_nombre (nombre),
  CONSTRAINT chk_rol_nombre CHECK (nombre IN ('ADMINISTRADOR','DOCENTE','ESTUDIANTE','PADRE_FAMILIA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuario (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(80) NOT NULL,
  password VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  persona_id BIGINT NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuario_username (username),
  UNIQUE KEY uk_usuario_persona (persona_id),
  CONSTRAINT fk_usuario_persona FOREIGN KEY (persona_id) REFERENCES persona(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuario_rol (
  usuario_id BIGINT NOT NULL,
  rol_id BIGINT NOT NULL,
  PRIMARY KEY (usuario_id, rol_id),
  CONSTRAINT fk_usuario_rol_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  CONSTRAINT fk_usuario_rol_rol FOREIGN KEY (rol_id) REFERENCES rol(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE docente (
  persona_id BIGINT NOT NULL,
  codigo_docente VARCHAR(30) NOT NULL,
  especialidad VARCHAR(100) NULL,
  area_academica VARCHAR(100) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (persona_id),
  UNIQUE KEY uk_docente_codigo (codigo_docente),
  CONSTRAINT fk_docente_persona FOREIGN KEY (persona_id) REFERENCES persona(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE estudiante (
  persona_id BIGINT NOT NULL,
  codigo_estudiante VARCHAR(30) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (persona_id),
  UNIQUE KEY uk_estudiante_codigo (codigo_estudiante),
  CONSTRAINT fk_estudiante_persona FOREIGN KEY (persona_id) REFERENCES persona(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE apoderado (
  persona_id BIGINT NOT NULL,
  ocupacion VARCHAR(100) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (persona_id),
  CONSTRAINT fk_apoderado_persona FOREIGN KEY (persona_id) REFERENCES persona(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gestion_academica (
  id BIGINT NOT NULL AUTO_INCREMENT,
  anio INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  fecha_inicio DATE NULL,
  fecha_fin DATE NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_gestion_academica_anio (anio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE nivel_educativo (
  id BIGINT NOT NULL AUTO_INCREMENT,
  gestion_academica_id BIGINT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  turno VARCHAR(20) NOT NULL,
  descripcion VARCHAR(250) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_nivel_gestion_nombre_turno (gestion_academica_id, nombre, turno),
  CONSTRAINT fk_nivel_gestion FOREIGN KEY (gestion_academica_id) REFERENCES gestion_academica(id),
  CONSTRAINT chk_nivel_turno CHECK (turno IN ('MANANA','TARDE','NOCHE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE periodo_academico (
  id BIGINT NOT NULL AUTO_INCREMENT,
  gestion_academica_id BIGINT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  orden INT NOT NULL,
  fecha_inicio DATE NULL,
  fecha_fin DATE NULL,
  cerrado BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_periodo_gestion_nombre (gestion_academica_id, nombre),
  UNIQUE KEY uk_periodo_gestion_orden (gestion_academica_id, orden),
  CONSTRAINT fk_periodo_gestion FOREIGN KEY (gestion_academica_id) REFERENCES gestion_academica(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE aula (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nivel_educativo_id BIGINT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  paralelo VARCHAR(20) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_aula_nivel_nombre_paralelo (nivel_educativo_id, nombre, paralelo),
  CONSTRAINT fk_aula_nivel FOREIGN KEY (nivel_educativo_id) REFERENCES nivel_educativo(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE asignatura (
  id BIGINT NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20) NULL,
  nombre VARCHAR(100) NOT NULL,
  area VARCHAR(20) NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_asignatura_codigo (codigo),
  UNIQUE KEY uk_asignatura_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE curso (
  id BIGINT NOT NULL AUTO_INCREMENT,
  aula_id BIGINT NOT NULL,
  asignatura_id BIGINT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_curso_aula_asignatura (aula_id, asignatura_id),
  CONSTRAINT fk_curso_aula FOREIGN KEY (aula_id) REFERENCES aula(id),
  CONSTRAINT fk_curso_asignatura FOREIGN KEY (asignatura_id) REFERENCES asignatura(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE matricula (
  id BIGINT NOT NULL AUTO_INCREMENT,
  codigo_matricula VARCHAR(30) NOT NULL,
  estudiante_id BIGINT NOT NULL,
  aula_id BIGINT NOT NULL,
  fecha_matricula DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_matricula_codigo (codigo_matricula),
  UNIQUE KEY uk_matricula_estudiante_aula (estudiante_id, aula_id),
  KEY idx_matricula_estudiante (estudiante_id),
  CONSTRAINT fk_matricula_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante(persona_id),
  CONSTRAINT fk_matricula_aula FOREIGN KEY (aula_id) REFERENCES aula(id),
  CONSTRAINT chk_matricula_estado CHECK (estado IN ('ACTIVA','RETIRADA','FINALIZADA','ANULADA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detallematricula (
  id BIGINT NOT NULL AUTO_INCREMENT,
  matricula_id BIGINT NOT NULL,
  curso_id BIGINT NOT NULL,
  fecha_registro DATE NOT NULL,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detallematricula_matricula_curso (matricula_id, curso_id),
  KEY idx_detallematricula_matricula (matricula_id),
  KEY idx_detallematricula_curso (curso_id),
  CONSTRAINT fk_detallematricula_matricula FOREIGN KEY (matricula_id) REFERENCES matricula(id),
  CONSTRAINT fk_detallematricula_curso FOREIGN KEY (curso_id) REFERENCES curso(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE asignaciondocente (
  id BIGINT NOT NULL AUTO_INCREMENT,
  docente_id BIGINT NOT NULL,
  curso_id BIGINT NOT NULL,
  periodo_academico_id BIGINT NOT NULL,
  fecha_asignacion DATE NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_asignaciondocente_curso_periodo (docente_id, curso_id, periodo_academico_id),
  KEY idx_asignaciondocente_docente (docente_id),
  KEY idx_asignaciondocente_curso (curso_id),
  CONSTRAINT fk_asignaciondocente_docente FOREIGN KEY (docente_id) REFERENCES docente(persona_id),
  CONSTRAINT fk_asignaciondocente_curso FOREIGN KEY (curso_id) REFERENCES curso(id),
  CONSTRAINT fk_asignaciondocente_periodo FOREIGN KEY (periodo_academico_id) REFERENCES periodo_academico(id),
  CONSTRAINT chk_asignaciondocente_estado CHECK (estado IN ('ACTIVA','CERRADA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE importacion_excel (
  id BIGINT NOT NULL AUTO_INCREMENT,
  docente_id BIGINT NOT NULL,
  curso_id BIGINT NOT NULL,
  periodo_academico_id BIGINT NOT NULL,
  usuario_responsable_id BIGINT NOT NULL,
  nombre_archivo VARCHAR(180) NOT NULL,
  hash_archivo VARCHAR(128) NULL,
  trimestre VARCHAR(20) NULL,
  anio INT NULL,
  nivel VARCHAR(80) NULL,
  institucion VARCHAR(150) NULL,
  lugar VARCHAR(150) NULL,
  area_curricular VARCHAR(120) NULL,
  docente_excel VARCHAR(150) NULL,
  grado VARCHAR(80) NULL,
  seccion VARCHAR(20) NULL,
  periodos_importados VARCHAR(120) NULL,
  total_registros INT NOT NULL DEFAULT 0,
  registros_validos INT NOT NULL DEFAULT 0,
  registros_observados INT NOT NULL DEFAULT 0,
  estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
  detalle TEXT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_importacion_docente (docente_id),
  KEY idx_importacion_curso_periodo (curso_id, periodo_academico_id),
  CONSTRAINT fk_importacion_docente FOREIGN KEY (docente_id) REFERENCES docente(persona_id),
  CONSTRAINT fk_importacion_curso FOREIGN KEY (curso_id) REFERENCES curso(id),
  CONSTRAINT fk_importacion_periodo FOREIGN KEY (periodo_academico_id) REFERENCES periodo_academico(id),
  CONSTRAINT fk_importacion_usuario FOREIGN KEY (usuario_responsable_id) REFERENCES usuario(id),
  CONSTRAINT chk_importacion_estado CHECK (estado IN ('PENDIENTE','PROCESADA','OBSERVADA','FALLIDA')),
  CONSTRAINT chk_importacion_trimestre CHECK (trimestre IS NULL OR trimestre IN ('I_TRIMESTRE','II_TRIMESTRE','III_TRIMESTRE','ANUAL'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE evaluacion (
  id BIGINT NOT NULL AUTO_INCREMENT,
  curso_id BIGINT NOT NULL,
  periodo_academico_id BIGINT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) NOT NULL DEFAULT 'OTRO',
  peso DECIMAL(5,2) NOT NULL,
  orden INT NOT NULL,
  publicada BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_evaluacion_curso_periodo_nombre (curso_id, periodo_academico_id, nombre),
  CONSTRAINT fk_evaluacion_curso FOREIGN KEY (curso_id) REFERENCES curso(id),
  CONSTRAINT fk_evaluacion_periodo FOREIGN KEY (periodo_academico_id) REFERENCES periodo_academico(id),
  CONSTRAINT chk_evaluacion_peso CHECK (peso >= 0 AND peso <= 100),
  CONSTRAINT chk_evaluacion_tipo CHECK (tipo IN ('PRACTICA','EXAMEN','TAREA','PARTICIPACION','OTRO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE calificacion (
  id BIGINT NOT NULL AUTO_INCREMENT,
  detalle_matricula_id BIGINT NOT NULL,
  periodo_academico_id BIGINT NOT NULL,
  trimestre VARCHAR(20) NOT NULL,
  valor_final DECIMAL(5,2) NOT NULL,
  logro_literal VARCHAR(2) NULL,
  registrado_por_id BIGINT NULL,
  importacion_id BIGINT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacion VARCHAR(250) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_calificacion_detalle_periodo_trimestre (detalle_matricula_id, periodo_academico_id, trimestre),
  KEY idx_calificacion_detalle (detalle_matricula_id),
  KEY idx_calificacion_periodo (periodo_academico_id),
  CONSTRAINT fk_calificacion_detallematricula FOREIGN KEY (detalle_matricula_id) REFERENCES detallematricula(id),
  CONSTRAINT fk_calificacion_periodo FOREIGN KEY (periodo_academico_id) REFERENCES periodo_academico(id),
  CONSTRAINT fk_calificacion_usuario FOREIGN KEY (registrado_por_id) REFERENCES usuario(id),
  CONSTRAINT fk_calificacion_importacion FOREIGN KEY (importacion_id) REFERENCES importacion_excel(id),
  CONSTRAINT chk_calificacion_valor CHECK (valor_final >= 0 AND valor_final <= 20),
  CONSTRAINT chk_calificacion_trimestre CHECK (trimestre IN ('I_TRIMESTRE','II_TRIMESTRE','III_TRIMESTRE','ANUAL'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE promedio_academico (
  id BIGINT NOT NULL AUTO_INCREMENT,
  estudiante_id BIGINT NOT NULL,
  curso_id BIGINT NOT NULL,
  periodo_academico_id BIGINT NOT NULL,
  promedio DECIMAL(5,2) NOT NULL,
  publicado BOOLEAN NOT NULL DEFAULT FALSE,
  calculado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_promedio_estudiante_curso_periodo (estudiante_id, curso_id, periodo_academico_id),
  KEY idx_promedio_estudiante (estudiante_id),
  CONSTRAINT fk_promedio_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante(persona_id),
  CONSTRAINT fk_promedio_curso FOREIGN KEY (curso_id) REFERENCES curso(id),
  CONSTRAINT fk_promedio_periodo FOREIGN KEY (periodo_academico_id) REFERENCES periodo_academico(id),
  CONSTRAINT chk_promedio_valor CHECK (promedio >= 0 AND promedio <= 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE nota (
  id BIGINT NOT NULL AUTO_INCREMENT,
  estudiante_id BIGINT NOT NULL,
  evaluacion_id BIGINT NOT NULL,
  asignacion_docente_id BIGINT NOT NULL,
  registrado_por_id BIGINT NOT NULL,
  importacion_id BIGINT NULL,
  valor DECIMAL(5,2) NOT NULL,
  observacion VARCHAR(250) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_nota_estudiante_evaluacion (estudiante_id, evaluacion_id),
  KEY idx_nota_estudiante (estudiante_id),
  KEY idx_nota_evaluacion (evaluacion_id),
  CONSTRAINT fk_nota_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante(persona_id),
  CONSTRAINT fk_nota_evaluacion FOREIGN KEY (evaluacion_id) REFERENCES evaluacion(id),
  CONSTRAINT fk_nota_asignacion_docente FOREIGN KEY (asignacion_docente_id) REFERENCES asignaciondocente(id),
  CONSTRAINT fk_nota_usuario_registro FOREIGN KEY (registrado_por_id) REFERENCES usuario(id),
  CONSTRAINT fk_nota_importacion FOREIGN KEY (importacion_id) REFERENCES importacion_excel(id),
  CONSTRAINT chk_nota_valor CHECK (valor >= 0 AND valor <= 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE apoderadoestudiante (
  id BIGINT NOT NULL AUTO_INCREMENT,
  apoderado_id BIGINT NOT NULL,
  estudiante_id BIGINT NOT NULL,
  parentesco VARCHAR(40) NOT NULL,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_apoderadoestudiante (estudiante_id, apoderado_id),
  KEY idx_apoderadoestudiante_apoderado (apoderado_id),
  KEY idx_apoderadoestudiante_estudiante (estudiante_id),
  CONSTRAINT fk_apoderadoestudiante_apoderado FOREIGN KEY (apoderado_id) REFERENCES apoderado(persona_id),
  CONSTRAINT fk_apoderadoestudiante_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiante(persona_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE error_importacion_excel (
  id BIGINT NOT NULL AUTO_INCREMENT,
  importacion_id BIGINT NOT NULL,
  fila_excel INT NULL,
  estudiante_texto VARCHAR(180) NULL,
  campo VARCHAR(80) NULL,
  descripcion_error VARCHAR(500) NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_error_importacion_excel_importacion (importacion_id),
  CONSTRAINT fk_error_importacion_excel_importacion FOREIGN KEY (importacion_id) REFERENCES importacion_excel(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria (
  id BIGINT NOT NULL AUTO_INCREMENT,
  accion VARCHAR(80) NOT NULL,
  entidad VARCHAR(80) NOT NULL,
  entidad_id BIGINT NULL,
  usuario_id BIGINT NULL,
  usuario_responsable VARCHAR(80) NOT NULL,
  detalle TEXT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auditoria_usuario (usuario_id),
  KEY idx_auditoria_entidad (entidad, entidad_id),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE calificacion_detalle_trimestre (
  id BIGINT NOT NULL AUTO_INCREMENT,
  detalle_matricula_id BIGINT NOT NULL,
  trimestre VARCHAR(20) NOT NULL,
  numero_competencia INT NOT NULL,
  nombre_competencia VARCHAR(255) NOT NULL,
  columna_excel VARCHAR(5) NOT NULL,
  nombre_nota VARCHAR(100) NOT NULL,
  valor_nota DECIMAL(5,2) NULL,
  fila_excel INT NOT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  importacion_id BIGINT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_calif_det_tri_detalle_tri_comp_col (detalle_matricula_id, trimestre, numero_competencia, columna_excel),
  KEY idx_calif_det_tri_detalle (detalle_matricula_id),
  KEY idx_calif_det_tri_importacion (importacion_id),
  CONSTRAINT fk_calif_det_tri_detallematricula FOREIGN KEY (detalle_matricula_id) REFERENCES detallematricula(id),
  CONSTRAINT fk_calif_det_tri_importacion FOREIGN KEY (importacion_id) REFERENCES importacion_excel(id),
  CONSTRAINT chk_calif_det_tri_trimestre CHECK (trimestre IN ('I_TRIMESTRE','II_TRIMESTRE','III_TRIMESTRE')),
  CONSTRAINT chk_calif_det_tri_valor CHECK (valor_nota IS NULL OR (valor_nota >= 0 AND valor_nota <= 20))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE calificacion_competencia_trimestre (
  id BIGINT NOT NULL AUTO_INCREMENT,
  detalle_matricula_id BIGINT NOT NULL,
  trimestre VARCHAR(20) NOT NULL,
  numero_competencia INT NOT NULL,
  nombre_competencia VARCHAR(255) NOT NULL,
  promedio_competencia DECIMAL(5,2) NULL,
  logro_literal VARCHAR(2) NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  importacion_id BIGINT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_calif_comp_tri_detalle_tri_comp (detalle_matricula_id, trimestre, numero_competencia),
  KEY idx_calif_comp_tri_detalle (detalle_matricula_id),
  KEY idx_calif_comp_tri_importacion (importacion_id),
  CONSTRAINT fk_calif_comp_tri_detallematricula FOREIGN KEY (detalle_matricula_id) REFERENCES detallematricula(id),
  CONSTRAINT fk_calif_comp_tri_importacion FOREIGN KEY (importacion_id) REFERENCES importacion_excel(id),
  CONSTRAINT chk_calif_comp_tri_trimestre CHECK (trimestre IN ('I_TRIMESTRE','II_TRIMESTRE','III_TRIMESTRE')),
  CONSTRAINT chk_calif_comp_tri_promedio CHECK (promedio_competencia IS NULL OR (promedio_competencia >= 0 AND promedio_competencia <= 20))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE configuracion_institucional (
  id BIGINT NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30) NOT NULL DEFAULT 'PRINCIPAL',
  nombre VARCHAR(150) NOT NULL,
  logo_url VARCHAR(250) NULL,
  direccion VARCHAR(200) NULL,
  telefono VARCHAR(30) NULL,
  correo_institucional VARCHAR(150) NULL,
  ruc VARCHAR(20) NULL,
  sitio_web VARCHAR(150) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_configuracion_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
