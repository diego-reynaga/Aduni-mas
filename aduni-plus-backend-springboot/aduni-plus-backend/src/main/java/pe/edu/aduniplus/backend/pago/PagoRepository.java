package pe.edu.aduniplus.backend.pago;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface PagoRepository extends JpaRepository<Pago, Long> {
    List<Pago> findByEstudianteIdOrderByFechaPagoDesc(Long estudianteId);
    List<Pago> findByEstudianteIdAndFechaPagoBetween(Long estudianteId, LocalDate startDate, LocalDate endDate);
    List<Pago> findByCuotaId(Long cuotaId);
    List<Pago> findByCronogramaId(Long cronogramaId);
    List<Pago> findByAnuladoFalse();
    List<Pago> findByFechaPagoBetween(LocalDate startDate, LocalDate endDate);
}
