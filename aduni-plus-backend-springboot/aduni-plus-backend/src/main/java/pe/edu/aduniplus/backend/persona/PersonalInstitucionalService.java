package pe.edu.aduniplus.backend.persona;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.persona.dto.PerfilPersonalRequest;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonalInstitucionalService {

    private final PersonalInstitucionalRepository personalRepository;

    @Transactional(readOnly = true)
    public List<PersonalInstitucional> listarPersonal() {
        return personalRepository.findAll();
    }

    @Transactional(readOnly = true)
    public PersonalInstitucional obtenerPersonal(Long id) {
        return personalRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Personal institucional no encontrado con ID: " + id));
    }

    @Transactional
    public PersonalInstitucional actualizarPersonal(Long id, PerfilPersonalRequest request) {
        PersonalInstitucional personal = obtenerPersonal(id);
        personal.setCargo(request.cargo());
        personal.setFechaIngreso(request.fechaIngreso());
        return personalRepository.save(personal);
    }
}
