package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DetalleMatriculaRepository extends JpaRepository<DetalleMatricula, Long> {
    Optional<DetalleMatricula> findByMatriculaIdAndMateriaId(Long matriculaId, Long materiaId);
    List<DetalleMatricula> findByMatriculaId(Long matriculaId);
    List<DetalleMatricula> findByMateriaId(Long materiaId);
    List<DetalleMatricula> findByMatriculaEstudianteIdAndMateriaId(Long estudianteId, Long materiaId);
    boolean existsByMatriculaIdAndMateriaId(Long matriculaId, Long materiaId);
}
