package pe.edu.aduniplus.backend.notas.importacion;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CalificacionDetalleTrimestreRepository extends JpaRepository<CalificacionDetalleTrimestre, Long> {
    Optional<CalificacionDetalleTrimestre> findByDetalleMatriculaIdAndTrimestreAndNumeroCompetenciaAndColumnaExcel(
        Long detalleMatriculaId,
        PeriodoExcel trimestre,
        Integer numeroCompetencia,
        String columnaExcel
    );
}
