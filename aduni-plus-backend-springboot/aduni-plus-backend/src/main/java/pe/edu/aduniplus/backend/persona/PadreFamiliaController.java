package pe.edu.aduniplus.backend.persona;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.persona.dto.PadreFamiliaDtos.*;

import java.util.List;

@RestController
@RequestMapping("/apoderados")
@RequiredArgsConstructor
public class PadreFamiliaController {

    private final PadreFamiliaService padreFamiliaService;

    @GetMapping("/search")
    public ResponseEntity<List<PadreFamiliaResponse>> buscarPorFiltros(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(padreFamiliaService.listar(search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PadreFamiliaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(padreFamiliaService.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PadreFamiliaResponse> crear(@Valid @RequestBody PadreFamiliaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(padreFamiliaService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PadreFamiliaResponse> actualizar(@PathVariable Long id, @Valid @RequestBody PadreFamiliaRequest request) {
        return ResponseEntity.ok(padreFamiliaService.actualizar(id, request));
    }
}
