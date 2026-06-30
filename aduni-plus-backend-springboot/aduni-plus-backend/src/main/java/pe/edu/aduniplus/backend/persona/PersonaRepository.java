package pe.edu.aduniplus.backend.persona;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PersonaRepository extends JpaRepository<Persona, Long> {
    Optional<Persona> findByNumeroDocumento(String numeroDocumento);
    Optional<Persona> findByCorreo(String correo);
    boolean existsByNumeroDocumento(String numeroDocumento);
}
