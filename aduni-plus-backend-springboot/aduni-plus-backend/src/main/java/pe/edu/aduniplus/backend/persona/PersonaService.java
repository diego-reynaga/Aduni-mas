package pe.edu.aduniplus.backend.persona;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.persona.dto.PersonaRequest;
import pe.edu.aduniplus.backend.persona.dto.PersonaResponse;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonaService {

    private final PersonaRepository personaRepository;
    private final AdministrativoRepository administrativoRepository;
    private final DocenteRepository docenteRepository;
    private final EstudianteRepository estudianteRepository;
    private final PadreFamiliaRepository padreFamiliaRepository;
    private final UsuarioRepository usuarioRepository;
    private final jakarta.persistence.EntityManager entityManager;

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
    public PersonaResponse crearPersona(PersonaRequest request) {
        // Interceptación de duplicados (Identity Core)
        Persona existingPersona = null;
        if (request.documentoIdentidad() != null && !request.documentoIdentidad().isBlank()) {
            existingPersona = personaRepository.findByDocumentoIdentidad(request.documentoIdentidad()).orElse(null);
        }
        if (existingPersona == null && request.correo() != null && !request.correo().isBlank()) {
            existingPersona = personaRepository.findByCorreo(request.correo()).orElse(null);
        }

        if (existingPersona != null) {
            String currentType = getTipoPersonaString(existingPersona);
            String targetType = request.tipoPersona().toUpperCase();

            if (currentType.equalsIgnoreCase(targetType)) {
                throw new IllegalArgumentException("Ya existe un registro de " + targetType + " con este documento/correo.");
            }

            // Si es diferente rol, promocionamos (vinculamos) usando Native Query para saltar la limitación de herencia simple de JPA
            Long id = existingPersona.getId();
            
            // 1. Validar reglas del nuevo rol antes de insertar
            validarCamposNuevoRol(targetType, request);
            
            // 2. Actualizar tipo en la tabla base
            entityManager.createNativeQuery("UPDATE personas SET tipo_persona = :tipo, nombres = :nombres, apellidos = :apellidos, telefono = :telefono, correo = :correo WHERE id = :id")
                .setParameter("tipo", targetType)
                .setParameter("nombres", request.nombres())
                .setParameter("apellidos", request.apellidos())
                .setParameter("telefono", request.telefono())
                .setParameter("correo", request.correo())
                .setParameter("id", id)
                .executeUpdate();

            // 3. Insertar en la tabla hija correspondiente
            insertarHijoNativo(id, targetType, request);

            entityManager.flush();
            entityManager.clear();

            Persona updated = personaRepository.findById(id).orElseThrow();
            return mapToResponse(updated);
        }

        // --- Flujo Normal de Creación ---
        Persona persona;
        String tipo = request.tipoPersona().toUpperCase();
        validarCamposNuevoRol(tipo, request);

        switch (tipo) {
            case "ADMINISTRATIVO" -> {
                persona = Administrativo.builder()
                    .codigoAdministrativo(request.codigo())
                    .cargo(request.cargo() == null ? "Administrativo" : request.cargo())
                    .activo(true)
                    .build();
            }
            case "DOCENTE" -> {
                persona = Docente.builder()
                    .codigoDocente(request.codigo())
                    .especialidad(request.especialidad())
                    .areaAcademica(request.areaAcademica())
                    .activo(true)
                    .build();
            }
            case "ESTUDIANTE" -> {
                persona = Estudiante.builder()
                    .codigoEstudiante(request.codigo())
                    .activo(true)
                    .build();
            }
            case "PADRE_FAMILIA" -> persona = PadreFamilia.builder()
                .ocupacion(request.ocupacion())
                .activo(true)
                .build();
            default -> {
                persona = new Persona();
            }
        }

        // Llenar campos base
        persona.setNombres(request.nombres());
        persona.setApellidos(request.apellidos());
        persona.setDocumentoIdentidad(request.documentoIdentidad());
        persona.setFechaNacimiento(parseFecha(request.fechaNacimiento()));
        persona.setDireccion(request.direccion());
        persona.setTelefono(request.telefono());
        persona.setCorreo(request.correo());

        // Guardar a través del repositorio polimórfico
        persona = personaRepository.save(persona);
        return mapToResponse(persona);
    }

    private void validarCamposNuevoRol(String tipo, PersonaRequest request) {
        switch (tipo) {
            case "ADMINISTRATIVO" -> {
                if (request.codigo() == null || request.codigo().isBlank()) throw new IllegalArgumentException("El código administrativo es obligatorio");
                if (administrativoRepository.existsByCodigoAdministrativo(request.codigo())) throw new IllegalArgumentException("El código administrativo ya existe");
            }
            case "DOCENTE" -> {
                if (request.codigo() == null || request.codigo().isBlank()) throw new IllegalArgumentException("El código de docente es obligatorio");
                if (docenteRepository.existsByCodigoDocente(request.codigo())) throw new IllegalArgumentException("El código de docente ya existe");
            }
            case "ESTUDIANTE" -> {
                if (request.codigo() == null || request.codigo().isBlank()) throw new IllegalArgumentException("El código de estudiante es obligatorio");
                if (estudianteRepository.existsByCodigoEstudiante(request.codigo())) throw new IllegalArgumentException("El código de estudiante ya existe");
            }
        }
    }

    private void insertarHijoNativo(Long id, String tipo, PersonaRequest request) {
        switch (tipo) {
            case "ADMINISTRATIVO" -> {
                entityManager.createNativeQuery("INSERT INTO administrativos (id, activo, cargo, codigo_administrativo) VALUES (:id, true, :cargo, :codigo)")
                    .setParameter("id", id).setParameter("cargo", request.cargo() == null ? "Administrativo" : request.cargo()).setParameter("codigo", request.codigo()).executeUpdate();
            }
            case "DOCENTE" -> {
                entityManager.createNativeQuery("INSERT INTO docentes (id, activo, area_academica, codigo_docente, especialidad) VALUES (:id, true, :area, :codigo, :especialidad)")
                    .setParameter("id", id).setParameter("area", request.areaAcademica()).setParameter("codigo", request.codigo()).setParameter("especialidad", request.especialidad()).executeUpdate();
            }
            case "ESTUDIANTE" -> {
                entityManager.createNativeQuery("INSERT INTO estudiantes (id, activo, codigo_estudiante) VALUES (:id, true, :codigo)")
                    .setParameter("id", id).setParameter("codigo", request.codigo()).executeUpdate();
            }
            case "PADRE_FAMILIA" -> {
                entityManager.createNativeQuery("INSERT INTO padres_familia (id, activo, ocupacion) VALUES (:id, true, :ocupacion)")
                    .setParameter("id", id).setParameter("ocupacion", request.ocupacion()).executeUpdate();
            }
        }
    }

    @Transactional
    public PersonaResponse actualizarPersona(Long id, PersonaRequest request) {
        Persona persona = personaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Persona no encontrada con ID: " + id));

        validarUnicidad(id, request.documentoIdentidad(), request.correo());

        String currentType = getTipoPersonaString(persona);
        if (!currentType.equalsIgnoreCase(request.tipoPersona())) {
            throw new IllegalArgumentException("No se permite cambiar el tipo de persona una vez creada.");
        }

        // Actualizar campos base
        persona.setNombres(request.nombres());
        persona.setApellidos(request.apellidos());
        persona.setDocumentoIdentidad(request.documentoIdentidad());
        persona.setFechaNacimiento(parseFecha(request.fechaNacimiento()));
        persona.setDireccion(request.direccion());
        persona.setTelefono(request.telefono());
        persona.setCorreo(request.correo());

        // Actualizar campos específicos
        if (persona instanceof Administrativo a) {
            a.setCargo(request.cargo());
            a.setCodigoAdministrativo(request.codigo());
        } else if (persona instanceof Docente d) {
            d.setEspecialidad(request.especialidad());
            d.setAreaAcademica(request.areaAcademica());
            d.setCodigoDocente(request.codigo());
        } else if (persona instanceof Estudiante e) {
            e.setCodigoEstudiante(request.codigo());
        } else if (persona instanceof PadreFamilia pf) {
            pf.setOcupacion(request.ocupacion());
        }

        persona = personaRepository.save(persona);
        return mapToResponse(persona);
    }

    @Transactional
    public void eliminarPersona(Long id) {
        Persona persona = personaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Persona no encontrada con ID: " + id));

        // Evitar eliminar personas con cuentas de usuarios activas vinculadas
        if (usuarioRepository.findByUsername(persona.getCorreo()).isPresent() || 
            usuarioRepository.findAll().stream().anyMatch(u -> u.getPersona().getId().equals(id))) {
            throw new IllegalArgumentException("No se puede eliminar a la persona porque tiene una cuenta de usuario asociada.");
        }

        personaRepository.delete(persona);
    }

    private void validarUnicidad(Long id, String documento, String correo) {
        if (documento != null && !documento.isBlank()) {
            personaRepository.findByDocumentoIdentidad(documento).ifPresent(p -> {
                if (id == null || !p.getId().equals(id)) {
                    throw new IllegalArgumentException("El documento de identidad ya se encuentra registrado.");
                }
            });
        }
        if (correo != null && !correo.isBlank()) {
            personaRepository.findByCorreo(correo).ifPresent(p -> {
                if (id == null || !p.getId().equals(id)) {
                    throw new IllegalArgumentException("El correo electrónico ya se encuentra registrado.");
                }
            });
        }
    }

    private String getTipoPersonaString(Persona p) {
        if (p instanceof Administrativo) return "ADMINISTRATIVO";
        if (p instanceof Docente) return "DOCENTE";
        if (p instanceof Estudiante) return "ESTUDIANTE";
        if (p instanceof PadreFamilia) return "PADRE_FAMILIA";
        return "PERSONA";
    }

    private LocalDate parseFecha(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return null;
        }
    }

    private PersonaResponse mapToResponse(Persona p) {
        String tipo = getTipoPersonaString(p);
        String codigo = null;
        String cargo = null;
        String especialidad = null;
        String areaAcademica = null;
        String ocupacion = null;

        if (p instanceof Administrativo a) {
            codigo = a.getCodigoAdministrativo();
            cargo = a.getCargo();
        } else if (p instanceof Docente d) {
            codigo = d.getCodigoDocente();
            especialidad = d.getEspecialidad();
            areaAcademica = d.getAreaAcademica();
        } else if (p instanceof Estudiante e) {
            codigo = e.getCodigoEstudiante();
        } else if (p instanceof PadreFamilia pf) {
            ocupacion = pf.getOcupacion();
        }

        return new PersonaResponse(
            p.getId(),
            p.getNombres(),
            p.getApellidos(),
            p.getDocumentoIdentidad(),
            p.getFechaNacimiento() != null ? p.getFechaNacimiento().toString() : null,
            p.getDireccion(),
            p.getTelefono(),
            p.getCorreo(),
            tipo,
            codigo,
            cargo,
            especialidad,
            areaAcademica,
            ocupacion,
            p.getCreadoEn(),
            p.getActualizadoEn()
        );
    }
}
