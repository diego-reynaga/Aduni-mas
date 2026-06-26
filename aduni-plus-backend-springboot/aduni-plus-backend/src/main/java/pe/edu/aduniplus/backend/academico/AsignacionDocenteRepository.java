package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AsignacionDocenteRepository extends JpaRepository<AsignacionDocente, Long> {
    List<AsignacionDocente> findByDocenteId(Long docenteId);
    List<AsignacionDocente> findByDocenteIdAndEstado(Long docenteId, EstadoAsignacionDocente estado);
    List<AsignacionDocente> findByCursoId(Long cursoId);
    List<AsignacionDocente> findByDocenteIdAndPeriodoAcademicoId(Long docenteId, Long periodoAcademicoId);
    boolean existsByDocenteIdAndCursoIdAndPeriodoAcademicoId(Long docenteId, Long cursoId, Long periodoAcademicoId);
    java.util.Optional<AsignacionDocente> findByCursoIdAndPeriodoAcademicoIdAndEstado(Long cursoId, Long periodoId, EstadoAsignacionDocente estado);
}
