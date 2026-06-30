package pe.edu.aduniplus.backend.academico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public record TurnoRequest(
    @NotBlank String nombre,
    @NotNull LocalTime horaInicio,
    @NotNull LocalTime horaFin
) {
    public TurnoRequest {
        if (horaInicio != null && horaFin != null && !horaFin.isAfter(horaInicio)) {
            throw new IllegalArgumentException("hora_fin debe ser posterior a hora_inicio");
        }
    }
}
