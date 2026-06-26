package pe.edu.aduniplus.backend.persona;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AdministrativoRepository extends JpaRepository<Administrativo, Long> {
    Optional<Administrativo> findByCodigoAdministrativo(String codigoAdministrativo);
    boolean existsByCodigoAdministrativo(String codigoAdministrativo);
}
