package pe.edu.aduniplus.backend.persona.dto;

import jakarta.validation.constraints.NotBlank;

public record PersonaRequest(
    @NotBlank(message = "Los nombres son obligatorios")
    String nombres,

    @NotBlank(message = "Los apellidos son obligatorios")
    String apellidos,

    @NotBlank(message = "El documento de identidad es obligatorio")
    String documentoIdentidad,

    String fechaNacimiento,
    String direccion,
    String telefono,
    String correo,

    @NotBlank(message = "El tipo de persona es obligatorio")
    String tipoPersona,

    // Campos específicos para subclases
    String codigo,
    String cargo,
    String especialidad,
    String areaAcademica,
    String ocupacion
) {}
