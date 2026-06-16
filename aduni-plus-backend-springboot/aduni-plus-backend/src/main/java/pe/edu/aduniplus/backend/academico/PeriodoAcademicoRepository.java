package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PeriodoAcademicoRepository extends JpaRepository<PeriodoAcademico, Long> {
    Optional<PeriodoAcademico> findByGestionAcademicaIdAndNombre(Long gestionAcademicaId, String nombre);
    List<PeriodoAcademico> findByGestionAcademicaIdOrderByOrdenAsc(Long gestionAcademicaId);
    boolean existsByGestionAcademicaIdAndNombre(Long gestionAcademicaId, String nombre);
}
