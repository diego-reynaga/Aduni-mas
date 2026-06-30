package pe.edu.aduniplus.backend.persona.dto;

import java.util.Set;

public record PersonaConPerfilesResponse(
    Long id,
    String tipoDocumento,
    String numeroDocumento,
    String nombres,
    String apellidos,
    String correo,
    String telefono,
    String direccion,
    Set<PerfilResponse> perfiles
) {}
