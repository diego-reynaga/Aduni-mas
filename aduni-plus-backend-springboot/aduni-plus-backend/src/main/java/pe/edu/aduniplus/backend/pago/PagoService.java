package pe.edu.aduniplus.backend.pago;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PagoRepository pagoRepository;
    private final CronogramaPagoRepository cronogramaPagoRepository;

    @Transactional(readOnly = true)
    public List<Pago> listarPagos() {
        return pagoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Pago obtenerPago(Long id) {
        return pagoRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));
    }

    @Transactional(readOnly = true)
    public List<Pago> listarPagosPorCronograma(Long cronogramaId) {
        return pagoRepository.findByCronogramaId(cronogramaId);
    }

    @Transactional
    public Pago crearPago(Pago pago) {
        CronogramaPago cronograma = cronogramaPagoRepository.findById(pago.getCronograma().getId())
            .orElseThrow(() -> new IllegalArgumentException("Cronograma no encontrado"));
        pago.setCronograma(cronograma);
        return pagoRepository.save(pago);
    }
}
