package pe.edu.aduniplus.backend.academico;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.AcademicoDtos.*;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AcademicoService {

    private final GestionAcademicaRepository gestionAcademicaRepository;
    private final NivelEducativoRepository nivelEducativoRepository;
    private final GradoRepository gradoRepository;
    private final MateriaRepository materiaRepository;
    private final CursoRepository cursoRepository;
    private final PeriodoAcademicoRepository periodoAcademicoRepository;

    // --- Niveles Educativos ---

    @Transactional(readOnly = true)
    public List<NivelEducativoResponse> listarNiveles() {
        return nivelEducativoRepository.findAll().stream()
            .map(this::toNivelResponse)
            .toList();
    }

    @Transactional
    public NivelEducativoResponse crearNivelEducativo(NivelEducativoRequest req) {
        GestionAcademica gestion = gestionAcademicaRepository.findById(req.gestionAcademicaId())
            .orElseThrow(() -> new RuntimeException("Gestión Académica no encontrada"));

        if (nivelEducativoRepository.existsByGestionAcademicaIdAndNombreAndTurno(gestion.getId(), req.nombre(), req.turno())) {
            throw new IllegalArgumentException("Ya existe un nivel educativo con este nombre y turno para la gestión académica seleccionada");
        }

        NivelEducativo nivel = new NivelEducativo();
        nivel.setNombre(req.nombre());
        nivel.setTurno(req.turno());
        nivel.setDescripcion(req.descripcion());
        nivel.setActivo(req.activo());
        nivel.setGestionAcademica(gestion);

        return toNivelResponse(nivelEducativoRepository.save(nivel));
    }

    @Transactional
    public NivelEducativoResponse actualizarNivelEducativo(Long id, NivelEducativoRequest req) {
        NivelEducativo nivel = nivelEducativoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Nivel Educativo no encontrado"));

        GestionAcademica gestion = gestionAcademicaRepository.findById(req.gestionAcademicaId())
            .orElseThrow(() -> new RuntimeException("Gestión Académica no encontrada"));

        // Verificar unicidad solo si cambió el nombre, turno o gestión
        if (!nivel.getNombre().equals(req.nombre()) || !nivel.getTurno().equals(req.turno()) || !nivel.getGestionAcademica().getId().equals(gestion.getId())) {
            if (nivelEducativoRepository.existsByGestionAcademicaIdAndNombreAndTurno(gestion.getId(), req.nombre(), req.turno())) {
                throw new IllegalArgumentException("Ya existe un nivel educativo con este nombre y turno para la gestión académica seleccionada");
            }
        }

        nivel.setNombre(req.nombre());
        nivel.setTurno(req.turno());
        nivel.setDescripcion(req.descripcion());
        nivel.setActivo(req.activo());
        nivel.setGestionAcademica(gestion);

        return toNivelResponse(nivelEducativoRepository.save(nivel));
    }

    @Transactional
    public void eliminarNivelEducativo(Long id) {
        NivelEducativo nivel = nivelEducativoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Nivel Educativo no encontrado"));
        // Soft delete
        nivel.setActivo(false);
        nivelEducativoRepository.save(nivel);
    }

    // --- Grados ---

    @Transactional(readOnly = true)
    public List<GradoResponse> listarGradosPorNivel(Long nivelId) {
        return gradoRepository.findByNivelEducativoId(nivelId).stream()
            .map(this::toGradoResponse)
            .toList();
    }

    @Transactional
    public GradoResponse crearGrado(GradoRequest req) {
        NivelEducativo nivel = nivelEducativoRepository.findById(req.nivelEducativoId())
            .orElseThrow(() -> new RuntimeException("Nivel Educativo no encontrado"));

        if (gradoRepository.existsByNivelEducativoIdAndNombreAndParalelo(nivel.getId(), req.nombre(), req.paralelo())) {
            throw new IllegalArgumentException("Ya existe un grado con este nombre y paralelo en el nivel seleccionado");
        }

        Grado grado = new Grado();
        grado.setNombre(req.nombre());
        grado.setParalelo(req.paralelo());
        grado.setActivo(req.activo());
        grado.setNivelEducativo(nivel);

        return toGradoResponse(gradoRepository.save(grado));
    }

    @Transactional
    public GradoResponse actualizarGrado(Long id, GradoRequest req) {
        Grado grado = gradoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Grado no encontrado"));
        
        NivelEducativo nivel = nivelEducativoRepository.findById(req.nivelEducativoId())
            .orElseThrow(() -> new RuntimeException("Nivel Educativo no encontrado"));

        if (!grado.getNombre().equals(req.nombre()) || !grado.getParalelo().equals(req.paralelo()) || !grado.getNivelEducativo().getId().equals(nivel.getId())) {
             if (gradoRepository.existsByNivelEducativoIdAndNombreAndParalelo(nivel.getId(), req.nombre(), req.paralelo())) {
                throw new IllegalArgumentException("Ya existe un grado con este nombre y paralelo en el nivel seleccionado");
            }
        }

        grado.setNombre(req.nombre());
        grado.setParalelo(req.paralelo());
        grado.setActivo(req.activo());
        grado.setNivelEducativo(nivel);

        return toGradoResponse(gradoRepository.save(grado));
    }

    @Transactional
    public void eliminarGrado(Long id) {
        Grado grado = gradoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Grado no encontrado"));
        grado.setActivo(false);
        gradoRepository.save(grado);
    }

    // --- Materias ---

    @Transactional(readOnly = true)
    public List<MateriaResponse> listarMaterias() {
        return materiaRepository.findAll().stream()
            .map(this::toMateriaResponse)
            .toList();
    }

    @Transactional
    public MateriaResponse crearMateria(MateriaRequest req) {
        if (materiaRepository.existsByNombre(req.nombre())) {
            throw new IllegalArgumentException("Ya existe una materia con el nombre: " + req.nombre());
        }
        if (materiaRepository.findByCodigo(req.codigo()).isPresent()) {
             throw new IllegalArgumentException("Ya existe una materia con el código: " + req.codigo());
        }

        Materia materia = new Materia();
        materia.setCodigo(req.codigo());
        materia.setNombre(req.nombre());
        materia.setArea(req.area());
        materia.setActiva(req.activa());

        return toMateriaResponse(materiaRepository.save(materia));
    }

    @Transactional
    public MateriaResponse actualizarMateria(Long id, MateriaRequest req) {
        Materia materia = materiaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Materia no encontrada"));

        if (!materia.getNombre().equals(req.nombre()) && materiaRepository.existsByNombre(req.nombre())) {
            throw new IllegalArgumentException("Ya existe una materia con el nombre: " + req.nombre());
        }
        if (!materia.getCodigo().equals(req.codigo()) && materiaRepository.findByCodigo(req.codigo()).isPresent()) {
             throw new IllegalArgumentException("Ya existe una materia con el código: " + req.codigo());
        }

        materia.setCodigo(req.codigo());
        materia.setNombre(req.nombre());
        materia.setArea(req.area());
        materia.setActiva(req.activa());

        return toMateriaResponse(materiaRepository.save(materia));
    }

    @Transactional
    public void eliminarMateria(Long id) {
        Materia materia = materiaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Materia no encontrada"));
        materia.setActiva(false);
        materiaRepository.save(materia);
    }

    // --- Cursos (Oferta Educativa) ---

    @Transactional(readOnly = true)
    public List<CursoResponse> listarCursosPorGrado(Long gradoId) {
        return cursoRepository.findByGradoId(gradoId).stream()
            .map(this::toCursoResponse)
            .toList();
    }

    @Transactional
    public void asignarCursosAGrado(CursoAsignacionMasivaRequest req) {
        Grado grado = gradoRepository.findById(req.gradoId())
            .orElseThrow(() -> new RuntimeException("Grado no encontrado"));

        for (Long materiaId : req.materiasIds()) {
            if (cursoRepository.existsByGradoIdAndMateriaId(grado.getId(), materiaId)) {
                throw new IllegalArgumentException("Conflicto detectado: La materia con ID " + materiaId + " ya está asignada a este grado. Operación revertida.");
            }
            
            Materia materia = materiaRepository.findById(materiaId)
                .orElseThrow(() -> new RuntimeException("Materia no encontrada con ID: " + materiaId));
            
            Curso curso = new Curso();
            curso.setGrado(grado);
            curso.setMateria(materia);
            curso.setActivo(true);
            cursoRepository.save(curso);
        }
    }

    @Transactional
    public void removerCurso(Long id) {
        Curso curso = cursoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Curso no encontrado"));
        cursoRepository.delete(curso);
    }


    // --- Helpers Mappers ---

    private NivelEducativoResponse toNivelResponse(NivelEducativo nivel) {
        return new NivelEducativoResponse(
            nivel.getId(),
            nivel.getNombre(),
            nivel.getTurno() != null ? nivel.getTurno().name() : null,
            nivel.getDescripcion(),
            nivel.getActivo(),
            nivel.getGestionAcademica() != null ? nivel.getGestionAcademica().getId() : null
        );
    }

    private GradoResponse toGradoResponse(Grado grado) {
        return new GradoResponse(
            grado.getId(),
            grado.getNombre(),
            grado.getParalelo(),
            grado.getActivo(),
            grado.getNivelEducativo() != null ? grado.getNivelEducativo().getId() : null,
            grado.getNivelEducativo() != null ? grado.getNivelEducativo().getNombre() + " " + grado.getNivelEducativo().getTurno() : null
        );
    }

    private MateriaResponse toMateriaResponse(Materia materia) {
        return new MateriaResponse(
            materia.getId(),
            materia.getCodigo(),
            materia.getNombre(),
            materia.getArea(),
            materia.getActiva()
        );
    }

    private CursoResponse toCursoResponse(Curso curso) {
        return new CursoResponse(
            curso.getId(),
            curso.getGrado().getId(),
            curso.getGrado().getNombre() + " " + curso.getGrado().getParalelo(),
            curso.getGrado().getParalelo(),
            curso.getMateria().getId(),
            curso.getMateria().getCodigo(),
            curso.getMateria().getNombre(),
            curso.getMateria().getArea(),
            curso.getActivo()
        );
    }

    // --- Gestiones Academicas ---

    @Transactional(readOnly = true)
    public List<GestionAcademicaResponse> listarGestiones() {
        return gestionAcademicaRepository.findAll().stream()
            .map(this::toGestionResponse)
            .toList();
    }

    @Transactional
    public GestionAcademicaResponse crearGestion(GestionAcademicaRequest req) {
        if (gestionAcademicaRepository.existsByAnio(req.anio())) {
            throw new RuntimeException("Ya existe una gestión académica para el año: " + req.anio());
        }
        
        if (req.fechaInicio().isAfter(req.fechaFin())) {
            throw new RuntimeException("La fecha de inicio no puede ser posterior a la fecha de fin");
        }

        if (Boolean.TRUE.equals(req.activa())) {
            desactivarGestionesActuales();
        }

        GestionAcademica gestion = new GestionAcademica();
        gestion.setAnio(req.anio());
        gestion.setNombre(req.nombre());
        gestion.setFechaInicio(req.fechaInicio());
        gestion.setFechaFin(req.fechaFin());
        gestion.setActiva(req.activa());

        return toGestionResponse(gestionAcademicaRepository.save(gestion));
    }

    @Transactional
    public GestionAcademicaResponse actualizarGestion(Long id, GestionAcademicaRequest req) {
        GestionAcademica gestion = gestionAcademicaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Gestión académica no encontrada"));

        if (!gestion.getAnio().equals(req.anio()) && gestionAcademicaRepository.existsByAnio(req.anio())) {
            throw new RuntimeException("Ya existe una gestión académica para el año: " + req.anio());
        }

        if (req.fechaInicio().isAfter(req.fechaFin())) {
            throw new RuntimeException("La fecha de inicio no puede ser posterior a la fecha de fin");
        }

        if (Boolean.TRUE.equals(req.activa()) && !Boolean.TRUE.equals(gestion.getActiva())) {
            desactivarGestionesActuales();
        }

        gestion.setAnio(req.anio());
        gestion.setNombre(req.nombre());
        gestion.setFechaInicio(req.fechaInicio());
        gestion.setFechaFin(req.fechaFin());
        gestion.setActiva(req.activa());

        return toGestionResponse(gestionAcademicaRepository.save(gestion));
    }

    private void desactivarGestionesActuales() {
        gestionAcademicaRepository.findByActivaTrue().ifPresent(gestion -> {
            gestion.setActiva(false);
            gestionAcademicaRepository.save(gestion);
        });
    }

    @Transactional
    public void clonarEstructuraAcademica(ClonarEstructuraRequest req) {
        GestionAcademica origen = gestionAcademicaRepository.findById(req.gestionOrigenId())
            .orElseThrow(() -> new IllegalArgumentException("Gestión origen no encontrada"));
        GestionAcademica destino = gestionAcademicaRepository.findById(req.gestionDestinoId())
            .orElseThrow(() -> new IllegalArgumentException("Gestión destino no encontrada"));

        List<NivelEducativo> nivelesOrigen = nivelEducativoRepository.findAll().stream()
            .filter(n -> n.getGestionAcademica().getId().equals(origen.getId()) && n.getActivo())
            .toList();

        for (NivelEducativo nivelOrigen : nivelesOrigen) {
            // Verificar si el nivel ya existe en destino
            if (!nivelEducativoRepository.existsByGestionAcademicaIdAndNombreAndTurno(destino.getId(), nivelOrigen.getNombre(), nivelOrigen.getTurno())) {
                NivelEducativo nivelDestino = new NivelEducativo();
                nivelDestino.setNombre(nivelOrigen.getNombre());
                nivelDestino.setTurno(nivelOrigen.getTurno());
                nivelDestino.setDescripcion(nivelOrigen.getDescripcion());
                nivelDestino.setActivo(true);
                nivelDestino.setGestionAcademica(destino);
                nivelDestino = nivelEducativoRepository.save(nivelDestino);

                // Clonar grados activos
                List<Grado> gradosOrigen = gradoRepository.findByNivelEducativoId(nivelOrigen.getId()).stream()
                    .filter(Grado::getActivo)
                    .toList();

                for (Grado gradoOrigen : gradosOrigen) {
                    Grado gradoDestino = new Grado();
                    gradoDestino.setNombre(gradoOrigen.getNombre());
                    gradoDestino.setParalelo(gradoOrigen.getParalelo());
                    gradoDestino.setActivo(true);
                    gradoDestino.setNivelEducativo(nivelDestino);
                    gradoDestino = gradoRepository.save(gradoDestino);

                    // Clonar cursos (materias)
                    List<Curso> cursosOrigen = cursoRepository.findByGradoId(gradoOrigen.getId()).stream()
                        .filter(Curso::getActivo)
                        .toList();

                    for (Curso cursoOrigen : cursosOrigen) {
                        Curso cursoDestino = new Curso();
                        cursoDestino.setGrado(gradoDestino);
                        cursoDestino.setMateria(cursoOrigen.getMateria()); // Materia es global
                        cursoDestino.setActivo(true);
                        cursoRepository.save(cursoDestino);
                    }
                }
            }
        }
    }

    // --- Periodos Academicos ---

    @Transactional(readOnly = true)
    public List<PeriodoAcademicoResponse> listarPeriodosPorGestion(Long gestionId) {
        return periodoAcademicoRepository.findByGestionAcademicaIdOrderByOrdenAsc(gestionId).stream()
            .map(this::toPeriodoResponse)
            .toList();
    }

    @Transactional
    public PeriodoAcademicoResponse crearPeriodo(PeriodoAcademicoRequest req) {
        GestionAcademica gestion = gestionAcademicaRepository.findById(req.gestionAcademicaId())
            .orElseThrow(() -> new RuntimeException("Gestión académica no encontrada"));

        if (periodoAcademicoRepository.existsByGestionAcademicaIdAndNombre(gestion.getId(), req.nombre())) {
            throw new RuntimeException("Ya existe un periodo con ese nombre en la gestión seleccionada");
        }

        validarSolapamientoPeriodos(gestion.getId(), null, req.fechaInicio(), req.fechaFin());

        PeriodoAcademico periodo = new PeriodoAcademico();
        periodo.setNombre(req.nombre());
        periodo.setOrden(req.orden());
        periodo.setFechaInicio(req.fechaInicio());
        periodo.setFechaFin(req.fechaFin());
        periodo.setCerrado(req.cerrado());
        periodo.setGestionAcademica(gestion);

        return toPeriodoResponse(periodoAcademicoRepository.save(periodo));
    }

    @Transactional
    public PeriodoAcademicoResponse actualizarPeriodo(Long id, PeriodoAcademicoRequest req) {
        PeriodoAcademico periodo = periodoAcademicoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Periodo académico no encontrado"));
            
        GestionAcademica gestion = gestionAcademicaRepository.findById(req.gestionAcademicaId())
            .orElseThrow(() -> new RuntimeException("Gestión académica no encontrada"));

        if (!periodo.getNombre().equals(req.nombre()) && periodoAcademicoRepository.existsByGestionAcademicaIdAndNombre(gestion.getId(), req.nombre())) {
            throw new RuntimeException("Ya existe un periodo con ese nombre en la gestión seleccionada");
        }

        validarSolapamientoPeriodos(gestion.getId(), periodo.getId(), req.fechaInicio(), req.fechaFin());

        periodo.setNombre(req.nombre());
        periodo.setOrden(req.orden());
        periodo.setFechaInicio(req.fechaInicio());
        periodo.setFechaFin(req.fechaFin());
        periodo.setCerrado(req.cerrado());
        periodo.setGestionAcademica(gestion);

        return toPeriodoResponse(periodoAcademicoRepository.save(periodo));
    }

    private GestionAcademicaResponse toGestionResponse(GestionAcademica gestion) {
        return new GestionAcademicaResponse(
            gestion.getId(),
            gestion.getAnio(),
            gestion.getNombre(),
            gestion.getFechaInicio(),
            gestion.getFechaFin(),
            gestion.getActiva()
        );
    }

    private PeriodoAcademicoResponse toPeriodoResponse(PeriodoAcademico periodo) {
        return new PeriodoAcademicoResponse(
            periodo.getId(),
            periodo.getNombre(),
            periodo.getOrden(),
            periodo.getFechaInicio(),
            periodo.getFechaFin(),
            periodo.getCerrado(),
            periodo.getGestionAcademica() != null ? periodo.getGestionAcademica().getId() : null
        );
    }

    private void validarSolapamientoPeriodos(Long gestionId, Long periodoIdAExcluir, java.time.LocalDate inicio, java.time.LocalDate fin) {
        if (inicio.isAfter(fin)) {
            throw new RuntimeException("La fecha de inicio no puede ser posterior a la fecha de fin");
        }
        List<PeriodoAcademico> periodos = periodoAcademicoRepository.findByGestionAcademicaIdOrderByOrdenAsc(gestionId);
        for (PeriodoAcademico p : periodos) {
            if (periodoIdAExcluir != null && p.getId().equals(periodoIdAExcluir)) {
                continue;
            }
            if (!inicio.isAfter(p.getFechaFin()) && !fin.isBefore(p.getFechaInicio())) {
                throw new RuntimeException("Las fechas se solapan con el periodo: " + p.getNombre());
            }
        }
    }
}
