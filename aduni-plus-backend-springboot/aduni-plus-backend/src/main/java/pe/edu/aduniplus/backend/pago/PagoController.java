package pe.edu.aduniplus.backend.pago;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.security.AuthenticatedUser;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;
    private final ReciboService reciboService;

    // --- Conceptos ---
    @GetMapping("/conceptos")
    public ResponseEntity<List<PagoDtos.ConceptoCobroResponse>> listarConceptos() {
        return ResponseEntity.ok(pagoService.listarConceptos());
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PostMapping("/conceptos")
    public ResponseEntity<PagoDtos.ConceptoCobroResponse> crearConcepto(@Valid @RequestBody PagoDtos.ConceptoCobroRequest req) {
        return ResponseEntity.ok(pagoService.crearConcepto(req));
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PutMapping("/conceptos/{id}")
    public ResponseEntity<PagoDtos.ConceptoCobroResponse> actualizarConcepto(@PathVariable Long id, @Valid @RequestBody PagoDtos.ConceptoCobroRequest req) {
        return ResponseEntity.ok(pagoService.actualizarConcepto(id, req));
    }

    // --- Cronogramas ---
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PostMapping("/cronogramas")
    public ResponseEntity<PagoDtos.CronogramaResponse> crearCronograma(
            @Valid @RequestBody PagoDtos.CronogramaRequest req,
            @AuthenticationPrincipal AuthenticatedUser userDetails) {
        return ResponseEntity.ok(pagoService.crearCronograma(req, userDetails.userId()));
    }

    @GetMapping("/cronogramas")
    public ResponseEntity<List<PagoDtos.CronogramaResponse>> listarCronogramas(
            @RequestParam(required = false) Long gestionId,
            @RequestParam(required = false) Long estudianteId) {
        return ResponseEntity.ok(pagoService.listarCronogramas(gestionId, estudianteId));
    }

    @GetMapping("/cronogramas/{id}")
    public ResponseEntity<PagoDtos.CronogramaResponse> obtenerCronograma(@PathVariable Long id) {
        return ResponseEntity.ok(pagoService.obtenerCronograma(id));
    }

    @GetMapping("/cronogramas/estudiante/{estudianteId}")
    public ResponseEntity<List<PagoDtos.CronogramaResponse>> listarCronogramasPorEstudiante(@PathVariable Long estudianteId) {
        return ResponseEntity.ok(pagoService.listarCronogramasPorEstudiante(estudianteId));
    }

    @GetMapping("/cronogramas/{id}/cuotas")
    public ResponseEntity<List<PagoDtos.CuotaResponse>> listarCuotasPorCronograma(@PathVariable Long id) {
        return ResponseEntity.ok(pagoService.listarCuotasPorCronograma(id));
    }

    // --- Pagos ---
    @PostMapping
    public ResponseEntity<PagoDtos.PagoResponse> registrarPago(
            @Valid @RequestBody PagoDtos.PagoRequest req,
            @AuthenticationPrincipal AuthenticatedUser userDetails) {
        return ResponseEntity.ok(pagoService.registrarPago(req, userDetails.userId()));
    }

    @GetMapping
    public ResponseEntity<List<PagoDtos.PagoResponse>> listarPagos(
            @RequestParam(required = false) Long estudianteId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Boolean anulado) {
        return ResponseEntity.ok(pagoService.listarPagos(estudianteId, desde, hasta, anulado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PagoDtos.PagoResponse> obtenerPago(@PathVariable Long id) {
        return ResponseEntity.ok(pagoService.obtenerPago(id));
    }

    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @PostMapping("/{id}/anular")
    public ResponseEntity<PagoDtos.PagoResponse> anularPago(
            @PathVariable Long id,
            @Valid @RequestBody PagoDtos.AnularPagoRequest req) {
        return ResponseEntity.ok(pagoService.anularPago(id, req.motivo()));
    }

    // --- Recibos ---
    @PostMapping("/{id}/recibo")
    public ResponseEntity<PagoDtos.ReciboResponse> generarRecibo(@PathVariable Long id) throws Exception {
        return ResponseEntity.ok(reciboService.generarRecibo(id));
    }

    @GetMapping("/recibo/{reciboId}/pdf")
    public ResponseEntity<byte[]> obtenerPdf(@PathVariable Long reciboId) throws Exception {
        byte[] pdfBytes = reciboService.obtenerPdf(reciboId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "recibo_" + reciboId + ".pdf");
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
