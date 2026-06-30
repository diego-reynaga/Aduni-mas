package pe.edu.aduniplus.backend.academico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

public record SeccionRequest(
    @NotNull Long cicloId,
    @NotNull Long turnoId,
    @NotBlank String nombre,
    @Min(1) int cupoMaximo
) {}
