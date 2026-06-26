package pe.edu.aduniplus.backend.persona.dto;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class PadreFamiliaDtos {
    public record PadreFamiliaRequest(
        @NotBlank String nombres,
        @NotBlank String apellidos,
        @NotBlank @Pattern(regexp = "^[0-9]{8}$") String documentoIdentidad,
        LocalDate fechaNacimiento,
        String direccion,
        String telefono,
        @Email String correo,
        String ocupacion,
        Boolean activo
    ) {}
    
    public record PadreFamiliaResponse(
        Long id, String nombres, String apellidos,
        String documentoIdentidad, LocalDate fechaNacimiento,
        String direccion, String telefono, String correo,
        String ocupacion, Boolean activo
    ) {}
}
