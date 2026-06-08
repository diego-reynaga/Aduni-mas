package pe.edu.aduniplus.backend.academico;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GradoRepository extends JpaRepository<Grado, Long> {
    List<Grado> findByNivelEducativoId(Long nivelEducativoId);
    boolean existsByNivelEducativoIdAndNombreAndParalelo(Long nivelEducativoId, String nombre, String paralelo);
}
