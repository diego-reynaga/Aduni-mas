package pe.edu.aduniplus.backend.academico.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record MatriculaRequest(
    @NotNull Long estudianteId,
    @NotNull Long seccionId,
    @NotNull BigDecimal montoTotalPactado
) {}
