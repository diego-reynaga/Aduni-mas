-- ==========================================================
-- MIGRACION: Mejoras al Modulo de Matriculas y Alumnos
-- ==========================================================

-- 1. AGREGAR CODIGO_MATRICULA UNICO
ALTER TABLE MATRICULAS 
  ADD COLUMN codigo_matricula VARCHAR(30) UNIQUE;

-- 2. AMPLIAR ESTADOS DE MATRICULA (VARCHAR para soportar enum expandido)
ALTER TABLE MATRICULAS 
  MODIFY COLUMN estado_matricula VARCHAR(20) NOT NULL DEFAULT 'PRE_MATRICULADO';

-- 3. UK COMPUESTA: evitar doble matricula mismo estudiante + seccion
ALTER TABLE MATRICULAS 
  ADD CONSTRAINT uk_matriculas_estudiante_seccion 
  UNIQUE (estudiante_id, seccion_id);

-- 4. INDICE PARA CONSULTAS DE HISTORIAL POR ESTUDIANTE (idx_matriculas_estudiante)
CREATE INDEX idx_matriculas_estudiante 
  ON MATRICULAS(estudiante_id);

-- 5. INDICE COMPUESTO PARA VALIDACION DE AFORO (seccion + estado)
CREATE INDEX idx_matriculas_seccion_estado 
  ON MATRICULAS(seccion_id, estado_matricula);
