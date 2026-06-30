package pe.edu.aduniplus.backend.academico;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.academico.dto.MatriculaRequest;
import pe.edu.aduniplus.backend.academico.dto.MatriculaResponse;

import java.util.List;

@RestController
@RequestMapping("/matriculas")
@RequiredArgsConstructor
public class MatriculaController {

    private final MatriculaService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA')")
    public ResponseEntity<List<MatriculaResponse>> listarMatriculas() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA')")
    public ResponseEntity<MatriculaResponse> obtenerMatricula(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @GetMapping("/estudiante/{estudianteId}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA', 'ESTUDIANTE')")
    public ResponseEntity<List<MatriculaResponse>> listarPorEstudiante(@PathVariable Long estudianteId) {
        return ResponseEntity.ok(service.listarPorEstudiante(estudianteId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SECRETARIA')")
    public ResponseEntity<MatriculaResponse> crearMatricula(@Valid @RequestBody MatriculaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrar(request));
    }
    
    @PutMapping("/{id}/retirar")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DIRECCION_ACADEMICA')")
    public ResponseEntity<Void> retirarMatricula(@PathVariable Long id) {
        service.retirar(id);
        return ResponseEntity.noContent().build();
    }
}
