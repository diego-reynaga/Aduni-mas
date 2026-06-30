package pe.edu.aduniplus.backend.academico;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.dto.TurnoRequest;
import pe.edu.aduniplus.backend.academico.dto.TurnoResponse;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TurnoService {

    private final TurnoRepository repository;

    public List<TurnoResponse> listar() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TurnoResponse obtener(Long id) {
        Turno t = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Turno no encontrado"));
        return mapToResponse(t);
    }

    @Transactional
    public TurnoResponse crear(TurnoRequest request) {
        Turno t = Turno.builder()
                .nombre(request.nombre())
                .horaInicio(request.horaInicio())
                .horaFin(request.horaFin())
                .build();
        return mapToResponse(repository.save(t));
    }

    @Transactional
    public TurnoResponse actualizar(Long id, TurnoRequest request) {
        Turno t = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Turno no encontrado"));
        t.setNombre(request.nombre());
        t.setHoraInicio(request.horaInicio());
        t.setHoraFin(request.horaFin());
        return mapToResponse(repository.save(t));
    }

    @Transactional
    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Turno no encontrado");
        }
        repository.deleteById(id);
    }

    private TurnoResponse mapToResponse(Turno t) {
        return new TurnoResponse(t.getId(), t.getNombre(), t.getHoraInicio(), t.getHoraFin());
    }
}
