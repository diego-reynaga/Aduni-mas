CREATE DATABASE IF NOT EXISTS aduni_plus;
USE aduni_plus;

CREATE TABLE configuraciones_institucionales (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  codigo VARCHAR(30) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  logo_url VARCHAR(250),
  direccion VARCHAR(200),
  telefono VARCHAR(30),
  correo_institucional VARCHAR(150),
  ruc VARCHAR(20),
  sitio_web VARCHAR(150),
  PRIMARY KEY (id),
  CONSTRAINT uk_configuraciones_codigo UNIQUE (codigo)
) ENGINE=InnoDB;

CREATE TABLE gestiones_academicas (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  anio INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  activa BIT(1) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_gestiones_anio UNIQUE (anio)
) ENGINE=InnoDB;

CREATE TABLE materias (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  codigo VARCHAR(20),
  nombre VARCHAR(100) NOT NULL,
  area VARCHAR(20),
  activa BIT(1) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_materias_nombre UNIQUE (nombre),
  CONSTRAINT uk_materias_codigo UNIQUE (codigo)
) ENGINE=InnoDB;

CREATE TABLE personas (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  documento_identidad VARCHAR(20) NOT NULL,
  fecha_nacimiento DATE,
  direccion VARCHAR(150),
  telefono VARCHAR(20),
  correo VARCHAR(150),
  tipo_persona VARCHAR(30) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_personas_documento UNIQUE (documento_identidad),
  CONSTRAINT uk_personas_correo UNIQUE (correo)
) ENGINE=InnoDB;

CREATE TABLE roles (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  nombre VARCHAR(30) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_roles_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE estudiantes (
  persona_id BIGINT NOT NULL,
  codigo_estudiante VARCHAR(30) NOT NULL,
  activo BIT(1) NOT NULL,
  PRIMARY KEY (persona_id),
  CONSTRAINT uk_estudiantes_codigo UNIQUE (codigo_estudiante),
  CONSTRAINT fk_estudiantes_persona FOREIGN KEY (persona_id)
    REFERENCES personas (id)
) ENGINE=InnoDB;

CREATE TABLE docentes (
  persona_id BIGINT NOT NULL,
  codigo_docente VARCHAR(30) NOT NULL,
  especialidad VARCHAR(100),
  area_academica VARCHAR(100),
  activo BIT(1) NOT NULL,
  PRIMARY KEY (persona_id),
  CONSTRAINT uk_docentes_codigo UNIQUE (codigo_docente),
  CONSTRAINT fk_docentes_persona FOREIGN KEY (persona_id)
    REFERENCES personas (id)
) ENGINE=InnoDB;

CREATE TABLE administrativos (
  persona_id BIGINT NOT NULL,
  codigo_administrativo VARCHAR(30) NOT NULL,
  cargo VARCHAR(80) NOT NULL,
  activo BIT(1) NOT NULL,
  PRIMARY KEY (persona_id),
  CONSTRAINT uk_administrativos_codigo UNIQUE (codigo_administrativo),
  CONSTRAINT fk_administrativos_persona FOREIGN KEY (persona_id)
    REFERENCES personas (id)
) ENGINE=InnoDB;

CREATE TABLE padres_familia (
  persona_id BIGINT NOT NULL,
  ocupacion VARCHAR(100),
  activo BIT(1) NOT NULL,
  PRIMARY KEY (persona_id),
  CONSTRAINT fk_padres_familia_persona FOREIGN KEY (persona_id)
    REFERENCES personas (id)
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  username VARCHAR(80) NOT NULL,
  password VARCHAR(255) NOT NULL,
  activo BIT(1) NOT NULL,
  persona_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_usuarios_username UNIQUE (username),
  CONSTRAINT uk_usuarios_persona UNIQUE (persona_id),
  CONSTRAINT fk_usuarios_persona FOREIGN KEY (persona_id)
    REFERENCES personas (id)
) ENGINE=InnoDB;

CREATE TABLE usuario_roles (
  usuario_id BIGINT NOT NULL,
  rol_id BIGINT NOT NULL,
  PRIMARY KEY (usuario_id, rol_id),
  CONSTRAINT uk_usuario_roles_usuario_rol UNIQUE (usuario_id, rol_id),
  CONSTRAINT fk_usuario_roles_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id),
  CONSTRAINT fk_usuario_roles_rol FOREIGN KEY (rol_id)
    REFERENCES roles (id)
) ENGINE=InnoDB;

CREATE TABLE niveles_educativos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  gestion_academica_id BIGINT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  turno VARCHAR(20) NOT NULL,
  descripcion VARCHAR(250),
  activo BIT(1) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_niveles_gestion_nombre_turno UNIQUE (gestion_academica_id, nombre, turno),
  CONSTRAINT fk_niveles_gestion FOREIGN KEY (gestion_academica_id)
    REFERENCES gestiones_academicas (id)
) ENGINE=InnoDB;

CREATE TABLE grados (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  nivel_educativo_id BIGINT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  paralelo VARCHAR(20) NOT NULL,
  activo BIT(1) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_grados_nivel_nombre_paralelo UNIQUE (nivel_educativo_id, nombre, paralelo),
  CONSTRAINT fk_grados_nivel FOREIGN KEY (nivel_educativo_id)
    REFERENCES niveles_educativos (id)
) ENGINE=InnoDB;

CREATE TABLE periodos_academicos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  gestion_academica_id BIGINT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  orden INT NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  cerrado BIT(1) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_periodos_gestion_nombre UNIQUE (gestion_academica_id, nombre),
  CONSTRAINT uk_periodos_gestion_orden UNIQUE (gestion_academica_id, orden),
  CONSTRAINT fk_periodos_gestion FOREIGN KEY (gestion_academica_id)
    REFERENCES gestiones_academicas (id)
) ENGINE=InnoDB;

CREATE TABLE cursos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  grado_id BIGINT NOT NULL,
  materia_id BIGINT NOT NULL,
  activo BIT(1) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_cursos_grado_materia UNIQUE (grado_id, materia_id),
  CONSTRAINT fk_cursos_grado FOREIGN KEY (grado_id)
    REFERENCES grados (id),
  CONSTRAINT fk_cursos_materia FOREIGN KEY (materia_id)
    REFERENCES materias (id)
) ENGINE=InnoDB;

CREATE TABLE asignaciones_docente (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  docente_id BIGINT NOT NULL,
  curso_id BIGINT NOT NULL,
  periodo_academico_id BIGINT NOT NULL,
  fecha_asignacion DATE,
  estado VARCHAR(20) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_asignaciones_docente_curso_periodo UNIQUE (docente_id, curso_id, periodo_academico_id),
  CONSTRAINT fk_asignaciones_docente FOREIGN KEY (docente_id)
    REFERENCES docentes (persona_id),
  CONSTRAINT fk_asignaciones_curso FOREIGN KEY (curso_id)
    REFERENCES cursos (id),
  CONSTRAINT fk_asignaciones_periodo FOREIGN KEY (periodo_academico_id)
    REFERENCES periodos_academicos (id),
  INDEX idx_asignaciones_docente (docente_id),
  INDEX idx_asignaciones_curso (curso_id)
) ENGINE=InnoDB;

CREATE TABLE matriculas (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  codigo_matricula VARCHAR(30) NOT NULL,
  estudiante_id BIGINT NOT NULL,
  grado_id BIGINT NOT NULL,
  fecha_matricula DATE NOT NULL,
  estado VARCHAR(20) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_matriculas_codigo UNIQUE (codigo_matricula),
  CONSTRAINT uk_matriculas_estudiante_grado UNIQUE (estudiante_id, grado_id),
  CONSTRAINT fk_matriculas_estudiante FOREIGN KEY (estudiante_id)
    REFERENCES estudiantes (persona_id),
  CONSTRAINT fk_matriculas_grado FOREIGN KEY (grado_id)
    REFERENCES grados (id),
  INDEX idx_matriculas_estudiante (estudiante_id)
) ENGINE=InnoDB;

CREATE TABLE evaluaciones (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  curso_id BIGINT NOT NULL,
  periodo_academico_id BIGINT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  peso DECIMAL(5,2) NOT NULL,
  orden INT NOT NULL,
  publicada BIT(1) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_evaluaciones_curso_periodo_nombre UNIQUE (curso_id, periodo_academico_id, nombre),
  CONSTRAINT fk_evaluaciones_curso FOREIGN KEY (curso_id)
    REFERENCES cursos (id),
  CONSTRAINT fk_evaluaciones_periodo FOREIGN KEY (periodo_academico_id)
    REFERENCES periodos_academicos (id),
  CONSTRAINT chk_evaluaciones_peso CHECK (peso >= 0 and peso <= 100)
) ENGINE=InnoDB;

CREATE TABLE importaciones_notas (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  docente_id BIGINT NOT NULL,
  curso_id BIGINT NOT NULL,
  periodo_academico_id BIGINT NOT NULL,
  usuario_responsable_id BIGINT NOT NULL,
  nombre_archivo VARCHAR(180) NOT NULL,
  hash_archivo VARCHAR(128),
  total_registros INT NOT NULL,
  registros_validos INT NOT NULL,
  registros_observados INT NOT NULL,
  estado VARCHAR(30) NOT NULL,
  detalle TEXT,
  PRIMARY KEY (id),
  CONSTRAINT fk_importaciones_docente FOREIGN KEY (docente_id)
    REFERENCES docentes (persona_id),
  CONSTRAINT fk_importaciones_curso FOREIGN KEY (curso_id)
    REFERENCES cursos (id),
  CONSTRAINT fk_importaciones_periodo FOREIGN KEY (periodo_academico_id)
    REFERENCES periodos_academicos (id),
  CONSTRAINT fk_importaciones_usuario FOREIGN KEY (usuario_responsable_id)
    REFERENCES usuarios (id)
) ENGINE=InnoDB;

CREATE TABLE notas (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  estudiante_id BIGINT NOT NULL,
  evaluacion_id BIGINT NOT NULL,
  asignacion_docente_id BIGINT NOT NULL,
  registrado_por_id BIGINT NOT NULL,
  importacion_notas_id BIGINT,
  valor DECIMAL(5,2) NOT NULL,
  observacion VARCHAR(250),
  PRIMARY KEY (id),
  CONSTRAINT uk_notas_estudiante_evaluacion UNIQUE (estudiante_id, evaluacion_id),
  CONSTRAINT fk_notas_estudiante FOREIGN KEY (estudiante_id)
    REFERENCES estudiantes (persona_id),
  CONSTRAINT fk_notas_evaluacion FOREIGN KEY (evaluacion_id)
    REFERENCES evaluaciones (id),
  CONSTRAINT fk_notas_asignacion_docente FOREIGN KEY (asignacion_docente_id)
    REFERENCES asignaciones_docente (id),
  CONSTRAINT fk_notas_usuario_registro FOREIGN KEY (registrado_por_id)
    REFERENCES usuarios (id),
  CONSTRAINT fk_notas_importacion FOREIGN KEY (importacion_notas_id)
    REFERENCES importaciones_notas (id),
  CONSTRAINT chk_notas_valor CHECK (valor >= 0 and valor <= 20),
  INDEX idx_notas_estudiante (estudiante_id),
  INDEX idx_notas_evaluacion (evaluacion_id)
) ENGINE=InnoDB;

CREATE TABLE promedios_academicos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  estudiante_id BIGINT NOT NULL,
  curso_id BIGINT NOT NULL,
  periodo_academico_id BIGINT NOT NULL,
  promedio DECIMAL(5,2) NOT NULL,
  publicado BIT(1) NOT NULL,
  calculado_en DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_promedios_estudiante_curso_periodo UNIQUE (estudiante_id, curso_id, periodo_academico_id),
  CONSTRAINT fk_promedios_estudiante FOREIGN KEY (estudiante_id)
    REFERENCES estudiantes (persona_id),
  CONSTRAINT fk_promedios_curso FOREIGN KEY (curso_id)
    REFERENCES cursos (id),
  CONSTRAINT fk_promedios_periodo FOREIGN KEY (periodo_academico_id)
    REFERENCES periodos_academicos (id),
  CONSTRAINT chk_promedios_promedio CHECK (promedio >= 0 and promedio <= 20),
  INDEX idx_promedios_estudiante (estudiante_id)
) ENGINE=InnoDB;

CREATE TABLE estudiante_apoderados (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  estudiante_id BIGINT NOT NULL,
  padre_familia_id BIGINT NOT NULL,
  parentesco VARCHAR(40) NOT NULL,
  principal BIT(1) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_estudiante_apoderado UNIQUE (estudiante_id, padre_familia_id),
  CONSTRAINT fk_estudiante_apoderados_estudiante FOREIGN KEY (estudiante_id)
    REFERENCES estudiantes (persona_id),
  CONSTRAINT fk_estudiante_apoderados_padre FOREIGN KEY (padre_familia_id)
    REFERENCES padres_familia (persona_id)
) ENGINE=InnoDB;

CREATE TABLE auditorias (
  id BIGINT NOT NULL AUTO_INCREMENT,
  creado_en DATETIME(6) NOT NULL,
  actualizado_en DATETIME(6),
  accion VARCHAR(80) NOT NULL,
  entidad VARCHAR(80) NOT NULL,
  entidad_id BIGINT,
  usuario_id BIGINT,
  usuario_responsable VARCHAR(80) NOT NULL,
  detalle TEXT,
  PRIMARY KEY (id),
  CONSTRAINT fk_auditorias_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id)
) ENGINE=InnoDB;
