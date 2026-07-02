package pe.edu.aduniplus.backend.persona.dto;

public record EstudianteBuscarResponse(
    Long id,
    String codigoEstudiante,
    String nombres,
    String apellidos,
    String tipoDocumento,
    String numeroDocumento,
    String estadoAcademico
) {}
