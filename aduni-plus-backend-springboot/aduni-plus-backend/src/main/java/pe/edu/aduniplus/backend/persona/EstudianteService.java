package pe.edu.aduniplus.backend.persona;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.persona.dto.PerfilEstudianteRequest;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EstudianteService {

    private final EstudianteRepository estudianteRepository;
    private final ApoderadoRepository apoderadoRepository;

    @Transactional(readOnly = true)
    public List<Estudiante> listarEstudiantes() {
        return estudianteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Estudiante obtenerEstudiante(Long id) {
        return estudianteRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con ID: " + id));
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
