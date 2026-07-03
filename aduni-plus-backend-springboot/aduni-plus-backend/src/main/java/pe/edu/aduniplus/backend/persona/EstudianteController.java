package pe.edu.aduniplus.backend.persona;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.persona.dto.EstudianteDtos.EstudianteRequest;
import pe.edu.aduniplus.backend.persona.dto.EstudianteDtos.EstudianteResponse;

import java.util.List;

@RestController
@RequestMapping("/estudiantes")
@RequiredArgsConstructor
public class EstudianteController {

    private final EstudianteService estudianteService;

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<EstudianteResponse>> buscarEstudiantes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean activo) {
        return ResponseEntity.ok(estudianteService.buscarEstudiantes(search, activo));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EstudianteResponse> crearEstudiante(@Valid @RequestBody EstudianteRequest request) {
        return new ResponseEntity<>(estudianteService.crearEstudiante(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<EstudianteResponse> actualizarEstudiante(
            @PathVariable Long id,
            @Valid @RequestBody EstudianteRequest request) {
        return ResponseEntity.ok(estudianteService.actualizarEstudiante(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> desactivarEstudiante(@PathVariable Long id) {
        estudianteService.desactivarEstudiante(id);
        return ResponseEntity.noContent().build();
    }
}
