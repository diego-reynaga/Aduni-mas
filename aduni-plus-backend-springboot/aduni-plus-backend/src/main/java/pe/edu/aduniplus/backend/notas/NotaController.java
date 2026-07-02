package pe.edu.aduniplus.backend.notas;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/notas")
@RequiredArgsConstructor
public class NotaController {
    private final NotaRepository notaRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DOCENTE')")
    public ResponseEntity<List<NotaResponseDTO>> listar() {
        List<NotaResponseDTO> payload = notaRepository.findAll().stream()
            .map((nota) -> new NotaResponseDTO(
                nota.getId(),
                nota.getEstudiante().getId(),
                nota.getEstudiante().getCodigoEstudiante(),
                nota.getEvaluacion().getId(),
                nota.getEvaluacion().getTipo().name(),
                nota.getValor(),
                nota.getObservacion()
            ))
            .toList();
        return ResponseEntity.ok(payload);
    }

    public record NotaResponseDTO(
        Long id,
        Long estudianteId,
        String codigoEstudiante,
        Long evaluacionId,
        String tipoEvaluacion,
        java.math.BigDecimal valor,
        String observacion
    ) {}
}
