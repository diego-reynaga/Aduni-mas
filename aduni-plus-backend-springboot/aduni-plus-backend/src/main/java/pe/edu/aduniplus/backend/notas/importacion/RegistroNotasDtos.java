package pe.edu.aduniplus.backend.notas.importacion;

import java.math.BigDecimal;
import java.util.List;

public final class RegistroNotasDtos {
    private RegistroNotasDtos() {
    }

    public record RegistroNotasMetadataDTO(
        Integer anio,
        String nivel,
        String institucion,
        String lugar,
        String areaCurricular,
        String docente,
        String grado,
        String seccion
    ) {}

    public record RegistroNotasTrimestreMetadataDTO(
        Integer anio,
        String nivel,
        String institucion,
        String lugar,
        String areaCurricular,
        String docente,
        String grado,
        String seccion,
        String trimestre
    ) {}

    public record RegistroNotasResumenDTO(
        int totalFilas,
        int estudiantesEncontrados,
        int estudiantesNoEncontrados,
        int filasConError,
        int filasImportables
    ) {}

    public record ErrorImportacionDTO(
        Integer filaExcel,
        String estudianteTexto,
        String campo,
        String descripcionError,
        boolean critico
    ) {}

    public record NotaIndividualTrimestreDTO(
        String columnaExcel,
        String nombreNota,
        BigDecimal valor
    ) {}

    public record CompetenciaTrimestreDTO(
        int numero,
        String nombre,
        List<NotaIndividualTrimestreDTO> notas,
        BigDecimal promedioCompetencia,
        String logroLiteral
    ) {}

    public record ResumenEstadisticoTrimestreDTO(
        int matriculados,
        int evaluados,
        int noEvaluados,
        int aprobados,
        int desaprobados,
        int nivelAD,
        int nivelA,
        int nivelB,
        int nivelC,
        BigDecimal porcentajeAD,
        BigDecimal porcentajeA,
        BigDecimal porcentajeB,
        BigDecimal porcentajeC
    ) {}

    public record EstudianteTrimestrePreviewDTO(
        int filaExcel,
        Integer numeroOrden,
        String nombreExcel,
        Long idEstudiante,
        String codigoEstudiante,
        String estadoMapeo,
        List<CompetenciaTrimestreDTO> competencias,
        BigDecimal promedioFinalTrimestre,
        String logroFinalTrimestre,
        List<ErrorImportacionDTO> errores
    ) {}

    public record RegistroNotasTrimestrePreviewResponse(
        RegistroNotasTrimestreMetadataDTO metadata,
        ResumenEstadisticoTrimestreDTO resumen,
        List<EstudianteTrimestrePreviewDTO> estudiantes,
        List<ErrorImportacionDTO> errores,
        boolean bloqueante
    ) {}

    public record EstudianteNotaPreviewDTO(
        int filaExcel,
        Integer numeroOrden,
        String nombreExcel,
        Long idEstudiante,
        String codigoEstudiante,
        String estadoMapeo,
        BigDecimal iTrimestre,
        BigDecimal iiTrimestre,
        BigDecimal iiiTrimestre,
        BigDecimal promedioAnual,
        String logroLiteral,
        String situacionFinal,
        List<ErrorImportacionDTO> errores
    ) {}

    public record RegistroNotasPreviewResponse(
        RegistroNotasMetadataDTO metadata,
        RegistroNotasResumenDTO resumen,
        List<EstudianteNotaPreviewDTO> estudiantes,
        List<ErrorImportacionDTO> errores,
        boolean bloqueante
    ) {}

    public record ResultadoImportacionDTO(
        String message,
        Long idImportacion,
        int totalFilas,
        int totalCorrectas,
        int totalConError,
        int calificacionesGuardadas,
        List<ErrorImportacionDTO> errores
    ) {}

    public record ResultadoImportacionTrimestreDTO(
        String message,
        Long idImportacion,
        String trimestre,
        int totalFilas,
        int totalCorrectas,
        int totalConError,
        int notasIndividualesGuardadas,
        int competenciasGuardadas,
        int promediosFinalesGuardados,
        List<ErrorImportacionDTO> errores
    ) {}

    public record ImportacionNotasHistorialDTO(
        Long idImportacion,
        String nombreArchivo,
        String trimestre,
        Integer anio,
        String areaCurricular,
        String grado,
        String seccion,
        String docente,
        String usuarioResponsable,
        String fechaImportacion,
        String estado,
        int totalFilas,
        int totalCorrectas,
        int totalConError,
        String observacion
    ) {}

    public record ImportacionNotasDetalleDTO(
        Long idImportacion,
        String nombreArchivo,
        String trimestre,
        RegistroNotasMetadataDTO metadata,
        String usuarioResponsable,
        String fechaImportacion,
        String estado,
        int totalFilas,
        int totalCorrectas,
        int totalConError,
        String observacion
    ) {}
}
