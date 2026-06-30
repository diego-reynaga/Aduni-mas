CREATE DATABASE IF NOT EXISTS aduni_plus;
USE aduni_plus;

-- ==========================================================
-- 1. ENTIDADES BASE (Sin dependencias externas)
-- ==========================================================

CREATE TABLE ROLES (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE PERSONAS (
    id_persona INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    CONSTRAINT uk_personas_documento UNIQUE (numero_documento),
    CONSTRAINT uk_personas_correo UNIQUE (correo)
);

CREATE TABLE CICLOS_ACADEMICOS (
    id_ciclo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_ciclo VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL
);

CREATE TABLE TURNOS (
    id_turno INT AUTO_INCREMENT PRIMARY KEY,
    nombre_turno ENUM('Mañana', 'Tarde') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL
);

CREATE TABLE MATERIAS (
    id_materia INT AUTO_INCREMENT PRIMARY KEY,
    nombre_materia VARCHAR(100) NOT NULL,
    area ENUM('Ingeniería', 'Letras') NOT NULL
);

-- ==========================================================
-- 2. SUBCLASES DE PERSONAS Y USUARIOS
-- (Las PK no llevan AUTO_INCREMENT porque heredan de PERSONAS)
-- ==========================================================

CREATE TABLE APODERADOS (
    id_apoderado INT PRIMARY KEY,
    relacion_parentesco VARCHAR(50) NOT NULL,
    FOREIGN KEY (id_apoderado) REFERENCES PERSONAS(id_persona) ON DELETE CASCADE
);

CREATE TABLE ESTUDIANTES (
    id_estudiante INT PRIMARY KEY,
    id_apoderado INT, 
    codigo_estudiante VARCHAR(20) UNIQUE,
    estado_academico ENUM('Regular', 'Condicional', 'Retirado') DEFAULT 'Regular',
    FOREIGN KEY (id_estudiante) REFERENCES PERSONAS(id_persona) ON DELETE CASCADE,
    FOREIGN KEY (id_apoderado) REFERENCES APODERADOS(id_apoderado) ON DELETE SET NULL
);

CREATE TABLE PERSONAL_INSTITUCIONAL (
    id_personal INT PRIMARY KEY, 
    fecha_ingreso DATE NOT NULL,
    cargo VARCHAR(100) NOT NULL, 
    FOREIGN KEY (id_personal) REFERENCES PERSONAS(id_persona) ON DELETE CASCADE
);

CREATE TABLE USUARIOS (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_persona INT UNIQUE NOT NULL,
    id_rol INT NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_persona) REFERENCES PERSONAS(id_persona) ON DELETE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES ROLES(id_rol)
);

CREATE TABLE LOG_AUDITORIA (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    accion ENUM('Inserción', 'Modificación', 'Eliminación', 'Inicio Sesion', 'Intento Fallido') NOT NULL,
    id_registro_afectado BIGINT,
    ip_origen VARCHAR(45),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion_cambio TEXT,
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
);

CREATE TABLE REFRESH_TOKENS (
    id_refresh BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiracion DATETIME NOT NULL,
    revocado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion DATETIME NOT NULL,
    CONSTRAINT fk_refresh_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario) ON DELETE CASCADE
);

-- ==========================================================
-- 3. ESTRUCTURA ACADÉMICA Y MATRÍCULAS
-- ==========================================================

CREATE TABLE SECCIONES (
    id_seccion INT AUTO_INCREMENT PRIMARY KEY,
    ciclo_id INT NOT NULL,
    turno_id INT NOT NULL,
    nombre_seccion VARCHAR(10) NOT NULL, 
    cupo_maximo INT NOT NULL,
    version BIGINT DEFAULT 0,
    FOREIGN KEY (ciclo_id) REFERENCES CICLOS_ACADEMICOS(id_ciclo),
    FOREIGN KEY (turno_id) REFERENCES TURNOS(id_turno)
);

CREATE TABLE MATRICULAS (
    id_matricula INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL, 
    seccion_id INT NOT NULL,
    fecha_matricula DATE NOT NULL,
    monto_total_pactado DECIMAL(10,2) NOT NULL,
    estado_matricula ENUM('Activo', 'Retirado') DEFAULT 'Activo',
    FOREIGN KEY (estudiante_id) REFERENCES PERSONAS(id_persona),
    FOREIGN KEY (seccion_id) REFERENCES SECCIONES(id_seccion)
);

-- ==========================================================
-- 4. PAGOS Y CRONOGRAMAS
-- ==========================================================

CREATE TABLE CRONOGRAMA_PAGOS (
    id_cronograma INT AUTO_INCREMENT PRIMARY KEY,
    id_matricula INT NOT NULL,
    numero_cuota INT NOT NULL,
    monto_cuota DECIMAL(10,2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado_cuota ENUM('Pendiente', 'Pagado', 'Vencido') DEFAULT 'Pendiente',
    FOREIGN KEY (id_matricula) REFERENCES MATRICULAS(id_matricula) ON DELETE CASCADE
);

CREATE TABLE PAGOS (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_cronograma INT NOT NULL,
    numero_recibo VARCHAR(50) NOT NULL UNIQUE,
    monto_pagado DECIMAL(10,2) NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago VARCHAR(50),
    FOREIGN KEY (id_cronograma) REFERENCES CRONOGRAMA_PAGOS(id_cronograma)
);

-- ==========================================================
-- 5. ASISTENCIA Y EVALUACIONES
-- ==========================================================

CREATE TABLE ASISTENCIA_ESTUDIANTE (
    id_asistencia_est INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL, 
    id_seccion INT NOT NULL,
    fecha DATE NOT NULL,
    estado_asistencia ENUM('Asistió', 'Tardanza', 'Faltó') NOT NULL,
    observacion TEXT,
    FOREIGN KEY (id_estudiante) REFERENCES PERSONAS(id_persona),
    FOREIGN KEY (id_seccion) REFERENCES SECCIONES(id_seccion)
);

CREATE TABLE EVALUACIONES (
    id_evaluacion INT AUTO_INCREMENT PRIMARY KEY,
    id_ciclo INT NOT NULL,
    nombre_evaluacion VARCHAR(100) NOT NULL, 
    fecha_evaluacion DATE NOT NULL,
    FOREIGN KEY (id_ciclo) REFERENCES CICLOS_ACADEMICOS(id_ciclo)
);

CREATE TABLE NOTAS (
    id_nota INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL, 
    id_materia INT NOT NULL,
    id_evaluacion INT NOT NULL,
    calificacion_numerica DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (id_estudiante) REFERENCES PERSONAS(id_persona),
    FOREIGN KEY (id_materia) REFERENCES MATERIAS(id_materia),
    FOREIGN KEY (id_evaluacion) REFERENCES EVALUACIONES(id_evaluacion)
);

-- ==========================================================
-- 6. DATOS INICIALES (SEMILLA)
-- ==========================================================

-- Insertar roles básicos
INSERT IGNORE INTO ROLES (id_rol, nombre_rol) VALUES 
(1, 'ADMINISTRADOR'),
(2, 'DIRECCION_ACADEMICA'),
(3, 'SECRETARIA'),
(4, 'DOCENTE'),
(5, 'ESTUDIANTE');

-- Crear Persona para el Administrador
INSERT IGNORE INTO PERSONAS (id_persona, tipo_documento, numero_documento, nombres, apellidos, correo) 
VALUES (1, 'DNI', '00000000', 'Admin', 'Sistema', 'admin@aduni.edu.pe');

-- Crear Usuario Administrador (username: admin / password: admin123)
-- El hash bcrypt corresponde a la contraseña 'admin123'
INSERT IGNORE INTO USUARIOS (id_usuario, id_persona, id_rol, username, password_hash, activo) 
VALUES (1, 1, 1, 'admin', '$2a$10$R9h/cIPz0gi.URNNX3rub.Fc0tY6JpA6tJ8R.R9j3mQnZgL5A2D2a', true);