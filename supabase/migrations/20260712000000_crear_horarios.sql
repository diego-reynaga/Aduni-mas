-- Crear tabla horarios
CREATE TABLE horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grado_id UUID NOT NULL REFERENCES grados(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  aula VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Evitar superposición de horarios en el mismo grado
CREATE INDEX idx_horarios_grado_dia ON horarios(grado_id, dia_semana);

-- RLS
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY admin_all_horarios ON horarios
  FOR ALL USING (private.is_admin());

-- Teacher read (cursos que enseña)
CREATE POLICY teacher_read_horarios ON horarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM asignaciones_docente ad
      WHERE ad.curso_id = horarios.curso_id
        AND ad.docente_id = (SELECT id FROM docentes WHERE persona_id = private.current_persona_id())
        AND ad.estado = 'ACTIVA'
    )
  );

-- Student read (su grado)
CREATE POLICY student_read_horarios ON horarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matriculas m
      WHERE m.grado_id = horarios.grado_id
        AND m.estudiante_id = (SELECT id FROM estudiantes WHERE persona_id = private.current_persona_id())
        AND m.estado = 'ACTIVA'
    )
  );
