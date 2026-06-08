package pe.edu.aduniplus.backend.institucion;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ConfiguracionInstitucionalRepository extends JpaRepository<ConfiguracionInstitucional, Long> {
    Optional<ConfiguracionInstitucional> findByCodigo(String codigo);
}
