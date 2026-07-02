package pe.edu.aduniplus.backend.persona;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.persona.dto.PersonaRequest;
import pe.edu.aduniplus.backend.persona.dto.PersonaResponse;
import pe.edu.aduniplus.backend.persona.dto.PersonaConPerfilesRequest;
import pe.edu.aduniplus.backend.persona.dto.PersonaConPerfilesResponse;
import pe.edu.aduniplus.backend.persona.dto.PerfilEstudianteRequest;
import pe.edu.aduniplus.backend.persona.dto.PerfilApoderadoRequest;
import pe.edu.aduniplus.backend.persona.dto.PerfilPersonalRequest;
import pe.edu.aduniplus.backend.persona.dto.PerfilResponse;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonaService {

    private final PersonaRepository personaRepository;

    private final EstudianteRepository estudianteRepository;
    private final ApoderadoRepository apoderadoRepository;
    private final PersonalInstitucionalRepository personalInstitucionalRepository;
    private final CodigoEstudianteGenerator codigoEstudianteGenerator;

    @Transactional(readOnly = true)
    public List<PersonaResponse> listarPersonas() {
        return personaRepository.findAll(Sort.by(Sort.Direction.ASC, "nombres", "apellidos")).stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public PersonaResponse obtenerPersona(Long id) {
        Persona persona = personaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Persona no encontrada con ID: " + id));
        return mapToResponse(persona);
    }

    @Transactional
    public PersonaConPerfilesResponse crearPersonaConPerfiles(PersonaConPerfilesRequest request) {
        if (personaRepository.existsByNumeroDocumento(request.numeroDocumento())) {
            throw new IllegalArgumentException("El numero de documento '" + request.numeroDocumento() + "' ya existe");
        }

        Persona persona = new Persona();
        persona.setTipoDocumento(request.tipoDocumento());
        persona.setNumeroDocumento(request.numeroDocumento());
        persona.setNombres(request.nombres());
        persona.setApellidos(request.apellidos());
        persona.setCorreo(request.correo());
        persona.setTelefono(request.telefono());
        persona.setDireccion(request.direccion());
        persona = personaRepository.save(persona);

        java.util.Set<PerfilResponse> perfilesCreados = new java.util.LinkedHashSet<>();

        if (request.perfiles().contains(PerfilPersona.ESTUDIANTE)) {
            PerfilEstudianteRequest estReq = request.estudiante();
            if (estReq == null) throw new IllegalArgumentException("Datos de estudiante requeridos");

            String codigoEstudiante = estReq.codigoEstudiante();
            if (codigoEstudiante == null || codigoEstudiante.isBlank()) {
                codigoEstudiante = codigoEstudianteGenerator.generarSiguiente();
            }
            if (estudianteRepository.existsByCodigoEstudiante(codigoEstudiante)) {
                throw new IllegalArgumentException("El codigo de estudiante '" + codigoEstudiante + "' ya existe");
            }

            Estudiante estudiante = new Estudiante();
            estudiante.setId(persona.getId());
            estudiante.setPersona(persona);
            estudiante.setCodigoEstudiante(codigoEstudiante);
            estudiante.setEstadoAcademico(estReq.estadoAcademico() != null ? estReq.estadoAcademico() : "Regular");
            if (estReq.idApoderado() != null) {
                Apoderado ap = apoderadoRepository.findById(estReq.idApoderado())
                    .orElseThrow(() -> new IllegalArgumentException("Apoderado no encontrado con ID: " + estReq.idApoderado()));
                estudiante.setApoderado(ap);
            }
            estudianteRepository.save(estudiante);
            perfilesCreados.add(new PerfilResponse("ESTUDIANTE", java.util.Map.of(
                "codigoEstudiante", estudiante.getCodigoEstudiante(),
                "estadoAcademico", estudiante.getEstadoAcademico()
            )));
        }

        if (request.perfiles().contains(PerfilPersona.APODERADO)) {
            PerfilApoderadoRequest apoReq = request.apoderado();
            if (apoReq == null) throw new IllegalArgumentException("Datos de apoderado requeridos");
            Apoderado apoderado = new Apoderado();
            apoderado.setId(persona.getId());
            apoderado.setPersona(persona);
            apoderado.setRelacionParentesco(apoReq.relacionParentesco());
            apoderadoRepository.save(apoderado);
            perfilesCreados.add(new PerfilResponse("APODERADO", java.util.Map.of(
                "relacionParentesco", apoderado.getRelacionParentesco()
            )));
        }

        if (request.perfiles().contains(PerfilPersona.PERSONAL_INSTITUCIONAL)) {
            PerfilPersonalRequest perReq = request.personalInstitucional();
            if (perReq == null) throw new IllegalArgumentException("Datos de personal institucional requeridos");
            PersonalInstitucional personal = new PersonalInstitucional();
            personal.setId(persona.getId());
            personal.setPersona(persona);
            personal.setCargo(perReq.cargo());
            personal.setFechaIngreso(perReq.fechaIngreso());
            personalInstitucionalRepository.save(personal);
            perfilesCreados.add(new PerfilResponse("PERSONAL_INSTITUCIONAL", java.util.Map.of(
                "cargo", personal.getCargo(),
                "fechaIngreso", personal.getFechaIngreso().toString()
            )));
        }

        return mapToConPerfilesResponse(persona, perfilesCreados);
    }

    @Transactional(readOnly = true)
    public PersonaConPerfilesResponse obtenerPersonaConPerfiles(Long id) {
        Persona persona = personaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Persona no encontrada con ID: " + id));

        java.util.Set<PerfilResponse> perfiles = new java.util.LinkedHashSet<>();

        estudianteRepository.findById(id).ifPresent(est -> perfiles.add(
            new PerfilResponse("ESTUDIANTE", java.util.Map.of(
                "codigoEstudiante", est.getCodigoEstudiante(),
                "estadoAcademico", est.getEstadoAcademico()
            ))
        ));

        apoderadoRepository.findById(id).ifPresent(apo -> perfiles.add(
            new PerfilResponse("APODERADO", java.util.Map.of(
                "relacionParentesco", apo.getRelacionParentesco()
            ))
        ));

        personalInstitucionalRepository.findById(id).ifPresent(per -> perfiles.add(
            new PerfilResponse("PERSONAL_INSTITUCIONAL", java.util.Map.of(
                "cargo", per.getCargo(),
                "fechaIngreso", per.getFechaIngreso().toString()
            ))
        ));

        return mapToConPerfilesResponse(persona, perfiles);
    }

    @Transactional
    public PersonaResponse crearPersona(PersonaRequest request) {
        if (personaRepository.existsByNumeroDocumento(request.numeroDocumento())) {
            throw new IllegalArgumentException("El numero de documento ya existe");
        }
        Persona persona = new Persona();
        persona.setTipoDocumento(request.tipoDocumento());
        persona.setNumeroDocumento(request.numeroDocumento());
        persona.setNombres(request.nombres());
        persona.setApellidos(request.apellidos());
        persona.setCorreo(request.correo());
        persona.setTelefono(request.telefono());
        persona.setDireccion(request.direccion());
        persona = personaRepository.save(persona);
        return mapToResponse(persona);
    }

    @Transactional
    public PersonaResponse actualizarPersona(Long id, PersonaRequest request) {
        Persona persona = personaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Persona no encontrada con ID: " + id));
        persona.setTipoDocumento(request.tipoDocumento());
        persona.setNumeroDocumento(request.numeroDocumento());
        persona.setNombres(request.nombres());
        persona.setApellidos(request.apellidos());
        persona.setCorreo(request.correo());
        persona.setTelefono(request.telefono());
        persona.setDireccion(request.direccion());
        persona = personaRepository.save(persona);
        return mapToResponse(persona);
    }

    @Transactional
    public void eliminarPersona(Long id) {
        if (!personaRepository.existsById(id)) {
            throw new IllegalArgumentException("Persona no encontrada con ID: " + id);
        }
        personaRepository.deleteById(id);
    }

    private PersonaResponse mapToResponse(Persona p) {
        return new PersonaResponse(
            p.getId(), p.getTipoDocumento(), p.getNumeroDocumento(),
            p.getNombres(), p.getApellidos(), p.getCorreo(),
            p.getTelefono(), p.getDireccion()
        );
    }

    private PersonaConPerfilesResponse mapToConPerfilesResponse(Persona p, java.util.Set<PerfilResponse> perfiles) {
        return new PersonaConPerfilesResponse(
            p.getId(), p.getTipoDocumento(), p.getNumeroDocumento(),
            p.getNombres(), p.getApellidos(), p.getCorreo(),
            p.getTelefono(), p.getDireccion(), perfiles
        );
    }
}
