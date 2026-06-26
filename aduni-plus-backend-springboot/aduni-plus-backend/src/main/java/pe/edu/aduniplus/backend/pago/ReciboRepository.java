package pe.edu.aduniplus.backend.pago;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReciboRepository extends JpaRepository<Recibo, Long> {
    Optional<Recibo> findByNumeroRecibo(String numeroRecibo);
    Optional<Recibo> findByPagoId(Long pagoId);
    long countByNumeroReciboStartingWith(String prefix);
}
