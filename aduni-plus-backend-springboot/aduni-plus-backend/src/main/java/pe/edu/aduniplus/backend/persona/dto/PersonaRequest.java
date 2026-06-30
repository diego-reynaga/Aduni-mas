package pe.edu.aduniplus.backend.persona.dto;

import jakarta.validation.constraints.NotBlank;

public record PersonaRequest(
    @NotBlank String tipoDocumento,
    @NotBlank String numeroDocumento,
    @NotBlank String nombres,
    @NotBlank String apellidos,
    String correo,
    String telefono,
    String direccion
) {}
