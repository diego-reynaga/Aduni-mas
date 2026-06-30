package pe.edu.aduniplus.backend.auditoria.dto;

import java.time.LocalDateTime;

public record AuditoriaResponse(
    Long id,
    String accion,
    String tablaAfectada,
    String usuarioResponsable,
    String descripcionCambio,
    Long idRegistroAfectado,
    String ipOrigen,
    LocalDateTime fechaHora
) {}
