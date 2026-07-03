package pe.edu.aduniplus.backend.academico;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.academico.AcademicoDtos.*;

import java.util.List;

@RestController
@RequestMapping("/academico")
@RequiredArgsConstructor
public class AcademicoController {

    private final AcademicoService academicoService;

    // --- Niveles Educativos ---

    @GetMapping("/niveles")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<NivelEducativoResponse>> listarNiveles() {
        return ResponseEntity.ok(academicoService.listarNiveles());
    }

    @PostMapping("/niveles")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<NivelEducativoResponse> crearNivelEducativo(@Valid @RequestBody NivelEducativoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicoService.crearNivelEducativo(request));
    }

    @PutMapping("/niveles/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<NivelEducativoResponse> actualizarNivelEducativo(@PathVariable Long id, @Valid @RequestBody NivelEducativoRequest request) {
        return ResponseEntity.ok(academicoService.actualizarNivelEducativo(id, request));
    }

    @DeleteMapping("/niveles/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> eliminarNivelEducativo(@PathVariable Long id) {
        academicoService.eliminarNivelEducativo(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/niveles/clonar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> clonarEstructuraAcademica(@Valid @RequestBody ClonarEstructuraRequest request) {
        academicoService.clonarEstructuraAcademica(request);
        return ResponseEntity.ok().build();
    }

    // --- Grados ---

    @GetMapping("/grados")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<GradoResponse>> listarGrados(@RequestParam Long nivelId) {
        return ResponseEntity.ok(academicoService.listarGradosPorNivel(nivelId));
    }

    @PostMapping("/grados")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<GradoResponse> crearGrado(@Valid @RequestBody GradoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicoService.crearGrado(request));
    }

    @PutMapping("/grados/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<GradoResponse> actualizarGrado(@PathVariable Long id, @Valid @RequestBody GradoRequest request) {
        return ResponseEntity.ok(academicoService.actualizarGrado(id, request));
    }

    @DeleteMapping("/grados/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> eliminarGrado(@PathVariable Long id) {
        academicoService.eliminarGrado(id);
        return ResponseEntity.noContent().build();
    }

    // --- Materias ---

    @GetMapping("/materias")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<MateriaResponse>> listarMaterias() {
        return ResponseEntity.ok(academicoService.listarMaterias());
    }

    @PostMapping("/materias")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<MateriaResponse> crearMateria(@Valid @RequestBody MateriaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicoService.crearMateria(request));
    }

    @PutMapping("/materias/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<MateriaResponse> actualizarMateria(@PathVariable Long id, @Valid @RequestBody MateriaRequest request) {
        return ResponseEntity.ok(academicoService.actualizarMateria(id, request));
    }

    @DeleteMapping("/materias/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> eliminarMateria(@PathVariable Long id) {
        academicoService.eliminarMateria(id);
        return ResponseEntity.noContent().build();
    }

    // --- Cursos (Oferta Educativa) ---

    @GetMapping("/cursos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<CursoResponse>> listarCursos(@RequestParam Long gradoId) {
        return ResponseEntity.ok(academicoService.listarCursosPorGrado(gradoId));
    }

    @PostMapping("/cursos/asignacion-masiva")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> asignarCursos(@Valid @RequestBody CursoAsignacionMasivaRequest request) {
        academicoService.asignarCursosAGrado(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cursos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<CursoResponse> crearCurso(@Valid @RequestBody CursoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicoService.crearCurso(request));
    }

    @PutMapping("/cursos/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<CursoResponse> actualizarCurso(@PathVariable Long id, @Valid @RequestBody CursoRequest request) {
        return ResponseEntity.ok(academicoService.actualizarCurso(id, request));
    }

    @DeleteMapping("/cursos/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> removerCurso(@PathVariable Long id) {
        academicoService.removerCurso(id);
        return ResponseEntity.noContent().build();
    }

    // --- Gestiones Academicas ---

    @GetMapping("/gestiones")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<GestionAcademicaResponse>> listarGestiones() {
        return ResponseEntity.ok(academicoService.listarGestiones());
    }

    @PostMapping("/gestiones")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<GestionAcademicaResponse> crearGestion(@Valid @RequestBody GestionAcademicaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicoService.crearGestion(request));
    }

    @PutMapping("/gestiones/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<GestionAcademicaResponse> actualizarGestion(@PathVariable Long id, @Valid @RequestBody GestionAcademicaRequest request) {
        return ResponseEntity.ok(academicoService.actualizarGestion(id, request));
    }

    @DeleteMapping("/gestiones/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> desactivarGestion(@PathVariable Long id) {
        academicoService.desactivarGestion(id);
        return ResponseEntity.noContent().build();
    }

    // --- Periodos Academicos ---

    @GetMapping("/periodos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<PeriodoAcademicoResponse>> listarPeriodos(@RequestParam Long gestionId) {
        return ResponseEntity.ok(academicoService.listarPeriodosPorGestion(gestionId));
    }

    @PostMapping("/periodos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PeriodoAcademicoResponse> crearPeriodo(@Valid @RequestBody PeriodoAcademicoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicoService.crearPeriodo(request));
    }

    @PutMapping("/periodos/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PeriodoAcademicoResponse> actualizarPeriodo(@PathVariable Long id, @Valid @RequestBody PeriodoAcademicoRequest request) {
        return ResponseEntity.ok(academicoService.actualizarPeriodo(id, request));
    }

    @DeleteMapping("/periodos/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> cerrarPeriodo(@PathVariable Long id) {
        academicoService.cerrarPeriodo(id);
        return ResponseEntity.noContent().build();
    }
}
