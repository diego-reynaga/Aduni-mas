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
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasMetadataDTO;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class RegistroNotasExcelParser {
    private static final int FIRST_STUDENT_ROW_INDEX = 16;
    private static final int COLUMN_ORDER = 0;
    private static final int COLUMN_STUDENT = 1;
    private static final int[][] COMPETENCE_RANGES = {
        {5, 10},
        {12, 17},
        {19, 24},
        {26, 31}
    };

    RegistroNotasParseResult parse(byte[] content) {
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(content))) {
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            DataFormatter formatter = new DataFormatter(Locale.US, false);
            List<ErrorImportacionDTO> globalErrors = new ArrayList<>();

            Sheet inicio = workbook.getSheet("INICIO");
            if (inicio == null) {
                throw new IllegalArgumentException("El archivo no contiene la hoja INICIO.");
            }
            if (workbook.getSheet("RESUMEN ANUAL") == null) {
                globalErrors.add(globalError("ESTRUCTURA", "El archivo no contiene la hoja RESUMEN ANUAL."));
            }

            RegistroNotasMetadataDTO metadata = readMetadata(inicio, formatter, evaluator, globalErrors);
            Map<Integer, String> namesByOrder = new LinkedHashMap<>();
            Map<String, StudentBuilder> builders = new LinkedHashMap<>();
            int trimesterSheets = 0;

            trimesterSheets += readTrimester(workbook, PeriodoExcel.I_TRIMESTRE, formatter, evaluator, namesByOrder, builders, globalErrors);
            trimesterSheets += readTrimester(workbook, PeriodoExcel.II_TRIMESTRE, formatter, evaluator, namesByOrder, builders, globalErrors);
            trimesterSheets += readTrimester(workbook, PeriodoExcel.III_TRIMESTRE, formatter, evaluator, namesByOrder, builders, globalErrors);

            if (trimesterSheets == 0) {
                globalErrors.add(globalError("ESTRUCTURA", "El archivo debe contener al menos una hoja de trimestre."));
            }

            List<RegistroNotasParsedStudent> students = builders.values().stream()
                .map(StudentBuilder::build)
                .sorted(Comparator
                    .comparing((RegistroNotasParsedStudent item) -> item.numeroOrden() == null ? Integer.MAX_VALUE : item.numeroOrden())
                    .thenComparing(RegistroNotasParsedStudent::filaExcel))
                .toList();

            return new RegistroNotasParseResult(metadata, students, globalErrors);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("No se pudo leer el archivo Excel institucional.");
        }
    }

    private RegistroNotasMetadataDTO readMetadata(
        Sheet inicio,
        DataFormatter formatter,
        FormulaEvaluator evaluator,
        List<ErrorImportacionDTO> errors
    ) {
        Integer anio = readIntegerCell(inicio.getRow(10), 4, formatter, evaluator);
        if (anio == null) {
            errors.add(globalError("anio", "No se pudo leer el año desde INICIO!E11."));
        }

        RegistroNotasMetadataDTO metadata = new RegistroNotasMetadataDTO(
            anio,
            readCellText(inicio.getRow(11), 1, formatter, evaluator),
            readCellText(inicio.getRow(12), 1, formatter, evaluator),
            readCellText(inicio.getRow(13), 1, formatter, evaluator),
            readCellText(inicio.getRow(14), 1, formatter, evaluator),
            readCellText(inicio.getRow(15), 1, formatter, evaluator),
            readCellText(inicio.getRow(16), 1, formatter, evaluator),
            readCellText(inicio.getRow(16), 3, formatter, evaluator)
        );

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

    private int readTrimester(
        Workbook workbook,
        PeriodoExcel period,
        DataFormatter formatter,
        FormulaEvaluator evaluator,
        Map<Integer, String> namesByOrder,
        Map<String, StudentBuilder> builders,
        List<ErrorImportacionDTO> globalErrors
    ) {
        Sheet sheet = workbook.getSheet(period.nombre());
        if (sheet == null) {
            globalErrors.add(globalError("ESTRUCTURA", "El archivo no contiene la hoja " + period.nombre() + "."));
            return 0;
        }

        int blankStreak = 0;
        for (int rowIndex = FIRST_STUDENT_ROW_INDEX; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            Integer order = readIntegerCell(row, COLUMN_ORDER, formatter, evaluator);
            String name = readCellText(row, COLUMN_STUDENT, formatter, evaluator);
            if ((name.isBlank() || isFormulaLike(name)) && order != null) {
                name = namesByOrder.getOrDefault(order, name);
            }

            if (isInvalidStudentName(name) || isSummaryLabel(name)) {
                blankStreak++;
                if (blankStreak >= 3 || order == null || isSummaryLabel(name)) {
                    break;
                }
                continue;
            }
            blankStreak = 0;

            if (period == PeriodoExcel.I_TRIMESTRE && order != null) {
                namesByOrder.put(order, name);
            }

            Integer rowOrder = order;
            String rowName = name;
            int excelRow = rowIndex + 1;
            StudentBuilder builder = builders.computeIfAbsent(studentKey(rowOrder, rowName), (key) -> new StudentBuilder(excelRow, rowOrder, rowName));
            builder.keepIdentity(excelRow, rowOrder, rowName);
            TermCalculation term = calculateTerm(row, excelRow, rowName, formatter, evaluator);
            builder.setTerm(period, term.promedio());
            builder.addErrors(term.errores());
        }

        return 1;
    }

    private TermCalculation calculateTerm(
        Row row,
        int filaExcel,
        String studentName,
        DataFormatter formatter,
        FormulaEvaluator evaluator
    ) {
        List<BigDecimal> competenceAverages = new ArrayList<>();
        List<ErrorImportacionDTO> errors = new ArrayList<>();

        for (int index = 0; index < COMPETENCE_RANGES.length; index++) {
            int[] range = COMPETENCE_RANGES[index];
            List<BigDecimal> values = new ArrayList<>();
            for (int col = range[0]; col <= range[1]; col++) {
                Cell cell = row == null ? null : row.getCell(col);
                String text = readCellText(cell, formatter, evaluator);
                if (text.isBlank()) {
                    continue;
                }

                BigDecimal value = readDecimalCell(cell, formatter, evaluator);
                if (value == null) {
                    errors.add(rowError(filaExcel, studentName, excelColumn(col), "La celda no contiene una nota numérica válida."));
                    continue;
                }
                if (value.compareTo(BigDecimal.ZERO) < 0 || value.compareTo(BigDecimal.valueOf(20)) > 0) {
                    errors.add(rowError(filaExcel, studentName, excelColumn(col), "La nota debe estar entre 0 y 20."));
                    continue;
                }
                values.add(value);
            }

            if (!values.isEmpty()) {
                competenceAverages.add(average(values));
            }
        }

        BigDecimal promedio = competenceAverages.isEmpty() ? null : average(competenceAverages);
        return new TermCalculation(promedio, errors);
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

    private boolean isFormulaLike(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        return normalized.startsWith("=")
            || normalized.startsWith("IF(")
            || normalized.contains("VLOOKUP")
            || normalized.contains("#REF!");
    }

    private String studentKey(Integer order, String name) {
        if (order != null) {
            return "#" + order;
        }
        return NombreNormalizador.normalizar(name);
    }

    private BigDecimal average(List<BigDecimal> values) {
        BigDecimal total = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal scale(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private ErrorImportacionDTO globalError(String field, String description) {
        return new ErrorImportacionDTO(null, null, field, description, true);
    }

    private ErrorImportacionDTO rowError(int filaExcel, String studentName, String field, String description) {
        return new ErrorImportacionDTO(filaExcel, studentName, field, description, false);
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

    private String logroLiteral(BigDecimal value) {
        if (value == null) {
            return "";
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

    private String situacionFinal(BigDecimal value) {
        if (value == null) {
            return "NO EVALUADO";
        }
        if (value.compareTo(BigDecimal.valueOf(10.5)) < 0) {
            return "EN INICIO";
        }
        if (value.compareTo(BigDecimal.valueOf(13.5)) < 0) {
            return "EN PROCESO";
        }
        if (value.compareTo(BigDecimal.valueOf(17.5)) < 0) {
            return "LOGRO PREVISTO";
        }
        return "LOGRO DESTACADO";
    }

    private record TermCalculation(BigDecimal promedio, List<ErrorImportacionDTO> errores) {}

    private final class StudentBuilder {
        private int filaExcel;
        private Integer numeroOrden;
        private String nombreExcel;
        private final Map<PeriodoExcel, BigDecimal> notas = new EnumMap<>(PeriodoExcel.class);
        private final List<ErrorImportacionDTO> errors = new ArrayList<>();

        private StudentBuilder(int filaExcel, Integer numeroOrden, String nombreExcel) {
            this.filaExcel = filaExcel;
            this.numeroOrden = numeroOrden;
            this.nombreExcel = nombreExcel;
        }

        private void keepIdentity(int filaExcel, Integer numeroOrden, String nombreExcel) {
            if (this.nombreExcel == null || isFormulaLike(this.nombreExcel)) {
                this.nombreExcel = nombreExcel;
            }
            if (this.numeroOrden == null) {
                this.numeroOrden = numeroOrden;
            }
            this.filaExcel = Math.min(this.filaExcel, filaExcel);
        }

        private void setTerm(PeriodoExcel period, BigDecimal value) {
            if (value != null) {
                notas.put(period, value);
            }
        }

        private void addErrors(List<ErrorImportacionDTO> rowErrors) {
            errors.addAll(rowErrors);
        }

        private RegistroNotasParsedStudent build() {
            List<BigDecimal> trimesterValues = new ArrayList<>();
            addIfPresent(trimesterValues, notas.get(PeriodoExcel.I_TRIMESTRE));
            addIfPresent(trimesterValues, notas.get(PeriodoExcel.II_TRIMESTRE));
            addIfPresent(trimesterValues, notas.get(PeriodoExcel.III_TRIMESTRE));
            BigDecimal promedioAnual = trimesterValues.isEmpty() ? null : average(trimesterValues);
            return new RegistroNotasParsedStudent(
                filaExcel,
                numeroOrden,
                nombreExcel,
                Map.copyOf(notas),
                promedioAnual,
                logroLiteral(promedioAnual),
                situacionFinal(promedioAnual),
                List.copyOf(errors)
            );
        }

        private void addIfPresent(List<BigDecimal> values, BigDecimal value) {
            if (value != null) {
                values.add(value);
            }
        }
    }
}
