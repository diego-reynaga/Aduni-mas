package pe.edu.aduniplus.backend.notas.importacion;

import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import pe.edu.aduniplus.backend.academico.Curso;
import pe.edu.aduniplus.backend.academico.PeriodoAcademico;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.EstudianteNotaPreviewDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasPreviewResponse;
import pe.edu.aduniplus.backend.persona.Estudiante;
import java.util.List;
import java.util.Map;

record RegistroNotasValidationResult(
    RegistroNotasParseResult parseResult,
    RegistroNotasPreviewResponse preview,
    Curso curso,
    Map<PeriodoExcel, PeriodoAcademico> periodos,
    Map<PeriodoExcel, AsignacionDocente> asignaciones,
    List<RegistroNotasValidatedStudent> estudiantes
) {
    boolean tieneErroresCriticos() {
        return preview.bloqueante();
    }
}

record RegistroNotasValidatedStudent(
    RegistroNotasParsedStudent parsed,
    Estudiante estudiante,
    EstudianteNotaPreviewDTO preview
) {
    boolean importable() {
        return estudiante != null && preview.errores().isEmpty();
    }
}
