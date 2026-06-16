package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AsignacionDocenteRepository extends JpaRepository<AsignacionDocente, Long> {
    List<AsignacionDocente> findByDocenteId(Long docenteId);
    List<AsignacionDocente> findByDocenteIdAndEstado(Long docenteId, EstadoAsignacionDocente estado);
    List<AsignacionDocente> findByCursoId(Long cursoId);
    List<AsignacionDocente> findByCursoIdAndPeriodoAcademicoId(Long cursoId, Long periodoAcademicoId);
    List<AsignacionDocente> findByDocenteIdAndPeriodoAcademicoId(Long docenteId, Long periodoAcademicoId);
    Optional<AsignacionDocente> findByDocenteIdAndCursoIdAndPeriodoAcademicoId(Long docenteId, Long cursoId, Long periodoAcademicoId);
    boolean existsByDocenteIdAndCursoIdAndPeriodoAcademicoId(Long docenteId, Long cursoId, Long periodoAcademicoId);
}
