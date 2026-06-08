package pe.edu.aduniplus.backend.notas;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PromedioAcademicoRepository extends JpaRepository<PromedioAcademico, Long> {
    Optional<PromedioAcademico> findByEstudianteIdAndCursoIdAndPeriodoAcademicoId(Long estudianteId, Long cursoId, Long periodoAcademicoId);
    List<PromedioAcademico> findByEstudianteId(Long estudianteId);
    List<PromedioAcademico> findByEstudianteIdAndPublicadoTrue(Long estudianteId);
    List<PromedioAcademico> findByEstudianteIdInAndPublicadoTrue(List<Long> estudianteIds);
    List<PromedioAcademico> findByCursoIdAndPeriodoAcademicoId(Long cursoId, Long periodoAcademicoId);
}
