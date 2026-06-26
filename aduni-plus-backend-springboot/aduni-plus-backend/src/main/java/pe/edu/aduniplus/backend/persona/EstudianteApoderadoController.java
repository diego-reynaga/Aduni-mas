package pe.edu.aduniplus.backend.persona;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.persona.dto.EstudianteApoderadoDtos.EstudianteApoderadoRequest;
import pe.edu.aduniplus.backend.persona.dto.EstudianteApoderadoDtos.EstudianteApoderadoResponse;

import java.util.List;

@RestController
@RequestMapping("/estudiantes/{estudianteId}/apoderados")
@RequiredArgsConstructor
public class EstudianteApoderadoController {

    private final EstudianteApoderadoService estudianteApoderadoService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('DOCENTE')")
    public ResponseEntity<List<EstudianteApoderadoResponse>> listarApoderados(@PathVariable Long estudianteId) {
        return ResponseEntity.ok(estudianteApoderadoService.listarApoderadosPorEstudiante(estudianteId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EstudianteApoderadoResponse> asignarApoderado(
            @PathVariable Long estudianteId,
            @Valid @RequestBody EstudianteApoderadoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estudianteApoderadoService.asignarApoderado(estudianteId, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EstudianteApoderadoResponse> actualizarApoderado(
            @PathVariable Long estudianteId,
            @PathVariable Long id,
            @Valid @RequestBody EstudianteApoderadoRequest request) {
        return ResponseEntity.ok(estudianteApoderadoService.actualizarApoderado(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> removerApoderado(
            @PathVariable Long estudianteId,
            @PathVariable Long id) {
        estudianteApoderadoService.removerApoderado(id);
        return ResponseEntity.noContent().build();
    }
}
