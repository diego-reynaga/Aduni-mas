package pe.edu.aduniplus.backend.persona;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EstudianteApoderadoRepository extends JpaRepository<EstudianteApoderado, Long> {
    List<EstudianteApoderado> findByEstudianteId(Long estudianteId);
    List<EstudianteApoderado> findByPadreFamiliaId(Long padreFamiliaId);
    boolean existsByEstudianteIdAndPadreFamiliaId(Long estudianteId, Long padreFamiliaId);
}
