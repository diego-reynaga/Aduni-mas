package pe.edu.aduniplus.backend.persona.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record PerfilPersonalRequest(
    @NotBlank String cargo,
    @NotNull LocalDate fechaIngreso
) {}
