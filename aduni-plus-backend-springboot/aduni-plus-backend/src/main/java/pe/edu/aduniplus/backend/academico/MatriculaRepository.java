package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {
    List<Matricula> findByEstudianteId(Long estudianteId);
    List<Matricula> findBySeccionId(Long seccionId);
    boolean existsByEstudianteIdAndSeccionId(Long estudianteId, Long seccionId);
    int countBySeccionIdAndEstado(Long seccionId, String estado);
}
