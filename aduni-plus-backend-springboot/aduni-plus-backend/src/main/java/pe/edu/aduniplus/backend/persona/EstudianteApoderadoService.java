package pe.edu.aduniplus.backend.persona;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.persona.dto.EstudianteApoderadoDtos.EstudianteApoderadoRequest;
import pe.edu.aduniplus.backend.persona.dto.EstudianteApoderadoDtos.EstudianteApoderadoResponse;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EstudianteApoderadoService {

    private final EstudianteApoderadoRepository estudianteApoderadoRepository;
    private final EstudianteRepository estudianteRepository;
    private final PadreFamiliaRepository padreFamiliaRepository;

    @Transactional(readOnly = true)
    public List<EstudianteApoderadoResponse> listarApoderadosPorEstudiante(Long estudianteId) {
        if (!estudianteRepository.existsById(estudianteId)) {
            throw new IllegalArgumentException("Estudiante no encontrado");
        }
        return estudianteApoderadoRepository.findByEstudianteId(estudianteId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public EstudianteApoderadoResponse asignarApoderado(Long estudianteId, EstudianteApoderadoRequest request) {
        Estudiante estudiante = estudianteRepository.findById(estudianteId)
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado"));

        PadreFamilia padre = padreFamiliaRepository.findById(request.padreFamiliaId())
                .orElseThrow(() -> new IllegalArgumentException("Padre de Familia no encontrado"));

        if (estudianteApoderadoRepository.existsByEstudianteIdAndPadreFamiliaId(estudianteId, padre.getId())) {
            throw new IllegalArgumentException("Este familiar ya está asociado a este estudiante");
        }

        if (Boolean.TRUE.equals(request.principal())) {
            estudianteApoderadoRepository.findByEstudianteIdAndPrincipalTrue(estudianteId)
                    .ifPresent(rel -> {
                        rel.setPrincipal(false);
                        estudianteApoderadoRepository.save(rel);
                    });
        }

        EstudianteApoderado rel = EstudianteApoderado.builder()
                .estudiante(estudiante)
                .padreFamilia(padre)
                .parentesco(request.parentesco())
                .principal(request.principal())
                .build();

        return mapToResponse(estudianteApoderadoRepository.save(rel));
    }

    @Transactional
    public EstudianteApoderadoResponse actualizarApoderado(Long id, EstudianteApoderadoRequest request) {
        EstudianteApoderado rel = estudianteApoderadoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asignación de apoderado no encontrada"));

        if (!rel.getPadreFamilia().getId().equals(request.padreFamiliaId())) {
             if (estudianteApoderadoRepository.existsByEstudianteIdAndPadreFamiliaId(rel.getEstudiante().getId(), request.padreFamiliaId())) {
                 throw new IllegalArgumentException("Este familiar ya está asociado a este estudiante");
             }
             PadreFamilia padre = padreFamiliaRepository.findById(request.padreFamiliaId())
                     .orElseThrow(() -> new IllegalArgumentException("Padre de Familia no encontrado"));
             rel.setPadreFamilia(padre);
        }

        if (Boolean.TRUE.equals(request.principal()) && !Boolean.TRUE.equals(rel.getPrincipal())) {
            estudianteApoderadoRepository.findByEstudianteIdAndPrincipalTrue(rel.getEstudiante().getId())
                    .ifPresent(p -> {
                        p.setPrincipal(false);
                        estudianteApoderadoRepository.save(p);
                    });
        }

        rel.setParentesco(request.parentesco());
        rel.setPrincipal(request.principal());

        return mapToResponse(estudianteApoderadoRepository.save(rel));
    }

    @Transactional
    public void removerApoderado(Long id) {
        if (!estudianteApoderadoRepository.existsById(id)) {
            throw new IllegalArgumentException("Asignación no encontrada");
        }
        estudianteApoderadoRepository.deleteById(id);
    }

    private EstudianteApoderadoResponse mapToResponse(EstudianteApoderado rel) {
        return new EstudianteApoderadoResponse(
                rel.getId(),
                rel.getEstudiante().getId(),
                rel.getPadreFamilia().getId(),
                rel.getPadreFamilia().getNombres() + " " + rel.getPadreFamilia().getApellidos(),
                rel.getPadreFamilia().getDocumentoIdentidad(),
                rel.getPadreFamilia().getTelefono(),
                rel.getPadreFamilia().getCorreo(),
                rel.getParentesco(),
                rel.getPrincipal()
        );
    }
}
