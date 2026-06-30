package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SeccionRepository extends JpaRepository<Seccion, Long> {
    
    @Override
    @EntityGraph(attributePaths = {"ciclo", "turno"})
    List<Seccion> findAll();
    
    @EntityGraph(attributePaths = {"ciclo", "turno"})
    java.util.Optional<Seccion> findById(Long id);
    
    List<Seccion> findByCicloId(Long cicloId);
    List<Seccion> findByTurnoId(Long turnoId);
    List<Seccion> findByCicloIdAndTurnoId(Long cicloId, Long turnoId);
}
