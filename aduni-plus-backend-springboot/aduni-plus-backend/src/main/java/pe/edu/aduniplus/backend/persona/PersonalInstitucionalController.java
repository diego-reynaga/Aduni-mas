package pe.edu.aduniplus.backend.persona;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.edu.aduniplus.backend.persona.dto.PerfilPersonalRequest;

import java.util.List;

@RestController
@RequestMapping("/personal-institucional")
@RequiredArgsConstructor
public class PersonalInstitucionalController {

    private final PersonalInstitucionalService personalService;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<PersonalInstitucional>> listarPersonal() {
        return ResponseEntity.ok(personalService.listarPersonal());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PersonalInstitucional> obtenerPersonal(@PathVariable Long id) {
        return ResponseEntity.ok(personalService.obtenerPersonal(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PersonalInstitucional> actualizarPersonal(@PathVariable Long id, @Valid @RequestBody PerfilPersonalRequest request) {
        return ResponseEntity.ok(personalService.actualizarPersonal(id, request));
    }
}
