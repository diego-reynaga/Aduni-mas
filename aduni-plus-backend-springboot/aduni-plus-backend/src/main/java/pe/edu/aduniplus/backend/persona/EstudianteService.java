package pe.edu.aduniplus.backend.persona;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.MatriculaRepository;
import pe.edu.aduniplus.backend.academico.dto.MatriculaResponse;
import pe.edu.aduniplus.backend.persona.dto.EstudianteBuscarResponse;
import pe.edu.aduniplus.backend.persona.dto.EstudianteExpedienteResponse;
import pe.edu.aduniplus.backend.persona.dto.EstudiantePaginadoResponse;
import pe.edu.aduniplus.backend.persona.dto.PerfilEstudianteRequest;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EstudianteService {

    private final EstudianteRepository estudianteRepository;
    private final ApoderadoRepository apoderadoRepository;
    private final MatriculaRepository matriculaRepository;

    @Transactional(readOnly = true)
    public List<Estudiante> listarEstudiantes() {
        return estudianteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Estudiante obtenerEstudiante(Long id) {
        return estudianteRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con ID: " + id));
    }

    @Transactional(readOnly = true)
    public EstudiantePaginadoResponse buscarPaginado(String q, String estado, int pagina, int tamanio) {
        Page<Estudiante> page = estudianteRepository.buscarConPaginacion(q, estado, PageRequest.of(pagina, tamanio));
        List<EstudianteBuscarResponse> contenido = page.getContent().stream()
            .map(e -> new EstudianteBuscarResponse(
                e.getId(),
                e.getCodigoEstudiante(),
                e.getPersona().getNombres(),
                e.getPersona().getApellidos(),
                e.getPersona().getTipoDocumento(),
                e.getPersona().getNumeroDocumento(),
                e.getEstadoAcademico()
            ))
            .collect(Collectors.toList());
        return new EstudiantePaginadoResponse(
            contenido, pagina, page.getTotalPages(), page.getTotalElements(), tamanio);
    }

    @Transactional(readOnly = true)
    public List<EstudianteBuscarResponse> buscarActivos(String q, int limite) {
        return estudianteRepository.buscarActivos(q, PageRequest.of(0, limite)).stream()
            .map(e -> new EstudianteBuscarResponse(
                e.getId(),
                e.getCodigoEstudiante(),
                e.getPersona().getNombres(),
                e.getPersona().getApellidos(),
                e.getPersona().getTipoDocumento(),
                e.getPersona().getNumeroDocumento(),
                e.getEstadoAcademico()
            ))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EstudianteExpedienteResponse obtenerExpediente(Long id) {
        Estudiante estudiante = obtenerEstudiante(id);
        Persona p = estudiante.getPersona();

        String apoderadoNombre = null;
        String relacionParentesco = null;
        if (estudiante.getApoderado() != null) {
            apoderadoNombre = estudiante.getApoderado().getPersona().getNombres()
                + " " + estudiante.getApoderado().getPersona().getApellidos();
            relacionParentesco = estudiante.getApoderado().getRelacionParentesco();
        }

        List<MatriculaResponse> historial = matriculaRepository.findByEstudianteId(id).stream()
            .map(m -> new MatriculaResponse(
                m.getId(),
                m.getCodigoMatricula(),
                m.getEstudiante().getId(),
                m.getEstudiante().getNombres() + " " + m.getEstudiante().getApellidos(),
                m.getSeccion().getId(),
                m.getSeccion().getNombre(),
                m.getFechaMatricula(),
                m.getMontoTotalPactado(),
                m.getEstado()
            ))
            .collect(Collectors.toList());

        return new EstudianteExpedienteResponse(
            p.getId(), p.getTipoDocumento(), p.getNumeroDocumento(),
            p.getNombres(), p.getApellidos(), p.getCorreo(),
            p.getTelefono(), p.getDireccion(),
            estudiante.getCodigoEstudiante(), estudiante.getEstadoAcademico(),
            apoderadoNombre, relacionParentesco, historial
        );
    }

    @Transactional
    public Estudiante actualizarEstudiante(Long id, PerfilEstudianteRequest request) {
        Estudiante estudiante = obtenerEstudiante(id);
        estudiante.setCodigoEstudiante(request.codigoEstudiante());
        if (request.estadoAcademico() != null) {
            estudiante.setEstadoAcademico(request.estadoAcademico());
        }
        if (request.idApoderado() != null) {
            Apoderado ap = apoderadoRepository.findById(request.idApoderado())
                .orElseThrow(() -> new IllegalArgumentException("Apoderado no encontrado con ID: " + request.idApoderado()));
            estudiante.setApoderado(ap);
        } else {
            estudiante.setApoderado(null);
        }
        return estudianteRepository.save(estudiante);
    }

    @Transactional
    public Estudiante desactivarEstudiante(Long id) {
        Estudiante estudiante = obtenerEstudiante(id);
        estudiante.setEstadoAcademico("Retirado");
        return estudianteRepository.save(estudiante);
    }
}
