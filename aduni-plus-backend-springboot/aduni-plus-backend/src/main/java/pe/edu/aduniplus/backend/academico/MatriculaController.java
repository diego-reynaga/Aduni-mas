package pe.edu.aduniplus.backend.academico;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.academico.AcademicoDtos.MatriculaRequest;
import pe.edu.aduniplus.backend.academico.AcademicoDtos.MatriculaResponse;

import java.util.List;

@RestController
@RequestMapping("/matriculas")
@RequiredArgsConstructor
public class MatriculaController {

    private final MatriculaService matriculaService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<MatriculaResponse>> listarMatriculas() {
        return ResponseEntity.ok(matriculaService.listarMatriculas());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<?> matricularEstudiante(@Valid @RequestBody MatriculaRequest request) {
        try {
            MatriculaResponse res = matriculaService.matricularEstudiante(request);
            return new ResponseEntity<>(res, HttpStatus.CREATED);
        } catch (AforoExcedidoException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> cambiarEstadoMatricula(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body
    ) {
        try {
            matriculaService.cambiarEstado(id, EstadoMatricula.valueOf(body.get("estado")));
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
