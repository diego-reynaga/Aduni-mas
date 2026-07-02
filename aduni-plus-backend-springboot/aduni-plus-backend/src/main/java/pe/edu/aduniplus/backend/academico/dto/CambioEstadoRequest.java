package pe.edu.aduniplus.backend.academico.dto;

import jakarta.validation.constraints.NotBlank;

public record CambioEstadoRequest(
    @NotBlank String estado
) {}
