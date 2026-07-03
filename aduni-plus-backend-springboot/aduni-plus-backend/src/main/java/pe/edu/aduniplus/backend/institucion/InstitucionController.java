package pe.edu.aduniplus.backend.institucion;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.aduniplus.backend.institucion.InstitucionDtos.*;

import java.util.Map;

@RestController
@RequestMapping("/institucion")
@RequiredArgsConstructor
public class InstitucionController {

    private final InstitucionService institucionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', 'PADRE_FAMILIA')")
    public ResponseEntity<ConfiguracionResponse> getConfiguracion() {
        return ResponseEntity.ok(institucionService.getConfiguracion());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ConfiguracionResponse> actualizarConfiguracion(@Valid @RequestBody ConfiguracionRequest request) {
        return ResponseEntity.ok(institucionService.actualizarConfiguracion(request));
    }

    @PostMapping("/upload-logo")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Map<String, String>> uploadLogo(@RequestParam("file") MultipartFile file) {
        String url = institucionService.uploadLogo(file);
        return ResponseEntity.ok(Map.of("logoUrl", url));
    }
}
