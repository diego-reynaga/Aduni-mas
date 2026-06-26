package pe.edu.aduniplus.backend.academico;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.academico.AcademicoDtos.*;
import java.util.List;

@RestController
@RequestMapping("/api/academico/asignaciones")
@RequiredArgsConstructor
public class AsignacionDocenteController {

    private final AsignacionDocenteService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<AsignacionDocenteResponse>> listar(
            @RequestParam(required = false) Long periodoId,
            @RequestParam(required = false) Long docenteId) {
        return ResponseEntity.ok(service.listar(periodoId, docenteId));
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<CursoDisponibleResponse>> disponibles(
            @RequestParam Long periodoId) {
        return ResponseEntity.ok(service.listarCursosDisponibles(periodoId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<AsignacionDocenteResponse> asignar(
            @Valid @RequestBody AsignacionDocenteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.asignar(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
