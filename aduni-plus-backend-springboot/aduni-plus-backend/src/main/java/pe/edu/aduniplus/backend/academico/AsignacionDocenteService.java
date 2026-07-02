package pe.edu.aduniplus.backend.academico;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.AsignacionDocenteDtos.AsignacionDocenteRequest;
import pe.edu.aduniplus.backend.academico.AsignacionDocenteDtos.AsignacionDocenteResponse;
import pe.edu.aduniplus.backend.auditoria.AuditoriaService;
import pe.edu.aduniplus.backend.persona.Docente;
import pe.edu.aduniplus.backend.persona.DocenteRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AsignacionDocenteService {
    private final AsignacionDocenteRepository asignacionRepository;
    private final DocenteRepository docenteRepository;
    private final CursoRepository cursoRepository;
    private final PeriodoAcademicoRepository periodoRepository;
    private final AuditoriaService auditoriaService;

    @Transactional(readOnly = true)
    public List<AsignacionDocenteResponse> listar() {
        return asignacionRepository.findAll(Sort.by(Sort.Direction.DESC, "fechaAsignacion", "id"))
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public AsignacionDocenteResponse crear(AsignacionDocenteRequest request) {
        Docente docente = docenteActivo(request.docenteId());
        Curso curso = cursoActivo(request.cursoId());
        PeriodoAcademico periodo = periodoRepository.findById(request.periodoAcademicoId())
            .orElseThrow(() -> new IllegalArgumentException("Periodo académico no encontrado."));

        if (asignacionRepository.existsByDocenteIdAndCursoIdAndPeriodoAcademicoId(
            docente.getId(), curso.getId(), periodo.getId())) {
            throw new IllegalArgumentException("El docente ya tiene asignado ese curso en el periodo seleccionado.");
        }

        AsignacionDocente asignacion = asignacionRepository.save(AsignacionDocente.builder()
            .docente(docente)
            .curso(curso)
            .periodoAcademico(periodo)
            .fechaAsignacion(LocalDate.now())
            .estado(request.estado() == null ? EstadoAsignacionDocente.ACTIVA : request.estado())
            .build());
        auditoriaService.registrarAuditoria("CREAR", "asignaciondocente", asignacion.getId(),
            "Asignación de " + docente.getCodigoDocente() + " al curso " + curso.getMateria().getNombre());
        return toResponse(asignacion);
    }

    @Transactional
    public AsignacionDocenteResponse actualizar(Long id, AsignacionDocenteRequest request) {
        AsignacionDocente asignacion = asignacionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Asignación docente no encontrada."));
        Docente docente = docenteActivo(request.docenteId());
        Curso curso = cursoActivo(request.cursoId());
        PeriodoAcademico periodo = periodoRepository.findById(request.periodoAcademicoId())
            .orElseThrow(() -> new IllegalArgumentException("Periodo académico no encontrado."));

        asignacionRepository.findByDocenteIdAndCursoIdAndPeriodoAcademicoId(
            docente.getId(), curso.getId(), periodo.getId())
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> { throw new IllegalArgumentException("Ya existe esa asignación docente."); });

        asignacion.setDocente(docente);
        asignacion.setCurso(curso);
        asignacion.setPeriodoAcademico(periodo);
        asignacion.setEstado(request.estado() == null ? asignacion.getEstado() : request.estado());
        asignacionRepository.save(asignacion);
        auditoriaService.registrarAuditoria("ACTUALIZAR", "asignaciondocente", id, "Asignación docente actualizada");
        return toResponse(asignacion);
    }

    @Transactional
    public void cerrar(Long id) {
        AsignacionDocente asignacion = asignacionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Asignación docente no encontrada."));
        asignacion.setEstado(EstadoAsignacionDocente.CERRADA);
        asignacionRepository.save(asignacion);
        auditoriaService.registrarAuditoria("CERRAR", "asignaciondocente", id, "Asignación docente cerrada");
    }

    private Docente docenteActivo(Long id) {
        Docente docente = docenteRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Docente no encontrado."));
        if (!Boolean.TRUE.equals(docente.getActivo())) {
            throw new IllegalArgumentException("El docente seleccionado está inactivo.");
        }
        return docente;
    }

    private Curso cursoActivo(Long id) {
        Curso curso = cursoRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Curso no encontrado."));
        if (!Boolean.TRUE.equals(curso.getActivo())) {
            throw new IllegalArgumentException("El curso seleccionado está inactivo.");
        }
        return curso;
    }

    private AsignacionDocenteResponse toResponse(AsignacionDocente asignacion) {
        return new AsignacionDocenteResponse(
            asignacion.getId(),
            asignacion.getDocente().getId(),
            asignacion.getDocente().getCodigoDocente(),
            asignacion.getDocente().getNombres() + " " + asignacion.getDocente().getApellidos(),
            asignacion.getCurso().getId(),
            asignacion.getCurso().getMateria().getNombre(),
            asignacion.getCurso().getGrado().getNombre(),
            asignacion.getCurso().getGrado().getParalelo(),
            asignacion.getPeriodoAcademico().getId(),
            asignacion.getPeriodoAcademico().getNombre(),
            asignacion.getFechaAsignacion(),
            asignacion.getEstado()
        );
    }
}
