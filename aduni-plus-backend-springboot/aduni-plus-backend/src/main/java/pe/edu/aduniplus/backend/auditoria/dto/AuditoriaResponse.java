package pe.edu.aduniplus.backend.auditoria.dto;

import java.time.LocalDateTime;

public record AuditoriaResponse(
    Long id,
    LocalDateTime creadoEn,
    String accion,
    String entidad,
    Long entidadId,
    String usuarioResponsable,
    String detalle
) {}
