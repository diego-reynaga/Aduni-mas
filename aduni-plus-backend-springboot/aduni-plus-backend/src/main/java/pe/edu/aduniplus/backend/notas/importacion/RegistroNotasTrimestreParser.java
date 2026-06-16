package pe.edu.aduniplus.backend.notas.importacion;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.CellValue;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ErrorImportacionDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasTrimestreMetadataDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ResumenEstadisticoTrimestreDTO;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class RegistroNotasTrimestreParser {
    private static final int FIRST_STUDENT_ROW_INDEX = 16;
    private static final int COLUMN_ORDER = 0;
    private static final int COLUMN_STUDENT = 1;
    private static final CompetenceRange[] COMPETENCE_RANGES = {
        new CompetenceRange(1, 5, 10, 11),
        new CompetenceRange(2, 12, 17, 18),
        new CompetenceRange(3, 19, 24, 25),
        new CompetenceRange(4, 26, 31, 32)
    };

    RegistroNotasTrimestreParseResult parse(byte[] content, PeriodoExcel trimestre) {
        if (trimestre == null || !trimestre.esTrimestre()) {
            throw new IllegalArgumentException("Seleccione un trimestre válido para importar.");
        }

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(content))) {
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            DataFormatter formatter = new DataFormatter(Locale.US, false);
            List<ErrorImportacionDTO> globalErrors = new ArrayList<>();

            Sheet inicio = workbook.getSheet("INICIO");
            if (inicio == null) {
                throw new IllegalArgumentException("El archivo no contiene la hoja INICIO.");
            }
            Sheet sheet = workbook.getSheet(trimestre.nombre());
            if (sheet == null) {
                throw new IllegalArgumentException("El archivo no contiene la hoja " + trimestre.nombre() + ".");
            }

            RegistroNotasTrimestreMetadataDTO metadata = parseMetadata(inicio, trimestre, formatter, evaluator, globalErrors);
            validateStructure(sheet, formatter, evaluator, globalErrors);

            List<RegistroNotasTrimestreParsedStudent> students = new ArrayList<>();
            int blankStreak = 0;
            for (int rowIndex = FIRST_STUDENT_ROW_INDEX; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                Integer order = readIntegerCell(row, COLUMN_ORDER, formatter, evaluator);
                String studentName = readCellText(row, COLUMN_STUDENT, formatter, evaluator);

                if (isInvalidStudentName(studentName) || isSummaryLabel(studentName)) {
                    blankStreak++;
                    if (blankStreak >= 3 || isSummaryLabel(studentName)) {
                        break;
                    }
                    continue;
                }
                blankStreak = 0;
                students.add(parseStudentRow(sheet, row, rowIndex + 1, order, studentName, formatter, evaluator));
            }

            List<RegistroNotasTrimestreParsedStudent> sorted = students.stream()
                .sorted(Comparator
                    .comparing((RegistroNotasTrimestreParsedStudent item) -> item.numeroOrden() == null ? Integer.MAX_VALUE : item.numeroOrden())
                    .thenComparing(RegistroNotasTrimestreParsedStudent::filaExcel))
                .toList();

            return new RegistroNotasTrimestreParseResult(
                metadata,
                trimestre,
                calcularResumenTrimestre(sorted),
                sorted,
                List.copyOf(globalErrors)
            );
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("No se pudo leer el trimestre seleccionado del archivo Excel.");
        }
    }

    private RegistroNotasTrimestreMetadataDTO parseMetadata(
        Sheet inicio,
        PeriodoExcel trimestre,
        DataFormatter formatter,
        FormulaEvaluator evaluator,
        List<ErrorImportacionDTO> errors
    ) {
        Integer anio = readIntegerCell(inicio.getRow(10), 4, formatter, evaluator);
        RegistroNotasTrimestreMetadataDTO metadata = new RegistroNotasTrimestreMetadataDTO(
            anio,
            readCellText(inicio.getRow(11), 1, formatter, evaluator),
            readCellText(inicio.getRow(12), 1, formatter, evaluator),
            readCellText(inicio.getRow(13), 1, formatter, evaluator),
            readCellText(inicio.getRow(14), 1, formatter, evaluator),
            readCellText(inicio.getRow(15), 1, formatter, evaluator),
            readCellText(inicio.getRow(16), 1, formatter, evaluator),
            readCellText(inicio.getRow(16), 3, formatter, evaluator),
            trimestre.name()
        );

        if (metadata.anio() == null) {
            errors.add(globalError("anio", "No se pudo leer el año desde INICIO!E11."));
        }
        if (metadata.areaCurricular().isBlank()) {
            errors.add(globalError("areaCurricular", "No se pudo leer el área curricular desde INICIO!B15."));
        }
        if (metadata.docente().isBlank()) {
            errors.add(globalError("docente", "No se pudo leer el docente desde INICIO!B16."));
        }
        if (metadata.grado().isBlank()) {
            errors.add(globalError("grado", "No se pudo leer el grado desde INICIO!B17."));
        }
        if (metadata.seccion().isBlank()) {
            errors.add(globalError("seccion", "No se pudo leer la sección desde INICIO!D17."));
        }
        return metadata;
    }

    private void validateStructure(
        Sheet sheet,
        DataFormatter formatter,
        FormulaEvaluator evaluator,
        List<ErrorImportacionDTO> errors
    ) {
        for (CompetenceRange range : COMPETENCE_RANGES) {
            String competenceName = readCellText(sheet.getRow(6), range.startColumn(), formatter, evaluator);
            if (competenceName.isBlank()) {
                errors.add(globalError("estructura", "No se detectó el nombre de la competencia " + range.number() + "."));
            }
        }
    }

    private RegistroNotasTrimestreParsedStudent parseStudentRow(
        Sheet sheet,
        Row row,
        int filaExcel,
        Integer order,
        String studentName,
        DataFormatter formatter,
        FormulaEvaluator evaluator
    ) {
        List<ErrorImportacionDTO> errors = new ArrayList<>();
        List<RegistroNotasCompetenciaParsed> competencies = new ArrayList<>();
        List<BigDecimal> competenceAverages = new ArrayList<>();

        for (CompetenceRange range : COMPETENCE_RANGES) {
            RegistroNotasCompetenciaParsed competence = parseCompetencia(sheet, row, filaExcel, studentName, range, formatter, evaluator, errors);
            competencies.add(competence);
            if (competence.promedioCompetencia() != null) {
                competenceAverages.add(competence.promedioCompetencia());
            }
        }

        BigDecimal finalAverage = competenceAverages.isEmpty() ? null : average(competenceAverages);
        return new RegistroNotasTrimestreParsedStudent(
            filaExcel,
            order,
            studentName,
            List.copyOf(competencies),
            finalAverage,
            convertirLogroLiteral(finalAverage),
            List.copyOf(errors)
        );
    }

    private RegistroNotasCompetenciaParsed parseCompetencia(
        Sheet sheet,
        Row row,
        int filaExcel,
        String studentName,
        CompetenceRange range,
        DataFormatter formatter,
        FormulaEvaluator evaluator,
        List<ErrorImportacionDTO> errors
    ) {
        String competenceName = safe(readCellText(sheet.getRow(6), range.startColumn(), formatter, evaluator), "Competencia " + range.number());
        List<RegistroNotasNotaParsed> notes = new ArrayList<>();
        List<BigDecimal> validValues = new ArrayList<>();

        for (int col = range.startColumn(); col <= range.endColumn(); col++) {
            String noteName = safe(readCellText(sheet.getRow(8), col, formatter, evaluator), "Nota " + excelColumn(col));
            Cell cell = row == null ? null : row.getCell(col);
            String rawText = readCellText(cell, formatter, evaluator);
            BigDecimal value = null;
            boolean valid = true;

            if (!rawText.isBlank()) {
                value = readDecimalCell(cell, formatter, evaluator);
                if (value == null) {
                    valid = false;
                    errors.add(rowError(filaExcel, studentName, excelColumn(col), "La celda no contiene una nota numérica válida."));
                } else if (value.compareTo(BigDecimal.ZERO) < 0 || value.compareTo(BigDecimal.valueOf(20)) > 0) {
                    valid = false;
                    errors.add(rowError(filaExcel, studentName, excelColumn(col), "La nota debe estar entre 0 y 20."));
                } else {
                    validValues.add(value);
                }
            }

            notes.add(new RegistroNotasNotaParsed(excelColumn(col), col, noteName, value, valid));
        }

        BigDecimal average = validValues.isEmpty() ? null : average(validValues);
        return new RegistroNotasCompetenciaParsed(
            range.number(),
            competenceName,
            List.copyOf(notes),
            average,
            convertirLogroLiteral(average)
        );
    }

    private ResumenEstadisticoTrimestreDTO calcularResumenTrimestre(List<RegistroNotasTrimestreParsedStudent> students) {
        int matriculados = students.size();
        List<BigDecimal> evaluated = students.stream()
            .map(RegistroNotasTrimestreParsedStudent::promedioFinalTrimestre)
            .filter(Objects::nonNull)
            .toList();
        int evaluados = evaluated.size();
        int aprobados = (int) evaluated.stream().filter((value) -> value.compareTo(BigDecimal.valueOf(10.4)) > 0).count();
        int nivelAD = (int) evaluated.stream().filter((value) -> value.compareTo(BigDecimal.valueOf(17)) > 0).count();
        int nivelA = (int) evaluated.stream()
            .filter((value) -> value.compareTo(BigDecimal.valueOf(13)) > 0 && value.compareTo(BigDecimal.valueOf(17)) <= 0)
            .count();
        int nivelB = (int) evaluated.stream()
            .filter((value) -> value.compareTo(BigDecimal.valueOf(10.5)) >= 0 && value.compareTo(BigDecimal.valueOf(13.4)) <= 0)
            .count();
        int nivelC = (int) evaluated.stream().filter((value) -> value.compareTo(BigDecimal.valueOf(10.5)) < 0).count();

        return new ResumenEstadisticoTrimestreDTO(
            matriculados,
            evaluados,
            matriculados - evaluados,
            aprobados,
            evaluados - aprobados,
            nivelAD,
            nivelA,
            nivelB,
            nivelC,
            percentage(nivelAD, evaluados),
            percentage(nivelA, evaluados),
            percentage(nivelB, evaluados),
            percentage(nivelC, evaluados)
        );
    }

    private Integer readIntegerCell(Row row, int columnIndex, DataFormatter formatter, FormulaEvaluator evaluator) {
        BigDecimal value = readDecimalCell(row == null ? null : row.getCell(columnIndex), formatter, evaluator);
        return value == null ? null : value.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    private BigDecimal readDecimalCell(Cell cell, DataFormatter formatter, FormulaEvaluator evaluator) {
        if (cell == null || cell.getCellType() == CellType.BLANK) {
            return null;
        }

        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return scale(cell.getNumericCellValue());
            }
            if (cell.getCellType() == CellType.FORMULA) {
                CellValue evaluated = evaluator.evaluate(cell);
                if (evaluated == null) {
                    return null;
                }
                if (evaluated.getCellType() == CellType.NUMERIC) {
                    return scale(evaluated.getNumberValue());
                }
                if (evaluated.getCellType() == CellType.STRING) {
                    return parseDecimal(evaluated.getStringValue());
                }
                return null;
            }
            return parseDecimal(formatter.formatCellValue(cell));
        } catch (Exception ignored) {
            return null;
        }
    }

    private String readCellText(Row row, int columnIndex, DataFormatter formatter, FormulaEvaluator evaluator) {
        return readCellText(row == null ? null : row.getCell(columnIndex), formatter, evaluator);
    }

    private String readCellText(Cell cell, DataFormatter formatter, FormulaEvaluator evaluator) {
        if (cell == null) {
            return "";
        }
        try {
            return formatter.formatCellValue(cell, evaluator).trim();
        } catch (Exception ignored) {
            try {
                return formatter.formatCellValue(cell).trim();
            } catch (Exception ignoredAgain) {
                return "";
            }
        }
    }

    private BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value.trim().replace(",", ".")).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private boolean isInvalidStudentName(String name) {
        String normalized = NombreNormalizador.normalizar(name);
        return normalized.isBlank() || Objects.equals(normalized, "0") || normalized.length() < 4;
    }

    private boolean isSummaryLabel(String name) {
        String normalized = NombreNormalizador.normalizar(name);
        return normalized.contains("MATRICULADOS")
            || normalized.contains("EVALUADOS")
            || normalized.contains("APROBADOS")
            || normalized.contains("DESAPROBADOS")
            || normalized.contains("LOGRO DESTACADO")
            || normalized.contains("RESUMEN");
    }

    private String convertirLogroLiteral(BigDecimal value) {
        if (value == null) {
            return null;
        }
        if (value.compareTo(BigDecimal.TEN) <= 0) {
            return "C";
        }
        if (value.compareTo(BigDecimal.valueOf(14)) <= 0) {
            return "B";
        }
        if (value.compareTo(BigDecimal.valueOf(19)) <= 0) {
            return "A";
        }
        return "AD";
    }

    private BigDecimal average(List<BigDecimal> values) {
        BigDecimal total = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal percentage(int count, int total) {
        if (total == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(count)
            .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal scale(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private String excelColumn(int zeroBasedColumn) {
        int value = zeroBasedColumn + 1;
        StringBuilder column = new StringBuilder();
        while (value > 0) {
            int remainder = (value - 1) % 26;
            column.insert(0, (char) ('A' + remainder));
            value = (value - 1) / 26;
        }
        return column.toString();
    }

    private String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private ErrorImportacionDTO globalError(String field, String description) {
        return new ErrorImportacionDTO(null, null, field, description, true);
    }

    private ErrorImportacionDTO rowError(int filaExcel, String studentName, String field, String description) {
        return new ErrorImportacionDTO(filaExcel, studentName, field, description, false);
    }

    private record CompetenceRange(int number, int startColumn, int endColumn, int averageColumn) {}
}
