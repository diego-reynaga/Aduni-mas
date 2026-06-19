package pe.edu.aduniplus.backend.usuario.dto;

import java.time.LocalDateTime;

public record RolResponse(
    Long id,
    String nombre,
    LocalDateTime creadoEn,
    LocalDateTime actualizadoEn
) {}
