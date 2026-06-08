package pe.edu.aduniplus.backend.notas;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EvaluacionRepository extends JpaRepository<Evaluacion, Long> {
    List<Evaluacion> findByCursoIdAndPeriodoAcademicoIdOrderByOrdenAsc(Long cursoId, Long periodoAcademicoId);
    boolean existsByCursoIdAndPeriodoAcademicoIdAndNombre(Long cursoId, Long periodoAcademicoId, String nombre);
}
