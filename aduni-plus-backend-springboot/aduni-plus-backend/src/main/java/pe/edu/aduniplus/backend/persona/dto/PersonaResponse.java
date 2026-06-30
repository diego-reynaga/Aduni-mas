package pe.edu.aduniplus.backend.persona.dto;

public record PersonaResponse(
    Long id,
    String tipoDocumento,
    String numeroDocumento,
    String nombres,
    String apellidos,
    String correo,
    String telefono,
    String direccion
) {}
