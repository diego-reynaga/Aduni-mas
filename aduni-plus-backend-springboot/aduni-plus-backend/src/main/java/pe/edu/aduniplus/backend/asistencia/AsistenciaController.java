package pe.edu.aduniplus.backend.asistencia;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/asistencias")
@RequiredArgsConstructor
public class AsistenciaController {

    private final AsistenciaEstudianteRepository asistenciaRepository;

    @GetMapping("/seccion/{seccionId}/fecha/{fecha}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DOCENTE')")
    public ResponseEntity<List<AsistenciaEstudiante>> listarPorSeccionYFecha(
            @PathVariable Long seccionId, @PathVariable String fecha) {
        return ResponseEntity.ok(
            asistenciaRepository.findBySeccionIdAndFecha(seccionId, LocalDate.parse(fecha)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DOCENTE')")
    public ResponseEntity<AsistenciaEstudiante> crear(@RequestBody AsistenciaEstudiante asistencia) {
        return ResponseEntity.status(HttpStatus.CREATED).body(asistenciaRepository.save(asistencia));
    }
}
