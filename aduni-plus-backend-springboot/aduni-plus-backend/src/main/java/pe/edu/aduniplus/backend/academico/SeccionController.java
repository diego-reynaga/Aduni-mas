package pe.edu.aduniplus.backend.academico;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.academico.dto.SeccionRequest;
import pe.edu.aduniplus.backend.academico.dto.SeccionResponse;

import java.util.List;

@RestController
@RequestMapping("/secciones")
@RequiredArgsConstructor
public class SeccionController {

    private final SeccionService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA')")
    public ResponseEntity<List<SeccionResponse>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA')")
    public ResponseEntity<List<SeccionResponse>> listarDisponibles(
            @RequestParam(required = false) Long cicloId,
            @RequestParam(required = false) Long turnoId) {
        return ResponseEntity.ok(service.listarDisponibles(cicloId, turnoId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA')")
    public ResponseEntity<SeccionResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA')")
    public ResponseEntity<SeccionResponse> crear(@Valid @RequestBody SeccionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA')")
    public ResponseEntity<SeccionResponse> actualizar(@PathVariable Long id, @Valid @RequestBody SeccionRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
