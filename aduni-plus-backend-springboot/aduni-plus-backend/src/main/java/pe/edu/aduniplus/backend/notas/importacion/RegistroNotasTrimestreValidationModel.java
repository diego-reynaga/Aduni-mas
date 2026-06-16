package pe.edu.aduniplus.backend.notas.importacion;

import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import pe.edu.aduniplus.backend.academico.Curso;
import pe.edu.aduniplus.backend.academico.Matricula;
import pe.edu.aduniplus.backend.academico.PeriodoAcademico;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.EstudianteTrimestrePreviewDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasTrimestrePreviewResponse;
import pe.edu.aduniplus.backend.persona.Estudiante;
import java.util.List;

record RegistroNotasTrimestreValidationResult(
    RegistroNotasTrimestreParseResult parseResult,
    RegistroNotasTrimestrePreviewResponse preview,
    Curso curso,
    PeriodoAcademico periodoAcademico,
    AsignacionDocente asignacionDocente,
    List<RegistroNotasTrimestreValidatedStudent> estudiantes
) {
    boolean tieneErroresCriticos() {
        return preview.bloqueante();
    }
}

record RegistroNotasTrimestreValidatedStudent(
    RegistroNotasTrimestreParsedStudent parsed,
    Estudiante estudiante,
    Matricula matricula,
    EstudianteTrimestrePreviewDTO preview
) {
    boolean importable() {
        return estudiante != null && matricula != null;
    }
}
