package pe.edu.aduniplus.backend.persona.dto;

import jakarta.validation.constraints.NotBlank;

public record PerfilApoderadoRequest(
    @NotBlank String relacionParentesco
) {}
