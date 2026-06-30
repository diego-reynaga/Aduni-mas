package pe.edu.aduniplus.backend.notas;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EvaluacionRepository extends JpaRepository<Evaluacion, Long> {
    List<Evaluacion> findByCicloId(Long cicloId);
    boolean existsByCicloIdAndNombre(Long cicloId, String nombre);
}
