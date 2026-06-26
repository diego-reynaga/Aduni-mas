package pe.edu.aduniplus.backend.institucion;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class InstitucionDtos {

    public record ConfiguracionResponse(
        Long id,
        String codigo,
        String nombre,
        String logoUrl,
        String direccion,
        String telefono,
        String correoInstitucional,
        String ruc,
        String sitioWeb
    ) {}

    public record ConfiguracionRequest(
        @NotBlank(message = "El nombre de la institución es obligatorio")
        String nombre,
        String logoUrl,
        String direccion,
        String telefono,
        @Email(message = "El formato del correo es inválido")
        String correoInstitucional,
        @Pattern(regexp = "^[0-9]{11}$", message = "El RUC debe tener exactamente 11 dígitos numéricos")
        String ruc,
        String sitioWeb
    ) {}
}
