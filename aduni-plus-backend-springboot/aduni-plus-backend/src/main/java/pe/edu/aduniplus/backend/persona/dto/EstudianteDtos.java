package pe.edu.aduniplus.backend.persona.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class EstudianteDtos {
    public record EstudianteResponse(
        Long id,
        String nombres,
        String apellidos,
        String documentoIdentidad,
        LocalDate fechaNacimiento,
        String direccion,
        String telefono,
        String correo,
        String codigoEstudiante,
        Boolean activo,
        Long personaId
    ) {}

    public record EstudianteRequest(
        @NotBlank(message = "Los nombres son obligatorios")
        String nombres,
        @NotBlank(message = "Los apellidos son obligatorios")
        String apellidos,
        @NotBlank(message = "El documento es obligatorio")
        String documentoIdentidad,
        LocalDate fechaNacimiento,
        String direccion,
        String telefono,
        String correo,
        Long personaId,
        Boolean activo
    ) {}
}
