package pe.edu.aduniplus.backend.persona;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.persona.dto.EstudianteBuscarResponse;
import pe.edu.aduniplus.backend.persona.dto.EstudianteExpedienteResponse;
import pe.edu.aduniplus.backend.persona.dto.EstudiantePaginadoResponse;
import pe.edu.aduniplus.backend.persona.dto.PerfilEstudianteRequest;

import java.util.List;

@RestController
@RequestMapping("/estudiantes")
@RequiredArgsConstructor
public class EstudianteController {

    private final EstudianteService estudianteService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('DIRECCION_ACADEMICA')")
    public ResponseEntity<List<Estudiante>> listarEstudiantes() {
        return ResponseEntity.ok(estudianteService.listarEstudiantes());
    }

    @GetMapping("/paginado")
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('DIRECCION_ACADEMICA') or hasRole('SECRETARIA')")
    public ResponseEntity<EstudiantePaginadoResponse> buscarPaginado(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanio) {
        return ResponseEntity.ok(estudianteService.buscarPaginado(q, estado, pagina, tamanio));
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('DIRECCION_ACADEMICA') or hasRole('SECRETARIA')")
    public ResponseEntity<List<EstudianteBuscarResponse>> buscarActivos(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limite) {
        return ResponseEntity.ok(estudianteService.buscarActivos(q, limite));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('DIRECCION_ACADEMICA')")
    public ResponseEntity<Estudiante> obtenerEstudiante(@PathVariable Long id) {
        return ResponseEntity.ok(estudianteService.obtenerEstudiante(id));
    }

    @GetMapping("/{id}/expediente")
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('DIRECCION_ACADEMICA') or hasRole('SECRETARIA')")
    public ResponseEntity<EstudianteExpedienteResponse> obtenerExpediente(@PathVariable Long id) {
        return ResponseEntity.ok(estudianteService.obtenerExpediente(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Estudiante> actualizarEstudiante(@PathVariable Long id, @Valid @RequestBody PerfilEstudianteRequest request) {
        return ResponseEntity.ok(estudianteService.actualizarEstudiante(id, request));
    }

    @PatchMapping("/{id}/desactivar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Estudiante> desactivarEstudiante(@PathVariable Long id) {
        return ResponseEntity.ok(estudianteService.desactivarEstudiante(id));
    }
}
