package pe.edu.aduniplus.backend.academico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CicloRequest(
    @NotBlank String nombre,
    @NotNull LocalDate fechaInicio,
    @NotNull LocalDate fechaFin
) {
    public CicloRequest {
        if (fechaInicio != null && fechaFin != null && fechaFin.isBefore(fechaInicio)) {
            throw new IllegalArgumentException("fecha_fin debe ser posterior a fecha_inicio");
        }
    }
}
