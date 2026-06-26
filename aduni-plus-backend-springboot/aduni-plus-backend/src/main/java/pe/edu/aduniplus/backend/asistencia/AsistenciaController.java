package pe.edu.aduniplus.backend.asistencia;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.asistencia.AsistenciaDtos.*;
import pe.edu.aduniplus.backend.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/asistencias")
@RequiredArgsConstructor
public class AsistenciaController {

    private final AsistenciaService service;

    // --- Estudiantes por curso ---

    @GetMapping("/curso/{asignacionDocenteId}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DOCENTE')")
    public ResponseEntity<List<AsistenciaResponse>> listarPorCursoYFecha(
            @PathVariable Long asignacionDocenteId,
            @RequestParam(required = false) LocalDate fecha) {
        LocalDate dia = fecha != null ? fecha : LocalDate.now();
        return ResponseEntity.ok(service.listarPorCursoYFecha(asignacionDocenteId, dia));
    }

    @PostMapping("/curso/batch")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DOCENTE')")
    public ResponseEntity<List<AsistenciaResponse>> guardarBatch(
            @Valid @RequestBody AsistenciaBatchRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.guardarBatch(request, user.userId()));
    }

    // --- Docentes ---

    @GetMapping("/docentes")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<AsistenciaResponse>> listarAsistenciaDocentes(
            @RequestParam(required = false) LocalDate fecha) {
        LocalDate dia = fecha != null ? fecha : LocalDate.now();
        return ResponseEntity.ok(service.listarAsistenciaDocentes(dia));
    }

    @PostMapping("/docentes/batch")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<AsistenciaResponse>> guardarAsistenciaDocentes(
            @Valid @RequestBody AsistenciaDocenteBatchRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.guardarAsistenciaDocentes(request, user.userId()));
    }

    // --- Reportes ---

    @GetMapping("/reporte/curso/{asignacionDocenteId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<AsistenciaReporteRow>> reportePorCurso(
            @PathVariable Long asignacionDocenteId,
            @RequestParam LocalDate desde,
            @RequestParam LocalDate hasta) {
        return ResponseEntity.ok(service.reportePorCurso(asignacionDocenteId, desde, hasta));
    }

    @GetMapping("/estudiante/{estudianteId}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'ESTUDIANTE', 'PADRE_FAMILIA')")
    public ResponseEntity<List<AsistenciaResponse>> historialEstudiante(
            @PathVariable Long estudianteId,
            @RequestParam(required = false) Long asignacionDocenteId,
            @RequestParam(required = false) LocalDate desde,
            @RequestParam(required = false) LocalDate hasta) {
        LocalDate inicio = desde != null ? desde : LocalDate.now().minusMonths(1);
        LocalDate fin = hasta != null ? hasta : LocalDate.now();
        return ResponseEntity.ok(service.historialEstudiante(estudianteId, asignacionDocenteId, inicio, fin));
    }
}
