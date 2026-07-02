package pe.edu.aduniplus.backend.academico;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.academico.AsignacionDocenteDtos.AsignacionDocenteRequest;
import pe.edu.aduniplus.backend.academico.AsignacionDocenteDtos.AsignacionDocenteResponse;

import java.util.List;

@RestController
@RequestMapping("/academico/asignaciones-docentes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AsignacionDocenteController {
    private final AsignacionDocenteService service;

    @GetMapping
    public List<AsignacionDocenteResponse> listar() {
        return service.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AsignacionDocenteResponse crear(@Valid @RequestBody AsignacionDocenteRequest request) {
        return service.crear(request);
    }

    @PutMapping("/{id}")
    public AsignacionDocenteResponse actualizar(@PathVariable Long id, @Valid @RequestBody AsignacionDocenteRequest request) {
        return service.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cerrar(@PathVariable Long id) {
        service.cerrar(id);
    }
}
