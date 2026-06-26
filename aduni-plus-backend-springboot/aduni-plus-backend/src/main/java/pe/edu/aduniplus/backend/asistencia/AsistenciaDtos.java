package pe.edu.aduniplus.backend.asistencia;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class AsistenciaDtos {

    public record AsistenciaResponse(
        Long id,
        Long personaId, String personaNombre, String personaCodigo, String tipoPersona,
        LocalDate fecha,
        LocalTime horaIngreso,
        EstadoAsistencia estado,
        Long asignacionDocenteId,
        String cursoNombre, String materiaNombre, String periodoNombre,
        String observacion,
        LocalDateTime creadoEn
    ) {}

    public record AsistenciaIndividualRequest(
        @NotNull Long estudianteId,
        @NotNull EstadoAsistencia estado,
        String observacion
    ) {}

    public record AsistenciaBatchRequest(
        @NotNull Long asignacionDocenteId,
        @NotNull LocalDate fecha,
        @NotNull List<AsistenciaIndividualRequest> registros
    ) {}

    public record AsistenciaDocenteRequest(
        @NotNull Long docenteId,
        @NotNull LocalDate fecha,
        @NotNull EstadoAsistencia estado,
        String observacion
    ) {}

    public record AsistenciaDocenteBatchRequest(
        @NotNull LocalDate fecha,
        @NotNull List<AsistenciaIndividualRequest> registros
    ) {}

    public record AsistenciaReporteRow(
        Long personaId, String personaNombre, String personaCodigo,
        int totalDias, int presentes, int tardanzas, int faltas, int justificados,
        double porcentajeAsistencia
    ) {}
}
