package pe.edu.aduniplus.backend.pago;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CronogramaPagoRepository extends JpaRepository<CronogramaPago, Long> {
    List<CronogramaPago> findByEstudianteIdOrderByCreadoEnDesc(Long estudianteId);
    List<CronogramaPago> findByGestionAcademicaId(Long gestionAcademicaId);
    List<CronogramaPago> findByActivoTrue();
}
