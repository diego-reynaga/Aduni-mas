package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GestionAcademicaRepository extends JpaRepository<GestionAcademica, Long> {
    Optional<GestionAcademica> findByAnio(Integer anio);
    Optional<GestionAcademica> findByActivaTrue();
    boolean existsByAnio(Integer anio);
}
