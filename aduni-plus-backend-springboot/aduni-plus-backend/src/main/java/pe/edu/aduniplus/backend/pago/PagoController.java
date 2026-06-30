package pe.edu.aduniplus.backend.pago;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<Pago>> listarPagos() {
        return ResponseEntity.ok(pagoService.listarPagos());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Pago> obtenerPago(@PathVariable Long id) {
        return ResponseEntity.ok(pagoService.obtenerPago(id));
    }

    @GetMapping("/cronograma/{cronogramaId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<Pago>> listarPorCronograma(@PathVariable Long cronogramaId) {
        return ResponseEntity.ok(pagoService.listarPagosPorCronograma(cronogramaId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Pago> crearPago(@RequestBody Pago pago) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.crearPago(pago));
    }
}
