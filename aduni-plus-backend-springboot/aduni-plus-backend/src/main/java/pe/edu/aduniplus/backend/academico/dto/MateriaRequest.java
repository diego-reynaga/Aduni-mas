package pe.edu.aduniplus.backend.academico.dto;

import jakarta.validation.constraints.NotBlank;

public record MateriaRequest(
    @NotBlank String nombre,
    @NotBlank String area
) {}
