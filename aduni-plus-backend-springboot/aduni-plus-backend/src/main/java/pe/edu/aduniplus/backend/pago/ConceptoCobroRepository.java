package pe.edu.aduniplus.backend.pago;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ConceptoCobroRepository extends JpaRepository<ConceptoCobro, Long> {
    List<ConceptoCobro> findByActivoTrue();
    Optional<ConceptoCobro> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
}
