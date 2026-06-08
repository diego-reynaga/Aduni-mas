package pe.edu.aduniplus.backend.persona;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DocenteRepository extends JpaRepository<Docente, Long> {
    Optional<Docente> findByCodigoDocente(String codigoDocente);
    boolean existsByCodigoDocente(String codigoDocente);
}
