package pe.edu.aduniplus.backend.academico;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public final class AsignacionDocenteDtos {
    private AsignacionDocenteDtos() {}

    public record AsignacionDocenteRequest(
        @NotNull(message = "El docente es obligatorio") Long docenteId,
        @NotNull(message = "El curso es obligatorio") Long cursoId,
        @NotNull(message = "El periodo es obligatorio") Long periodoAcademicoId,
        EstadoAsignacionDocente estado
    ) {}

    public record AsignacionDocenteResponse(
        Long id,
        Long docenteId,
        String docenteCodigo,
        String docenteNombre,
        Long cursoId,
        String materia,
        String grado,
        String seccion,
        Long periodoAcademicoId,
        String periodo,
        LocalDate fechaAsignacion,
        EstadoAsignacionDocente estado
    ) {}
}
