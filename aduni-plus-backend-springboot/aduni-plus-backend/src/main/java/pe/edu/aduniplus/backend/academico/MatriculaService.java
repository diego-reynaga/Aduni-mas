package pe.edu.aduniplus.backend.academico;

import lombok.RequiredArgsConstructor;
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

    @Transactional(readOnly = true)
    public List<MatriculaResponse> listar() {
        return matriculaRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MatriculaResponse obtener(Long id) {
        Matricula m = matriculaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Matrícula no encontrada"));
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
            .orElseThrow(() -> new IllegalArgumentException("Sección no encontrada con ID: " + request.seccionId()));

        Persona estudiante = personaRepository.findById(request.estudianteId())
            .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado con ID: " + request.estudianteId()));

        if (matriculaRepository.existsByEstudianteIdAndSeccionId(request.estudianteId(), request.seccionId())) {
            throw new IllegalArgumentException("El estudiante ya está matriculado en esta sección");
        }

        // --- VALIDACIÓN DE CUPO CON LECTURA ACTUALIZADA ---
        int ocupados = matriculaRepository.countBySeccionIdAndEstado(request.seccionId(), "Activo");
        int disponibles = seccion.getCupoMaximo() - ocupados;
        if (disponibles <= 0) {
            throw new IllegalArgumentException("La sección " + seccion.getNombre() + " ha alcanzado su cupo máximo (" + seccion.getCupoMaximo() + ")");
        }

        Matricula matricula = Matricula.builder()
            .estudiante(estudiante)
            .seccion(seccion)
            .fechaMatricula(LocalDate.now())
            .montoTotalPactado(request.montoTotalPactado())
            .estado("Activo")
            .build();

        try {
            matricula = matriculaRepository.save(matricula);
        } catch (OptimisticLockingFailureException e) {
            throw new IllegalStateException("El cupo se agotó antes de completar la operación. Intente nuevamente.");
        }

        return mapToResponse(matricula);
    }

    @Transactional
    public void retirar(Long id) {
        Matricula matricula = matriculaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Matrícula no encontrada con ID: " + id));
        matricula.setEstado("Retirado");
        matriculaRepository.save(matricula);
        // El cupo se libera automáticamente porque countBySeccionIdAndEstado solo cuenta "Activo"
    }

    private MatriculaResponse mapToResponse(Matricula m) {
        return new MatriculaResponse(
            m.getId(),
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
