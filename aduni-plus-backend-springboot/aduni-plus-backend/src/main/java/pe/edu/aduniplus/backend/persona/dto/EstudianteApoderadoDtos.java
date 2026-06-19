package pe.edu.aduniplus.backend.persona.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class EstudianteApoderadoDtos {

    public record EstudianteApoderadoRequest(
        @NotNull(message = "El ID del padre/apoderado es obligatorio")
        Long padreFamiliaId,
        @NotBlank(message = "El parentesco es obligatorio")
        String parentesco,
        @NotNull(message = "Debe especificar si es apoderado principal")
        Boolean principal
    ) {}

    public record EstudianteApoderadoResponse(
        Long id,
        Long estudianteId,
        Long padreFamiliaId,
        String padreNombreCompleto,
        String padreDocumento,
        String padreTelefono,
        String padreCorreo,
        String parentesco,
        Boolean principal
    ) {}
}
