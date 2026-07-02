package pe.edu.aduniplus.backend.academico.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record MatriculaRequest(
    @NotNull Long estudianteId,
    @NotNull Long seccionId,
    @NotNull BigDecimal montoTotalPactado,
    LocalDate fechaMatricula
) {
    public MatriculaRequest {
        if (fechaMatricula == null) fechaMatricula = LocalDate.now();
    }

    public MatriculaRequest(Long estudianteId, Long seccionId, BigDecimal montoTotalPactado) {
        this(estudianteId, seccionId, montoTotalPactado, LocalDate.now());
    }
}
