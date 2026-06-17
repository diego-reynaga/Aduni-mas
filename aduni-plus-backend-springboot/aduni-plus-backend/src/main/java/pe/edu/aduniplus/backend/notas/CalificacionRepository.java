package pe.edu.aduniplus.backend.notas;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CalificacionRepository extends JpaRepository<Calificacion, Long> {
    Optional<Calificacion> findByDetalleMatriculaIdAndPeriodoAcademicoIdAndTrimestre(
        Long detalleMatriculaId,
        Long periodoAcademicoId,
        String trimestre
    );

    List<Calificacion> findByDetalleMatriculaMatriculaEstudianteId(Long estudianteId);
}
