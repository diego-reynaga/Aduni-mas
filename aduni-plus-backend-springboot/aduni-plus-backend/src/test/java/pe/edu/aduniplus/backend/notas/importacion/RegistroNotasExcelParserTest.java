package pe.edu.aduniplus.backend.notas.importacion;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class RegistroNotasExcelParserTest {
    private final RegistroNotasExcelParser parser = new RegistroNotasExcelParser();

    @Test
    void parsesMetadataStudentsAndOwnAverages() throws Exception {
        RegistroNotasParseResult result = parser.parse(workbookBytes());

        assertThat(result.metadata().anio()).isEqualTo(2025);
        assertThat(result.metadata().areaCurricular()).isEqualTo("MATEMÁTICA");
        assertThat(result.estudiantes()).hasSize(1);

        RegistroNotasParsedStudent student = result.estudiantes().getFirst();
        assertThat(student.filaExcel()).isEqualTo(17);
        assertThat(student.nombreExcel()).isEqualTo("APARCO BERROCAL YHOSHUA ADRIEL");
        assertThat(student.notas().get(PeriodoExcel.I_TRIMESTRE)).isEqualByComparingTo(BigDecimal.valueOf(15).setScale(2));
        assertThat(student.notas().get(PeriodoExcel.II_TRIMESTRE)).isEqualByComparingTo(BigDecimal.valueOf(13).setScale(2));
        assertThat(student.notas().get(PeriodoExcel.III_TRIMESTRE)).isEqualByComparingTo(BigDecimal.valueOf(12).setScale(2));
        assertThat(student.promedioAnual()).isEqualByComparingTo(BigDecimal.valueOf(13.33));
        assertThat(student.situacionFinal()).isEqualTo("EN PROCESO");
        assertThat(result.errores()).isEmpty();
    }

    private byte[] workbookBytes() throws Exception {
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

            workbook.createSheet("RESUMEN ANUAL");
            createTrimester(workbook, "I TRIMESTRE", 12, 14, 16, 18);
            createTrimester(workbook, "II TRIMESTRE", 13, 13, 13, 13);
            createTrimester(workbook, "III TRIMESTRE", 12, 12, 12, 12);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void createTrimester(Workbook workbook, String sheetName, double c1, double c2, double c3, double c4) {
        Sheet sheet = workbook.createSheet(sheetName);
        Row row = sheet.createRow(16);
        row.createCell(0).setCellValue(1);
        row.createCell(1).setCellValue("APARCO BERROCAL YHOSHUA ADRIEL");
        row.createCell(5).setCellValue(c1);
        row.createCell(12).setCellValue(c2);
        row.createCell(19).setCellValue(c3);
        row.createCell(26).setCellValue(c4);
    }
}
