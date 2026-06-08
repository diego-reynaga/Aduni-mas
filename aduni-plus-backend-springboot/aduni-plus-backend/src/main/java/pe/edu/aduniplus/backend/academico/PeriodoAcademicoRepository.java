package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PeriodoAcademicoRepository extends JpaRepository<PeriodoAcademico, Long> {
    List<PeriodoAcademico> findByGestionAcademicaIdOrderByOrdenAsc(Long gestionAcademicaId);
    boolean existsByGestionAcademicaIdAndNombre(Long gestionAcademicaId, String nombre);
}
