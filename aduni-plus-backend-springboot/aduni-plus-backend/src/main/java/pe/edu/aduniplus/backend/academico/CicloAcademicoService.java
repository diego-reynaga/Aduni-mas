package pe.edu.aduniplus.backend.academico;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.dto.CicloRequest;
import pe.edu.aduniplus.backend.academico.dto.CicloResponse;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CicloAcademicoService {

    private final CicloAcademicoRepository repository;

    public List<CicloResponse> listar() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CicloResponse obtener(Long id) {
        CicloAcademico c = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ciclo no encontrado"));
        return mapToResponse(c);
    }

    @Transactional
    public CicloResponse crear(CicloRequest request) {
        CicloAcademico c = CicloAcademico.builder()
                .nombre(request.nombre())
                .fechaInicio(request.fechaInicio())
                .fechaFin(request.fechaFin())
                .build();
        return mapToResponse(repository.save(c));
    }

    @Transactional
    public CicloResponse actualizar(Long id, CicloRequest request) {
        CicloAcademico c = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ciclo no encontrado"));
        c.setNombre(request.nombre());
        c.setFechaInicio(request.fechaInicio());
        c.setFechaFin(request.fechaFin());
        return mapToResponse(repository.save(c));
    }

    @Transactional
    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Ciclo no encontrado");
        }
        repository.deleteById(id);
    }

    private CicloResponse mapToResponse(CicloAcademico c) {
        return new CicloResponse(c.getId(), c.getNombre(), c.getFechaInicio(), c.getFechaFin());
    }
}
