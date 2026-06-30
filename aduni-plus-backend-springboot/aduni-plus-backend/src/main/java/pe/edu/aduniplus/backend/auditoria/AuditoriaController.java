package pe.edu.aduniplus.backend.auditoria;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'DIRECCION_ADMINISTRATIVA')")
    public Page<LogAuditoria> listarLogs(
            @RequestParam(required = false) String usuario,
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) String tabla,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return auditoriaService.listarConFiltros(usuario, accion, tabla, pageable);
    }

    @GetMapping("/ultimos")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'DIRECCION_ADMINISTRATIVA')")
    public java.util.List<LogAuditoria> listarUltimosLogs() {
        return auditoriaService.obtenerUltimosLogs();
    }

    @ExceptionHandler(Exception.class)
    public org.springframework.http.ResponseEntity<java.util.Map<String, String>> handleExceptions(Exception ex) {
        return org.springframework.http.ResponseEntity.status(500).body(java.util.Map.of(
            "message", "Error interno: " + ex.getMessage() + " | Clase: " + ex.getClass().getSimpleName()
        ));
    }
}
