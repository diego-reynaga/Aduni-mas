package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CursoRepository extends JpaRepository<Curso, Long> {
    List<Curso> findByGradoId(Long gradoId);
    List<Curso> findByMateriaId(Long materiaId);
    Optional<Curso> findByGradoIdAndMateriaId(Long gradoId, Long materiaId);
    boolean existsByGradoIdAndMateriaId(Long gradoId, Long materiaId);
}
