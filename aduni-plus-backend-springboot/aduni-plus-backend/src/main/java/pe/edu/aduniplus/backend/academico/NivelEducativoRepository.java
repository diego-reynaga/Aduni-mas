package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NivelEducativoRepository extends JpaRepository<NivelEducativo, Long> {
    List<NivelEducativo> findByGestionAcademicaId(Long gestionAcademicaId);
    boolean existsByGestionAcademicaIdAndNombreAndTurno(Long gestionAcademicaId, String nombre, Turno turno);
}
