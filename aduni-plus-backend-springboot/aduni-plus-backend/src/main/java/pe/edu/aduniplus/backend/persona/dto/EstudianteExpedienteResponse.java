package pe.edu.aduniplus.backend.persona.dto;

import pe.edu.aduniplus.backend.academico.dto.MatriculaResponse;
import java.util.List;

public record EstudianteExpedienteResponse(
    Long id,
    String tipoDocumento,
    String numeroDocumento,
    String nombres,
    String apellidos,
    String correo,
    String telefono,
    String direccion,
    String codigoEstudiante,
    String estadoAcademico,
    String apoderadoNombre,
    String relacionParentesco,
    List<MatriculaResponse> historialMatriculas
) {}
