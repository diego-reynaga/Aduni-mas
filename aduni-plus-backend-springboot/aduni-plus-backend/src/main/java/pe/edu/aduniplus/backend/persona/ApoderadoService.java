package pe.edu.aduniplus.backend.persona;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.persona.dto.PerfilApoderadoRequest;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApoderadoService {

    private final ApoderadoRepository apoderadoRepository;
    private final EstudianteRepository estudianteRepository;

    @Transactional(readOnly = true)
    public List<Apoderado> listarApoderados() {
        return apoderadoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Apoderado obtenerApoderado(Long id) {
        return apoderadoRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Apoderado no encontrado con ID: " + id));
    }

    @Transactional
    public Apoderado actualizarApoderado(Long id, PerfilApoderadoRequest request) {
        Apoderado apoderado = obtenerApoderado(id);
        apoderado.setRelacionParentesco(request.relacionParentesco());
        return apoderadoRepository.save(apoderado);
    }

    @Transactional(readOnly = true)
    public List<Estudiante> listarEstudiantes(Long id) {
        // Verificar que exista
        obtenerApoderado(id);
        return estudianteRepository.findByApoderadoId(id);
    }
}
