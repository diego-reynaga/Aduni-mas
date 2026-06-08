package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {
    Optional<Matricula> findByCodigoMatricula(String codigoMatricula);
    Optional<Matricula> findByEstudianteIdAndGradoId(Long estudianteId, Long gradoId);
    List<Matricula> findByEstudianteId(Long estudianteId);
    List<Matricula> findByGradoId(Long gradoId);
    List<Matricula> findByGradoIdAndEstado(Long gradoId, EstadoMatricula estado);
    boolean existsByEstudianteIdAndGradoId(Long estudianteId, Long gradoId);
}
