package pe.edu.aduniplus.backend.notas;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImportacionNotasRepository extends JpaRepository<ImportacionNotas, Long> {
    List<ImportacionNotas> findAllByOrderByCreadoEnDesc();
    List<ImportacionNotas> findByAsignacionDocenteDocenteId(Long docenteId);
    List<ImportacionNotas> findByAsignacionDocenteDocenteIdOrderByCreadoEnDesc(Long docenteId);
    List<ImportacionNotas> findByAsignacionDocenteCursoIdAndAsignacionDocentePeriodoAcademicoId(Long cursoId, Long periodoAcademicoId);
}
