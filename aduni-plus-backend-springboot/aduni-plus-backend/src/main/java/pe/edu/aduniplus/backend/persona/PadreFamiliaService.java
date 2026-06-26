package pe.edu.aduniplus.backend.persona;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.persona.dto.PadreFamiliaDtos.*;
import pe.edu.aduniplus.backend.persona.dto.PersonaRequest;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PadreFamiliaService {

    private final PadreFamiliaRepository padreFamiliaRepository;
    private final PersonaService personaService;

    @Transactional(readOnly = true)
    public List<PadreFamiliaResponse> listar(String search) {
        return padreFamiliaRepository.buscarPorFiltros(search).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PadreFamiliaResponse obtener(Long id) {
        PadreFamilia pf = padreFamiliaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PadreFamilia no encontrado con ID: " + id));
        return mapToResponse(pf);
    }

    @Transactional
    public PadreFamiliaResponse crear(PadreFamiliaRequest request) {
        String codigo = "APO" + LocalDate.now().getYear() + System.currentTimeMillis() % 10000;
        
        PersonaRequest personaRequest = new PersonaRequest(
                request.nombres(),
                request.apellidos(),
                request.documentoIdentidad(),
                request.fechaNacimiento() != null ? request.fechaNacimiento().toString() : null,
                request.direccion(),
                request.telefono(),
                request.correo(),
                "PADRE_FAMILIA",
                codigo,
                null,
                null,
                null,
                request.ocupacion()
        );
        personaService.crearPersona(personaRequest);
        
        // Fetch the created one
        PadreFamilia pf = (PadreFamilia) padreFamiliaRepository.buscarPorFiltros(request.documentoIdentidad()).get(0);
        pf.setActivo(request.activo() != null ? request.activo() : true);
        return mapToResponse(padreFamiliaRepository.save(pf));
    }

    @Transactional
    public PadreFamiliaResponse actualizar(Long id, PadreFamiliaRequest request) {
        PadreFamilia pf = padreFamiliaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PadreFamilia no encontrado con ID: " + id));
                
        PersonaRequest personaRequest = new PersonaRequest(
                request.nombres(),
                request.apellidos(),
                request.documentoIdentidad(),
                request.fechaNacimiento() != null ? request.fechaNacimiento().toString() : null,
                request.direccion(),
                request.telefono(),
                request.correo(),
                "PADRE_FAMILIA",
                null,
                null,
                null,
                null,
                request.ocupacion()
        );
        personaService.actualizarPersona(id, personaRequest);
        
        pf.setOcupacion(request.ocupacion());
        pf.setActivo(request.activo() != null ? request.activo() : true);
        return mapToResponse(padreFamiliaRepository.save(pf));
    }

    private PadreFamiliaResponse mapToResponse(PadreFamilia pf) {
        return new PadreFamiliaResponse(
                pf.getId(),
                pf.getNombres(),
                pf.getApellidos(),
                pf.getDocumentoIdentidad(),
                pf.getFechaNacimiento(),
                pf.getDireccion(),
                pf.getTelefono(),
                pf.getCorreo(),
                pf.getOcupacion(),
                pf.getActivo()
        );
    }
}
