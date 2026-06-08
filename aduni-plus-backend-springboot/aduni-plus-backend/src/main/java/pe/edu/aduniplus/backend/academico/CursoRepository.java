package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CursoRepository extends JpaRepository<Curso, Long> {
    List<Curso> findByGradoId(Long gradoId);
    List<Curso> findByMateriaId(Long materiaId);
    boolean existsByGradoIdAndMateriaId(Long gradoId, Long materiaId);
}
