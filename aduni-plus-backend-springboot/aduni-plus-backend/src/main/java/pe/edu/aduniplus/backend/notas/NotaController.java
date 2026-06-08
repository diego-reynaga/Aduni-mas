package pe.edu.aduniplus.backend.notas;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/notas")
@RequiredArgsConstructor
public class NotaController {
    private final NotaRepository notaRepository;

    @GetMapping
    public ResponseEntity<List<String>> listar() {
        List<String> payload = notaRepository.findAll().stream()
            .map((nota) -> nota.getEstudiante().getCodigoEstudiante()
                + " | "
                + nota.getEvaluacion().getTipo().name()
                + " | "
                + nota.getValor())
            .toList();
        return ResponseEntity.ok(payload);
    }
}
