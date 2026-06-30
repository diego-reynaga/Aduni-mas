package pe.edu.aduniplus.backend.academico;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.dto.MateriaRequest;
import pe.edu.aduniplus.backend.academico.dto.MateriaResponse;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MateriaService {

    private final MateriaRepository repository;

    public List<MateriaResponse> listar() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public MateriaResponse obtener(Long id) {
        Materia m = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Materia no encontrada"));
        return mapToResponse(m);
    }

    @Transactional
    public MateriaResponse crear(MateriaRequest request) {
        if (!request.area().equals("Ingeniería") && !request.area().equals("Letras")) {
            throw new IllegalArgumentException("El área debe ser 'Ingeniería' o 'Letras'");
        }
        Materia m = Materia.builder()
                .nombre(request.nombre())
                .area(request.area())
                .build();
        return mapToResponse(repository.save(m));
    }

    @Transactional
    public MateriaResponse actualizar(Long id, MateriaRequest request) {
        if (!request.area().equals("Ingeniería") && !request.area().equals("Letras")) {
            throw new IllegalArgumentException("El área debe ser 'Ingeniería' o 'Letras'");
        }
        Materia m = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Materia no encontrada"));
        m.setNombre(request.nombre());
        m.setArea(request.area());
        return mapToResponse(repository.save(m));
    }

    @Transactional
    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Materia no encontrada");
        }
        repository.deleteById(id);
    }

    private MateriaResponse mapToResponse(Materia m) {
        return new MateriaResponse(m.getId(), m.getNombre(), m.getArea());
    }
}
