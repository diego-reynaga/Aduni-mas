-- Permite al padre de familia leer los horarios de los grados en los que sus hijos están matriculados
CREATE POLICY family_read_horarios ON horarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matriculas m
      WHERE m.grado_id = horarios.grado_id
        AND private.can_access_estudiante(m.estudiante_id)
        AND m.estado = 'ACTIVA'
    )
  );
