package pe.edu.aduniplus.backend.persona;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    Optional<Estudiante> findByCodigoEstudiante(String codigoEstudiante);
    boolean existsByCodigoEstudiante(String codigoEstudiante);
    java.util.List<Estudiante> findByApoderadoId(Long apoderadoId);
}
