package pe.edu.aduniplus.backend.persona;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.persona.dto.EstudianteDtos.EstudianteRequest;
import pe.edu.aduniplus.backend.persona.dto.EstudianteDtos.EstudianteResponse;
import pe.edu.aduniplus.backend.persona.dto.PersonaRequest;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EstudianteService {

    private final EstudianteRepository estudianteRepository;
    private final PersonaService personaService;

    @Transactional(readOnly = true)
    public List<EstudianteResponse> buscarEstudiantes(String search, Boolean activo) {
        return estudianteRepository.buscarPorFiltros(search, activo).stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional
    public EstudianteResponse crearEstudiante(EstudianteRequest request) {
        String codigoGenerado = generarCodigoEstudiante();
        // Delegamos a PersonaService (Identity Core) para crear o promover la cuenta física
        PersonaRequest personaReq = new PersonaRequest(
            request.nombres(),
            request.apellidos(),
            request.documentoIdentidad(),
            request.fechaNacimiento() != null ? request.fechaNacimiento().toString() : null,
            request.direccion(),
            request.telefono(),
            request.correo(),
            "ESTUDIANTE",
            codigoGenerado,
            null, null, null, null
        );

        personaService.crearPersona(personaReq);

        // Ya que personaService guarda el estudiante, lo recuperamos por código para retornarlo
        Estudiante estudiante = estudianteRepository.findByCodigoEstudiante(codigoGenerado)
            .orElseThrow(() -> new IllegalStateException("Error interno al crear estudiante"));
        return mapToResponse(estudiante);
    }

    @Transactional
    public EstudianteResponse actualizarEstudiante(Long id, EstudianteRequest request) {
        Estudiante estudiante = estudianteRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado"));

        PersonaRequest personaReq = new PersonaRequest(
            request.nombres(),
            request.apellidos(),
            request.documentoIdentidad(),
            request.fechaNacimiento() != null ? request.fechaNacimiento().toString() : null,
            request.direccion(),
            request.telefono(),
            request.correo(),
            "ESTUDIANTE",
            estudiante.getCodigoEstudiante(), // El código no se actualiza
            null, null, null, null
        );

        personaService.actualizarPersona(id, personaReq);
        estudiante.setActivo(request.activo() != null ? request.activo() : estudiante.getActivo());
        estudiante = estudianteRepository.save(estudiante);

        return mapToResponse(estudiante);
    }

    private String generarCodigoEstudiante() {
        int year = LocalDate.now().getYear();
        long count = estudianteRepository.count() + 1;
        String codigo;
        do {
            codigo = String.format("ALU%d%05d", year, count++);
        } while (estudianteRepository.existsByCodigoEstudiante(codigo));
        return codigo;
    }

    private EstudianteResponse mapToResponse(Estudiante e) {
        return new EstudianteResponse(
            e.getId(),
            e.getNombres(),
            e.getApellidos(),
            e.getDocumentoIdentidad(),
            e.getFechaNacimiento(),
            e.getDireccion(),
            e.getTelefono(),
            e.getCorreo(),
            e.getCodigoEstudiante(),
            e.getActivo(),
            e.getId() // personaId
        );
    }
}
