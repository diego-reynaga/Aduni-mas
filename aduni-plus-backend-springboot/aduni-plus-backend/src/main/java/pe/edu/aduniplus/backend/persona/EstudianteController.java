package pe.edu.aduniplus.backend.persona;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
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

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('DIRECCION_ACADEMICA')")
    public ResponseEntity<Estudiante> obtenerEstudiante(@PathVariable Long id) {
        return ResponseEntity.ok(estudianteService.obtenerEstudiante(id));
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
