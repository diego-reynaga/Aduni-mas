package pe.edu.aduniplus.backend.usuario.dto;

public record UsuarioResponse(
    Long id,
    String username,
    Boolean activo,
    Long personaId,
    Long rolId,
    String rolNombre
) {}
