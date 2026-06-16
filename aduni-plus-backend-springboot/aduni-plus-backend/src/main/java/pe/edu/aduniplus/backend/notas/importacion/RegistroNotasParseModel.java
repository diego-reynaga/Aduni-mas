package pe.edu.aduniplus.backend.notas.importacion;

import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ErrorImportacionDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasMetadataDTO;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

record RegistroNotasParseResult(
    RegistroNotasMetadataDTO metadata,
    List<RegistroNotasParsedStudent> estudiantes,
    List<ErrorImportacionDTO> errores
) {}

record RegistroNotasParsedStudent(
    int filaExcel,
    Integer numeroOrden,
    String nombreExcel,
    Map<PeriodoExcel, BigDecimal> notas,
    BigDecimal promedioAnual,
    String logroLiteral,
    String situacionFinal,
    List<ErrorImportacionDTO> errores
) {}
