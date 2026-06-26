package pe.edu.aduniplus.backend.academico;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.AcademicoDtos.MatriculaRequest;
import pe.edu.aduniplus.backend.academico.AcademicoDtos.MatriculaResponse;
import pe.edu.aduniplus.backend.persona.Estudiante;
import pe.edu.aduniplus.backend.persona.EstudianteRepository;
import pe.edu.aduniplus.backend.auditoria.AuditoriaService;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MatriculaService {

    private final MatriculaRepository matriculaRepository;
    private final EstudianteRepository estudianteRepository;
    private final GradoRepository gradoRepository;
    private final AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public List<MatriculaResponse> listarMatriculas() {
        return matriculaRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MatriculaResponse> listarMatriculasPorEstudiante(Long estudianteId) {
        return matriculaRepository.findByEstudianteIdOrderByFechaMatriculaDesc(estudianteId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public MatriculaResponse matricularEstudiante(MatriculaRequest request) {
        Estudiante estudiante = estudianteRepository.findById(request.estudianteId())
            .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado"));
            
        if (!estudiante.getActivo()) {
            throw new IllegalArgumentException("El estudiante no se encuentra activo.");
        }

        Grado grado = gradoRepository.findById(request.gradoId())
            .orElseThrow(() -> new IllegalArgumentException("Grado no encontrado"));

        if (!grado.getActivo()) {
            throw new IllegalArgumentException("El grado no se encuentra activo.");
        }

        // Validar que el estudiante no tenga otra matrícula ACTIVA en el mismo ciclo
        List<Matricula> activasMismoCiclo = matriculaRepository.findByEstudianteAndNivelAndEstado(
            estudiante.getId(), grado.getNivelEducativo().getId(), EstadoMatricula.ACTIVO);
        if (!activasMismoCiclo.isEmpty()) {
            throw new IllegalArgumentException("El estudiante ya tiene una matrícula ACTIVA en el mismo ciclo.");
        }

        // Validar que la fecha de matrícula esté dentro de [nivel.fechaInicio, nivel.fechaFin]
        LocalDate hoy = LocalDate.now();
        LocalDate fechaInicio = grado.getNivelEducativo().getFechaInicio();
        LocalDate fechaFin = grado.getNivelEducativo().getFechaFin();
        if (fechaInicio != null && fechaFin != null) {
            if (hoy.isBefore(fechaInicio) || hoy.isAfter(fechaFin)) {
                throw new IllegalArgumentException("La fecha actual no está dentro del periodo de matrícula del ciclo.");
            }
        }

        // Control de Aforos
        long ocupados = matriculaRepository.countByGradoIdAndEstadoIn(
            grado.getId(), 
            List.of(EstadoMatricula.ACTIVO, EstadoMatricula.PRE_MATRICULADO)
        );

        if (ocupados >= grado.getCapacidad()) {
            throw new AforoExcedidoException("No hay vacantes disponibles en el aula seleccionada.");
        }

        // Generación de código
        int year = LocalDate.now().getYear();
        String unique = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String codigo = String.format("MAT-%d-%s", year, unique);

        Matricula matricula = Matricula.builder()
            .codigoMatricula(codigo)
            .estudiante(estudiante)
            .grado(grado)
            .fechaMatricula(LocalDate.now())
            .estado(EstadoMatricula.ACTIVO)
            .build();

        try {
            matricula = matriculaRepository.saveAndFlush(matricula);
            
            auditoriaService.registrarAuditoria(
                "CREACION",
                "matriculas",
                matricula.getId(),
                "Matrícula inicial en grado " + grado.getNombre()
            );
        } catch (DataIntegrityViolationException e) {
            if (e.getMessage() != null && e.getMessage().contains("uk_matriculas_estudiante_grado")) {
                throw new IllegalArgumentException("El estudiante ya se encuentra matriculado en este grado.");
            }
            throw e;
        }

        return mapToResponse(matricula);
    }

    @Transactional
    public void cambiarEstado(Long id, EstadoMatricula nuevoEstado) {
        Matricula matricula = matriculaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Matrícula no encontrada"));
            
        EstadoMatricula anterior = matricula.getEstado();
        matricula.setEstado(nuevoEstado);
        matriculaRepository.save(matricula);
        
        auditoriaService.registrarAuditoria(
            "CAMBIAR_ESTADO",
            "matriculas",
            matricula.getId(),
            String.format("Estado cambiado de %s a %s", anterior, nuevoEstado)
        );
    }

    private MatriculaResponse mapToResponse(Matricula m) {
        return new MatriculaResponse(
            m.getId(),
            m.getCodigoMatricula(),
            m.getEstudiante().getId(),
            m.getEstudiante().getNombres() + " " + m.getEstudiante().getApellidos(),
            m.getEstudiante().getCodigoEstudiante(),
            m.getGrado().getId(),
            m.getGrado().getNombre(),
            m.getGrado().getParalelo(),
            m.getGrado().getNivelEducativo().getId(),
            m.getGrado().getNivelEducativo().getNombre(),
            m.getFechaMatricula(),
            m.getEstado()
        );
    }
}
