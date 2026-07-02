package pe.edu.aduniplus.backend.academico;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.dto.SeccionRequest;
import pe.edu.aduniplus.backend.academico.dto.SeccionResponse;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeccionService {

    private final SeccionRepository seccionRepository;
    private final CicloAcademicoRepository cicloRepository;
    private final TurnoRepository turnoRepository;
    private final MatriculaRepository matriculaRepository;

    @Transactional(readOnly = true)
    public List<SeccionResponse> listar() {
        return seccionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SeccionResponse> listarDisponibles(Long cicloId, Long turnoId) {
        List<Seccion> secciones;
        if (cicloId != null && turnoId != null) {
            secciones = seccionRepository.findByCicloIdAndTurnoId(cicloId, turnoId);
        } else if (cicloId != null) {
            secciones = seccionRepository.findByCicloId(cicloId);
        } else if (turnoId != null) {
            secciones = seccionRepository.findByTurnoId(turnoId);
        } else {
            secciones = seccionRepository.findAll();
        }
        return secciones.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SeccionResponse obtener(Long id) {
        Seccion s = seccionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Seccion no encontrada"));
        return mapToResponse(s);
    }

    @Transactional
    public SeccionResponse crear(SeccionRequest request) {
        CicloAcademico ciclo = cicloRepository.findById(request.cicloId())
                .orElseThrow(() -> new IllegalArgumentException("Ciclo no encontrado"));
        Turno turno = turnoRepository.findById(request.turnoId())
                .orElseThrow(() -> new IllegalArgumentException("Turno no encontrado"));

        Seccion s = Seccion.builder()
                .ciclo(ciclo)
                .turno(turno)
                .nombre(request.nombre())
                .cupoMaximo(request.cupoMaximo())
                .build();
        return mapToResponse(seccionRepository.save(s));
    }

    @Transactional
    public SeccionResponse actualizar(Long id, SeccionRequest request) {
        Seccion s = seccionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Seccion no encontrada"));
        CicloAcademico ciclo = cicloRepository.findById(request.cicloId())
                .orElseThrow(() -> new IllegalArgumentException("Ciclo no encontrado"));
        Turno turno = turnoRepository.findById(request.turnoId())
                .orElseThrow(() -> new IllegalArgumentException("Turno no encontrado"));

        s.setCiclo(ciclo);
        s.setTurno(turno);
        s.setNombre(request.nombre());
        s.setCupoMaximo(request.cupoMaximo());
        return mapToResponse(seccionRepository.save(s));
    }

    @Transactional
    public void eliminar(Long id) {
        if (!seccionRepository.existsById(id)) {
            throw new IllegalArgumentException("Seccion no encontrada");
        }
        seccionRepository.deleteById(id);
    }

    private SeccionResponse mapToResponse(Seccion s) {
        int ocupados = matriculaRepository.countBySeccionIdAndEstado(s.getId(), EstadoMatricula.ACTIVO.name());
        int disponibles = s.getCupoMaximo() - ocupados;
        return new SeccionResponse(
                s.getId(),
                s.getCiclo().getId(),
                s.getCiclo().getNombre(),
                s.getTurno().getId(),
                s.getTurno().getNombre(),
                s.getNombre(),
                s.getCupoMaximo(),
                Math.max(disponibles, 0),
                s.getVersion()
        );
    }
}
