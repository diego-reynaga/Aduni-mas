package pe.edu.aduniplus.backend.pago;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CuotaRepository extends JpaRepository<Cuota, Long> {
    List<Cuota> findByCronogramaIdOrderByNumeroCuotaAsc(Long cronogramaId);
    List<Cuota> findByCronogramaIdAndEstado(Long cronogramaId, EstadoCuota estado);
}
