package pe.edu.aduniplus.backend.usuario.dto;

import java.util.List;

public record UsuarioResponse(
    Long id,
    String username,
    Boolean activo,
    Long personaId,
    List<String> roles
) {}
