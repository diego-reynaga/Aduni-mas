package pe.edu.aduniplus.backend.academico;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.dto.MatriculaRequest;
import pe.edu.aduniplus.backend.academico.dto.MatriculaResponse;
import pe.edu.aduniplus.backend.persona.Persona;
import pe.edu.aduniplus.backend.persona.PersonaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatriculaService {

    private final MatriculaRepository matriculaRepository;
    private final SeccionRepository seccionRepository;
    private final PersonaRepository personaRepository;
    private final CodigoMatriculaGenerator codigoMatriculaGenerator;

    @Transactional(readOnly = true)
    public List<MatriculaResponse> listar() {
        return matriculaRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MatriculaResponse obtener(Long id) {
        Matricula m = matriculaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Matricula no encontrada"));
        return mapToResponse(m);
    }

    @Transactional(readOnly = true)
    public List<MatriculaResponse> listarPorEstudiante(Long estudianteId) {
        return matriculaRepository.findByEstudianteId(estudianteId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MatriculaResponse registrar(MatriculaRequest request) {
        Seccion seccion = seccionRepository.findById(request.seccionId())
            .orElseThrow(() -> new IllegalArgumentException("Seccion no encontrada con ID: " + request.seccionId()));

        Persona estudiante = personaRepository.findById(request.estudianteId())
            .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con ID: " + request.estudianteId()));

        // VALIDACION PROGRAMATICA (capa suave antes de la UK de BD)
        if (matriculaRepository.existsByEstudianteIdAndSeccionId(request.estudianteId(), request.seccionId())) {
            throw new IllegalArgumentException("El estudiante ya esta matriculado en esta seccion");
        }

        // VALIDACION DE AFORO CON COUNT INDEXADO
        int ocupados = matriculaRepository.countBySeccionIdAndEstado(request.seccionId(), EstadoMatricula.ACTIVO.name());
        int disponibles = seccion.getCupoMaximo() - ocupados;
        if (disponibles <= 0) {
            throw new IllegalArgumentException("La seccion " + seccion.getNombre() + " ha alcanzado su cupo maximo (" + seccion.getCupoMaximo() + ")");
        }

        // GENERACION DE CODIGO_MATRICULA
        String codigoMatricula;
        try {
            codigoMatricula = codigoMatriculaGenerator.generarSiguiente();
        } catch (Exception e) {
            throw new IllegalStateException("Error al generar codigo de matricula: " + e.getMessage());
        }

        Matricula matricula = Matricula.builder()
            .codigoMatricula(codigoMatricula)
            .estudiante(estudiante)
            .seccion(seccion)
            .fechaMatricula(request.fechaMatricula() != null ? request.fechaMatricula() : LocalDate.now())
            .montoTotalPactado(request.montoTotalPactado())
            .estado(EstadoMatricula.ACTIVO.name())
            .build();

        try {
            matricula = matriculaRepository.save(matricula);
        } catch (OptimisticLockingFailureException e) {
            throw new IllegalStateException("El cupo se agoto antes de completar la operacion. Intente nuevamente.");
        } catch (DataIntegrityViolationException e) {
            // CAPTURA LIMPIA DE UK_ESTUDIANTE_SECCION y UK_CODIGO
            if (e.getMessage() != null && e.getMessage().contains("uk_matriculas_estudiante_seccion")) {
                throw new IllegalStateException("Matricula duplicada detectada. El estudiante ya pertenece a esta seccion.");
            }
            if (e.getMessage() != null && e.getMessage().contains("uk_matriculas_codigo")) {
                throw new IllegalStateException("Codigo de matricula duplicado. Reintente la operacion.");
            }
            throw e;
        }

        return mapToResponse(matricula);
    }

    @Transactional
    public MatriculaResponse cambiarEstado(Long id, String nuevoEstadoStr) {
        Matricula matricula = matriculaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Matricula no encontrada con ID: " + id));

        EstadoMatricula estadoActual = matricula.getEstadoEnum();
        EstadoMatricula nuevoEstado = EstadoMatricula.fromString(nuevoEstadoStr);

        if (nuevoEstado == null) {
            throw new IllegalArgumentException("Estado invalido: " + nuevoEstadoStr);
        }

        if (!estadoActual.puedeTransicionarA(nuevoEstado)) {
            throw new IllegalStateException(
                String.format("No se puede cambiar de estado %s a %s", estadoActual, nuevoEstado));
        }

        matricula.setEstadoEnum(nuevoEstado);
        matricula = matriculaRepository.save(matricula);

        return mapToResponse(matricula);
    }

    @Transactional
    public void retirar(Long id) {
        cambiarEstado(id, EstadoMatricula.RETIRADO.name());
    }

    private MatriculaResponse mapToResponse(Matricula m) {
        return new MatriculaResponse(
            m.getId(),
            m.getCodigoMatricula(),
            m.getEstudiante().getId(),
            m.getEstudiante().getNombres() + " " + m.getEstudiante().getApellidos(),
            m.getSeccion().getId(),
            m.getSeccion().getNombre(),
            m.getFechaMatricula(),
            m.getMontoTotalPactado(),
            m.getEstado()
        );
    }
}
