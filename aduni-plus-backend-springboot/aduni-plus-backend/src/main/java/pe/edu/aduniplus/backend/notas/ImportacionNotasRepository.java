package pe.edu.aduniplus.backend.notas;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImportacionNotasRepository extends JpaRepository<ImportacionNotas, Long> {
    List<ImportacionNotas> findByDocenteId(Long docenteId);
    List<ImportacionNotas> findByDocenteIdOrderByCreadoEnDesc(Long docenteId);
    List<ImportacionNotas> findByCursoIdAndPeriodoAcademicoId(Long cursoId, Long periodoAcademicoId);
}
