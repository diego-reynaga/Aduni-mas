package pe.edu.aduniplus.backend.persona.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import pe.edu.aduniplus.backend.persona.PerfilPersona;

import java.util.Set;

public record PersonaConPerfilesRequest(
    @NotBlank String tipoDocumento,
    @NotBlank String numeroDocumento,
    @NotBlank String nombres,
    @NotBlank String apellidos,
    String correo,
    String telefono,
    String direccion,
    @NotEmpty Set<PerfilPersona> perfiles,
    @Valid PerfilEstudianteRequest estudiante,
    @Valid PerfilApoderadoRequest apoderado,
    @Valid PerfilPersonalRequest personalInstitucional
) {}
