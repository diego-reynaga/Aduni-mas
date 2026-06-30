package pe.edu.aduniplus.backend.persona.dto;

import java.util.Map;

public record PerfilResponse(
    String tipo,
    Map<String, Object> datos
) {}
