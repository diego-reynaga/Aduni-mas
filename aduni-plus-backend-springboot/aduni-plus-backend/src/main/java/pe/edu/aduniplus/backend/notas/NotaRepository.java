package pe.edu.aduniplus.backend.notas;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotaRepository extends JpaRepository<Nota, Long> {
    Optional<Nota> findByEstudianteIdAndEvaluacionId(Long estudianteId, Long evaluacionId);
    List<Nota> findByEstudianteId(Long estudianteId);
    List<Nota> findByEvaluacionId(Long evaluacionId);
    boolean existsByEstudianteIdAndEvaluacionId(Long estudianteId, Long evaluacionId);
}
