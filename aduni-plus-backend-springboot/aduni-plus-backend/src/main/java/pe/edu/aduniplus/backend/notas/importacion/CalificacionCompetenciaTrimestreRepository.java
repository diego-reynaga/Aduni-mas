package pe.edu.aduniplus.backend.notas.importacion;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CalificacionCompetenciaTrimestreRepository extends JpaRepository<CalificacionCompetenciaTrimestre, Long> {
    Optional<CalificacionCompetenciaTrimestre> findByDetalleMatriculaIdAndTrimestreAndNumeroCompetencia(
        Long detalleMatriculaId,
        PeriodoExcel trimestre,
        Integer numeroCompetencia
    );
}
