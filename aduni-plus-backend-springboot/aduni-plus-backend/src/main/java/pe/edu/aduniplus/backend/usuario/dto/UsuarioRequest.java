package pe.edu.aduniplus.backend.usuario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UsuarioRequest(
    @NotBlank String username,
    String password,
    @NotNull Long personaId,
    @NotNull Long rolId
) {}
