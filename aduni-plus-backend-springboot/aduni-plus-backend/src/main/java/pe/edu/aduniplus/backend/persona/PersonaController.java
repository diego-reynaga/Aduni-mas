package pe.edu.aduniplus.backend.persona;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.persona.dto.PersonaRequest;
import pe.edu.aduniplus.backend.persona.dto.PersonaResponse;
import pe.edu.aduniplus.backend.persona.dto.PersonaConPerfilesRequest;
import pe.edu.aduniplus.backend.persona.dto.PersonaConPerfilesResponse;
import java.util.List;

@RestController
@RequestMapping("/personas")
@RequiredArgsConstructor
public class PersonaController {

    private final PersonaService personaService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<PersonaResponse>> listarPersonas() {
        return ResponseEntity.ok(personaService.listarPersonas());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PersonaResponse> obtenerPersona(@PathVariable Long id) {
        return ResponseEntity.ok(personaService.obtenerPersona(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PersonaResponse> crearPersona(@Valid @RequestBody PersonaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(personaService.crearPersona(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PersonaResponse> actualizarPersona(@PathVariable Long id, @Valid @RequestBody PersonaRequest request) {
        return ResponseEntity.ok(personaService.actualizarPersona(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> eliminarPersona(@PathVariable Long id) {
        personaService.eliminarPersona(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/con-perfiles")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PersonaConPerfilesResponse> crearPersonaConPerfiles(
            @Valid @RequestBody PersonaConPerfilesRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(personaService.crearPersonaConPerfiles(request));
    }

    @GetMapping("/{id}/con-perfiles")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PersonaConPerfilesResponse> obtenerPersonaConPerfiles(@PathVariable Long id) {
        return ResponseEntity.ok(personaService.obtenerPersonaConPerfiles(id));
    }
}
