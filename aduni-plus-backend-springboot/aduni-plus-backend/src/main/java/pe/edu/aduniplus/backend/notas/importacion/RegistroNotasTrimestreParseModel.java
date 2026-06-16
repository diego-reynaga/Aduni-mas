package pe.edu.aduniplus.backend.notas.importacion;

import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ErrorImportacionDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasTrimestreMetadataDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ResumenEstadisticoTrimestreDTO;
import java.math.BigDecimal;
import java.util.List;

record RegistroNotasTrimestreParseResult(
    RegistroNotasTrimestreMetadataDTO metadata,
    PeriodoExcel trimestre,
    ResumenEstadisticoTrimestreDTO resumen,
    List<RegistroNotasTrimestreParsedStudent> estudiantes,
    List<ErrorImportacionDTO> errores
) {}

record RegistroNotasTrimestreParsedStudent(
    int filaExcel,
    Integer numeroOrden,
    String nombreExcel,
    List<RegistroNotasCompetenciaParsed> competencias,
    BigDecimal promedioFinalTrimestre,
    String logroFinalTrimestre,
    List<ErrorImportacionDTO> errores
) {}

record RegistroNotasCompetenciaParsed(
    int numero,
    String nombre,
    List<RegistroNotasNotaParsed> notas,
    BigDecimal promedioCompetencia,
    String logroLiteral
) {}

record RegistroNotasNotaParsed(
    String columnaExcel,
    int columnaIndex,
    String nombreNota,
    BigDecimal valor,
    boolean valida
) {}
