package pe.edu.aduniplus.backend.notas.importacion;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class RegistroNotasTrimestreParserTest {
    private final RegistroNotasTrimestreParser parser = new RegistroNotasTrimestreParser();

    @Test
    void parsesOnlySelectedTrimesterWithIndividualScoresAndAverages() throws Exception {
        RegistroNotasTrimestreParseResult result = parser.parse(workbookBytes(false), PeriodoExcel.II_TRIMESTRE);

        assertThat(result.metadata().anio()).isEqualTo(2025);
        assertThat(result.metadata().trimestre()).isEqualTo("II_TRIMESTRE");
        assertThat(result.estudiantes()).hasSize(1);

        RegistroNotasTrimestreParsedStudent student = result.estudiantes().getFirst();
        assertThat(student.nombreExcel()).isEqualTo("APARCO BERROCAL YHOSHUA ADRIEL");
        assertThat(student.competencias()).hasSize(4);
        assertThat(student.competencias().get(0).notas()).hasSize(6);
        assertThat(student.competencias().get(0).notas().get(0).columnaExcel()).isEqualTo("F");
        assertThat(student.competencias().get(0).notas().get(0).nombreNota()).isEqualTo("PRACTICA");
        assertThat(student.competencias().get(0).notas().get(0).valor()).isEqualByComparingTo(BigDecimal.valueOf(12).setScale(2));
        assertThat(student.competencias().get(0).promedioCompetencia()).isEqualByComparingTo(BigDecimal.valueOf(14).setScale(2));
        assertThat(student.competencias().get(0).logroLiteral()).isEqualTo("B");
        assertThat(student.promedioFinalTrimestre()).isEqualByComparingTo(BigDecimal.valueOf(15.25));
        assertThat(student.logroFinalTrimestre()).isEqualTo("A");
        assertThat(result.resumen().matriculados()).isEqualTo(1);
        assertThat(result.resumen().evaluados()).isEqualTo(1);
        assertThat(result.errores()).isEmpty();
    }

    @Test
    void flagsScoreOutsideAllowedRange() throws Exception {
        RegistroNotasTrimestreParseResult result = parser.parse(workbookBytes(true), PeriodoExcel.I_TRIMESTRE);

        RegistroNotasTrimestreParsedStudent student = result.estudiantes().getFirst();
        assertThat(student.errores()).hasSize(1);
        assertThat(student.errores().getFirst().campo()).isEqualTo("F");
        assertThat(student.competencias().getFirst().notas().getFirst().valida()).isFalse();
    }

    private byte[] workbookBytes(boolean withInvalidScore) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet inicio = workbook.createSheet("INICIO");
            inicio.createRow(10).createCell(4).setCellValue(2025);
            inicio.createRow(11).createCell(1).setCellValue("SECUNDARIA");
            inicio.createRow(12).createCell(1).setCellValue("ADUNI MAS");
            inicio.createRow(13).createCell(1).setCellValue("SAN JERONIMO");
            inicio.createRow(14).createCell(1).setCellValue("MATEMÁTICA");
            inicio.createRow(15).createCell(1).setCellValue("Prof. DANIEL CARDENAS");
            Row gradeRow = inicio.createRow(16);
            gradeRow.createCell(1).setCellValue("PRIMERO");
            gradeRow.createCell(3).setCellValue("A");

            createTrimester(workbook, "I TRIMESTRE", withInvalidScore ? 25 : 20);
            createTrimester(workbook, "II TRIMESTRE", 12);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void createTrimester(Workbook workbook, String sheetName, double firstScore) {
        Sheet sheet = workbook.createSheet(sheetName);
        Row competenceRow = sheet.createRow(6);
        competenceRow.createCell(5).setCellValue("Competencia 1");
        competenceRow.createCell(12).setCellValue("Competencia 2");
        competenceRow.createCell(19).setCellValue("Competencia 3");
        competenceRow.createCell(26).setCellValue("Competencia 4");

        Row noteHeaderRow = sheet.createRow(8);
        for (int column : new int[] {5, 12, 19, 26}) {
            noteHeaderRow.createCell(column).setCellValue("PRACTICA");
        }

        Row studentRow = sheet.createRow(16);
        studentRow.createCell(0).setCellValue(1);
        studentRow.createCell(1).setCellValue("APARCO BERROCAL YHOSHUA ADRIEL");
        studentRow.createCell(5).setCellValue(firstScore);
        studentRow.createCell(6).setCellValue(16);
        studentRow.createCell(12).setCellValue(15);
        studentRow.createCell(19).setCellValue(14);
        studentRow.createCell(26).setCellValue(18);
    }
}
