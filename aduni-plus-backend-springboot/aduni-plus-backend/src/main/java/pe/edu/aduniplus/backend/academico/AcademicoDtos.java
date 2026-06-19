package pe.edu.aduniplus.backend.academico;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class AcademicoDtos {

    // --- Nivel Educativo ---
    public record NivelEducativoResponse(
        Long id,
        String nombre,
        String turno,
        String descripcion,
        Boolean activo,
        Long gestionAcademicaId
    ) {}

    public record NivelEducativoRequest(
        @NotBlank(message = "El nombre del nivel es obligatorio")
        String nombre,
        @NotNull(message = "El turno es obligatorio")
        Turno turno,
        String descripcion,
        @NotNull(message = "El estado (activo) es obligatorio")
        Boolean activo,
        @NotNull(message = "La gestión académica es obligatoria")
        Long gestionAcademicaId
    ) {}

    // --- Grado ---
    public record GradoResponse(
        Long id,
        String nombre,
        String paralelo,
        Integer capacidad,
        Boolean activo,
        Long nivelEducativoId,
        String nivelEducativoNombre
    ) {}

    public record GradoRequest(
        @NotBlank(message = "El nombre del grado es obligatorio")
        String nombre,
        @NotBlank(message = "El paralelo es obligatorio")
        String paralelo,
        Integer capacidad,
        @NotNull(message = "El estado (activo) es obligatorio")
        Boolean activo,
        @NotNull(message = "El ID del nivel educativo es obligatorio")
        Long nivelEducativoId
    ) {}

    // --- Materia ---
    public record MateriaResponse(
        Long id,
        String codigo,
        String nombre,
        String area,
        Boolean activa
    ) {}

    public record MateriaRequest(
        @NotBlank(message = "El código de la materia es obligatorio")
        String codigo,
        @NotBlank(message = "El nombre de la materia es obligatorio")
        String nombre,
        @NotBlank(message = "El área académica es obligatoria")
        String area,
        @NotNull(message = "El estado (activa) es obligatorio")
        Boolean activa
    ) {}

    // --- Curso (Oferta Educativa) ---
    public record CursoResponse(
        Long id,
        Long gradoId,
        String gradoNombre,
        String paralelo,
        Long materiaId,
        String materiaCodigo,
        String materiaNombre,
        String area,
        Boolean activo
    ) {}

    public record CursoAsignacionMasivaRequest(
        @NotNull(message = "El ID del grado es obligatorio")
        Long gradoId,
        @NotNull(message = "La lista de IDs de materias es obligatoria")
        List<Long> materiasIds
    ) {}
    // --- Gestion Academica ---
    public record GestionAcademicaResponse(
        Long id,
        Integer anio,
        String nombre,
        java.time.LocalDate fechaInicio,
        java.time.LocalDate fechaFin,
        Boolean activa
    ) {}

    public record GestionAcademicaRequest(
        @NotNull(message = "El año es obligatorio")
        Integer anio,
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,
        @NotNull(message = "La fecha de inicio es obligatoria")
        java.time.LocalDate fechaInicio,
        @NotNull(message = "La fecha de fin es obligatoria")
        java.time.LocalDate fechaFin,
        @NotNull(message = "El estado (activa) es obligatorio")
        Boolean activa
    ) {}

    // --- Periodo Academico ---
    public record PeriodoAcademicoResponse(
        Long id,
        String nombre,
        Integer orden,
        java.time.LocalDate fechaInicio,
        java.time.LocalDate fechaFin,
        Boolean cerrado,
        Long gestionAcademicaId
    ) {}

    public record PeriodoAcademicoRequest(
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,
        @NotNull(message = "El orden es obligatorio")
        Integer orden,
        @NotNull(message = "La fecha de inicio es obligatoria")
        java.time.LocalDate fechaInicio,
        @NotNull(message = "La fecha de fin es obligatoria")
        java.time.LocalDate fechaFin,
        @NotNull(message = "El estado (cerrado) es obligatorio")
        Boolean cerrado,
        @NotNull(message = "El ID de la gestión académica es obligatorio")
        Long gestionAcademicaId
    ) {}

    // --- Utilidad ---
    public record ClonarEstructuraRequest(
        @NotNull(message = "El ID de la gestión origen es obligatorio")
        Long gestionOrigenId,
        @NotNull(message = "El ID de la gestión destino es obligatorio")
        Long gestionDestinoId
    ) {}

    // --- Matricula ---
    public record MatriculaResponse(
        Long id,
        String codigoMatricula,
        Long estudianteId,
        String estudianteNombre,
        String estudianteCodigo,
        Long gradoId,
        String gradoNombre,
        String paralelo,
        String nivelNombre,
        java.time.LocalDate fechaMatricula,
        EstadoMatricula estado
    ) {}

    public record MatriculaRequest(
        @NotNull(message = "El estudiante es obligatorio")
        Long estudianteId,
        @NotNull(message = "El grado (aula) es obligatorio")
        Long gradoId
    ) {}
}
