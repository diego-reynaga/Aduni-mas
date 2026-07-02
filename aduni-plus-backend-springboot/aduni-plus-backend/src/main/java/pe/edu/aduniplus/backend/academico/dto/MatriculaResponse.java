package pe.edu.aduniplus.backend.academico.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MatriculaResponse(Long id, String codigoMatricula, Long estudianteId, String estudianteNombre,
    Long seccionId, String seccionNombre, LocalDate fechaMatricula,
    BigDecimal montoTotalPactado, String estado) {}
