package pe.edu.aduniplus.backend.pago;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PagoDtos {

    public record ConceptoCobroRequest(
            @NotBlank String codigo,
            @NotBlank String nombre,
            String descripcion,
            Boolean activo
    ) {}

    public record ConceptoCobroResponse(
            Long id,
            String codigo,
            String nombre,
            String descripcion,
            Boolean activo
    ) {}

    public record CuotaProgramadaRequest(
            @NotNull int numeroCuota,
            @NotNull Long conceptoCobroId,
            @NotNull LocalDate fechaVencimiento,
            @NotNull BigDecimal montoProgramado
    ) {}

    public record CronogramaRequest(
            @NotNull Long estudianteId,
            Long matriculaId,
            Long gestionAcademicaId,
            @NotEmpty List<CuotaProgramadaRequest> cuotas,
            String observacion
    ) {}

    public record CronogramaResponse(
            Long id,
            Long estudianteId,
            String estudianteNombre,
            String estudianteCodigo,
            Long matriculaId,
            Long gestionAcademicaId,
            int totalCuotas,
            BigDecimal montoTotal,
            String observacion,
            Boolean activo,
            List<CuotaResponse> cuotas
    ) {}

    public record CuotaResponse(
            Long id,
            int numeroCuota,
            Long conceptoCobroId,
            String conceptoCobroNombre,
            LocalDate fechaVencimiento,
            BigDecimal montoProgramado,
            BigDecimal saldoPendiente,
            String estado
    ) {}

    public record PagoRequest(
            Long cuotaId,
            Long cronogramaId,
            @NotNull Long estudianteId,
            @NotNull BigDecimal montoPagado,
            @NotNull LocalDate fechaPago,
            @NotNull MetodoPago metodoPago,
            String numeroComprobante,
            String observacion
    ) {}

    public record PagoResponse(
            Long id,
            Long cuotaId,
            Integer numeroCuota,
            Long cronogramaId,
            Long estudianteId,
            String estudianteNombre,
            String estudianteCodigo,
            BigDecimal montoPagado,
            LocalDate fechaPago,
            String metodoPago,
            String numeroComprobante,
            String observacion,
            Boolean anulado,
            LocalDateTime fechaAnulacion,
            String motivoAnulacion,
            Boolean reciboGenerado,
            String numeroRecibo
    ) {}

    public record AnularPagoRequest(
            @NotBlank String motivo
    ) {}

    public record ReciboResponse(
            Long id,
            Long pagoId,
            String numeroRecibo,
            BigDecimal monto,
            LocalDateTime fechaEmision,
            String rutaPdf
    ) {}
}
