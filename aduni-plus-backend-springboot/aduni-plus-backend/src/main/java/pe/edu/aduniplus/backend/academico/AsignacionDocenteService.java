package pe.edu.aduniplus.backend.academico;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.AcademicoDtos.*;
import pe.edu.aduniplus.backend.persona.Docente;
import pe.edu.aduniplus.backend.persona.DocenteRepository;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AsignacionDocenteService {

    private final AsignacionDocenteRepository repository;
    private final DocenteRepository docenteRepository;
    private final CursoRepository cursoRepository;
    private final PeriodoAcademicoRepository periodoRepository;

    @Transactional(readOnly = true)
    public List<AsignacionDocenteResponse> listar(Long periodoId, Long docenteId) {
        List<AsignacionDocente> list;
        if (periodoId != null && docenteId != null)
            list = repository.findByDocenteIdAndPeriodoAcademicoId(docenteId, periodoId);
        else if (periodoId != null)
            list = repository.findAll().stream()
                .filter(a -> a.getPeriodoAcademico().getId().equals(periodoId))
                .toList();
        else if (docenteId != null)
            list = repository.findByDocenteId(docenteId);
        else
            list = repository.findAll();
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CursoDisponibleResponse> listarCursosDisponibles(Long periodoId) {
        if (periodoId == null) return List.of();
        List<Curso> todosLosCursos = cursoRepository.findAll();
        return todosLosCursos.stream()
            .filter(c -> !repository.existsByDocenteIdAndCursoIdAndPeriodoAcademicoId(null, c.getId(), periodoId) 
                && !repository.findByCursoIdAndPeriodoAcademicoIdAndEstado(c.getId(), periodoId, EstadoAsignacionDocente.ACTIVA).isPresent())
            .map(c -> new CursoDisponibleResponse(
                c.getId(),
                c.getMateria().getId(), c.getMateria().getNombre(), c.getMateria().getCodigo(),
                c.getGrado().getId(), c.getGrado().getNombre(),
                c.getGrado().getParalelo()
            ))
            .toList();
    }

    @Transactional
    public AsignacionDocenteResponse asignar(AsignacionDocenteRequest request) {
        // Validar unicidad
        if (repository.existsByDocenteIdAndCursoIdAndPeriodoAcademicoId(request.docenteId(), request.cursoId(), request.periodoAcademicoId())) {
            throw new IllegalArgumentException("El docente ya está asignado a este curso en el periodo seleccionado.");
        }

        Docente docente = docenteRepository.findById(request.docenteId())
            .orElseThrow(() -> new IllegalArgumentException("Docente no encontrado"));
        Curso curso = cursoRepository.findById(request.cursoId())
            .orElseThrow(() -> new IllegalArgumentException("Curso no encontrado"));
        PeriodoAcademico periodo = periodoRepository.findById(request.periodoAcademicoId())
            .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado"));

        AsignacionDocente ad = AsignacionDocente.builder()
            .docente(docente)
            .curso(curso)
            .periodoAcademico(periodo)
            .fechaAsignacion(LocalDate.now())
            .estado(EstadoAsignacionDocente.ACTIVA)
            .build();

        return toResponse(repository.save(ad));
    }

    @Transactional
    public void remover(Long id) {
        AsignacionDocente ad = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Asignación no encontrada"));
        ad.setEstado(EstadoAsignacionDocente.CERRADA);
        repository.save(ad);
    }

    private AsignacionDocenteResponse toResponse(AsignacionDocente ad) {
        return new AsignacionDocenteResponse(
            ad.getId(),
            ad.getDocente().getId(),
            ad.getDocente().getNombres() + " " + ad.getDocente().getApellidos(),
            ad.getDocente().getCodigoDocente(),
            ad.getCurso().getId(),
            ad.getCurso().getMateria().getNombre(),
            ad.getCurso().getMateria().getNombre(),
            ad.getCurso().getMateria().getCodigo(),
            ad.getCurso().getGrado().getNombre(),
            ad.getCurso().getGrado().getParalelo(),
            ad.getPeriodoAcademico().getId(),
            ad.getPeriodoAcademico().getNombre(),
            ad.getFechaAsignacion(),
            ad.getEstado().name()
        );
    }
}
