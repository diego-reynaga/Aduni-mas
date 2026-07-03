package pe.edu.aduniplus.backend.persona.dto;

import java.time.LocalDateTime;

public record PersonaResponse(
    Long id,
    String nombres,
    String apellidos,
    String documentoIdentidad,
    String fechaNacimiento,
    String direccion,
    String telefono,
    String correo,
    String tipoPersona,
    // Subclases
    String codigo,
    String cargo,
    String especialidad,
    String areaAcademica,
    String ocupacion,

    LocalDateTime creadoEn,
    LocalDateTime actualizadoEn
) {}
