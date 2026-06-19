package pe.edu.aduniplus.backend.usuario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UsuarioRequest(
    @NotBlank(message = "El nombre de usuario es obligatorio")
    String username,

    String password,

    @NotNull(message = "El ID de la persona es obligatorio")
    Long personaId,

    List<String> roles
) {}
