package pe.edu.aduniplus.backend.persona.dto;

public record PerfilEstudianteRequest(
    String codigoEstudiante,
    String estadoAcademico,
    Long idApoderado
) {}
