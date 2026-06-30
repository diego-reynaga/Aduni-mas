package pe.edu.aduniplus.backend.pago;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface PagoRepository extends JpaRepository<Pago, Long> {
    List<Pago> findByCronogramaId(Long cronogramaId);
    List<Pago> findByFechaPagoBetween(LocalDate startDate, LocalDate endDate);
}
