package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DetalleMatriculaRepository extends JpaRepository<DetalleMatricula, Long> {
    Optional<DetalleMatricula> findByMatriculaIdAndCursoId(Long matriculaId, Long cursoId);
    List<DetalleMatricula> findByMatriculaId(Long matriculaId);
    List<DetalleMatricula> findByCursoId(Long cursoId);
    List<DetalleMatricula> findByMatriculaEstudianteIdAndCursoId(Long estudianteId, Long cursoId);
    boolean existsByMatriculaIdAndCursoId(Long matriculaId, Long cursoId);
}
