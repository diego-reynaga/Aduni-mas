package pe.edu.aduniplus.backend.persona;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.persona.dto.PerfilApoderadoRequest;

import java.util.List;

@RestController
@RequestMapping("/apoderados")
@RequiredArgsConstructor
public class ApoderadoController {

    private final ApoderadoService apoderadoService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<Apoderado>> listarApoderados() {
        return ResponseEntity.ok(apoderadoService.listarApoderados());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Apoderado> obtenerApoderado(@PathVariable Long id) {
        return ResponseEntity.ok(apoderadoService.obtenerApoderado(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Apoderado> actualizarApoderado(@PathVariable Long id, @Valid @RequestBody PerfilApoderadoRequest request) {
        return ResponseEntity.ok(apoderadoService.actualizarApoderado(id, request));
    }

    @GetMapping("/{id}/estudiantes")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<Estudiante>> listarEstudiantesDeApoderado(@PathVariable Long id) {
        return ResponseEntity.ok(apoderadoService.listarEstudiantes(id));
    }
}
