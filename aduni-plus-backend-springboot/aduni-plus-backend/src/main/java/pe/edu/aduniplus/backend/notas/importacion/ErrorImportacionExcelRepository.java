package pe.edu.aduniplus.backend.notas.importacion;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ErrorImportacionExcelRepository extends JpaRepository<ErrorImportacionExcel, Long> {
    List<ErrorImportacionExcel> findByImportacionNotasIdOrderByFilaExcelAscIdAsc(Long importacionNotasId);
}
