package pe.edu.aduniplus.backend.asistencia;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.asistencia.AsistenciaDtos.*;
import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import pe.edu.aduniplus.backend.academico.AsignacionDocenteRepository;
import pe.edu.aduniplus.backend.academico.EstadoMatricula;
import pe.edu.aduniplus.backend.academico.MatriculaRepository;
import pe.edu.aduniplus.backend.persona.*;
import pe.edu.aduniplus.backend.usuario.Usuario;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AsistenciaService {

    private final AsistenciaRepository repository;
    private final AsignacionDocenteRepository asignacionDocenteRepository;
    private final MatriculaRepository matriculaRepository;
    private final PersonaRepository personaRepository;
    private final DocenteRepository docenteRepository;
    private final UsuarioRepository usuarioRepository;

    // --- Estudiantes por curso ---

    @Transactional(readOnly = true)
    public List<AsistenciaResponse> listarPorCursoYFecha(Long asignacionDocenteId, LocalDate fecha) {
        AsignacionDocente ad = asignacionDocenteRepository.findById(asignacionDocenteId)
            .orElseThrow(() -> new IllegalArgumentException("Asignación docente no encontrada"));

        // Obtener estudiantes activos del grado
        List<Long> estudianteIds = matriculaRepository.findByGradoIdAndEstado(
            ad.getCurso().getGrado().getId(), EstadoMatricula.ACTIVO
        ).stream().map(m -> m.getEstudiante().getId()).toList();

        // Obtener registros existentes para esta fecha
        List<Asistencia> existentes = repository.findByAsignacionDocenteIdAndFechaOrderByPersonaNombresAsc(
            asignacionDocenteId, fecha);

        Map<Long, Asistencia> mapExistentes = existentes.stream()
            .collect(Collectors.toMap(a -> a.getPersona().getId(), a -> a));

        List<AsistenciaResponse> result = new ArrayList<>();

        for (Long estId : estudianteIds) {
            Persona p = personaRepository.findById(estId).orElse(null);
            if (p == null) continue;

            Asistencia existente = mapExistentes.get(estId);
            if (existente != null) {
                result.add(toResponse(existente));
            } else {
                // Sin registro aún: mostramos como estado null para que el frontend sepa que está pendiente
                result.add(new AsistenciaResponse(
                    null, p.getId(), p.getNombres() + " " + p.getApellidos(),
                    p instanceof Estudiante e ? e.getCodigoEstudiante() : null,
                    "ESTUDIANTE",
                    fecha, null, null,
                    asignacionDocenteId,
                    ad.getCurso().getMateria().getNombre(),
                    ad.getCurso().getMateria().getNombre(),
                    ad.getPeriodoAcademico().getNombre(),
                    null, null
                ));
            }
        }

        return result;
    }

    @Transactional
    public List<AsistenciaResponse> guardarBatch(AsistenciaBatchRequest request, Long usuarioId) {
        AsignacionDocente ad = asignacionDocenteRepository.findById(request.asignacionDocenteId())
            .orElseThrow(() -> new IllegalArgumentException("Asignación docente no encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        List<AsistenciaResponse> results = new ArrayList<>();

        for (AsistenciaIndividualRequest reg : request.registros()) {
            Persona persona = personaRepository.findById(reg.estudianteId())
                .orElseThrow(() -> new IllegalArgumentException("Persona no encontrada: " + reg.estudianteId()));

            // Buscar si ya existe registro
            Optional<Asistencia> existente = repository.findByPersonaIdAndFechaAndAsignacionDocenteId(
                persona.getId(), request.fecha(), request.asignacionDocenteId());

            Asistencia asistencia;
            if (existente.isPresent()) {
                asistencia = existente.get();
                asistencia.setEstado(reg.estado());
                asistencia.setObservacion(reg.observacion());
                asistencia.setRegistradoPor(usuario);
            } else {
                asistencia = Asistencia.builder()
                    .persona(persona)
                    .fecha(request.fecha())
                    .estado(reg.estado())
                    .asignacionDocente(ad)
                    .observacion(reg.observacion())
                    .registradoPor(usuario)
                    .build();
            }

            results.add(toResponse(repository.save(asistencia)));
        }

        return results;
    }

    // --- Docentes ---

    @Transactional(readOnly = true)
    public List<AsistenciaResponse> listarAsistenciaDocentes(LocalDate fecha) {
        List<Docente> docentes = docenteRepository.findAll();
        List<Asistencia> existentes = repository.findByAsignacionDocenteIdNullAndFecha(fecha);

        Map<Long, Asistencia> mapExistentes = existentes.stream()
            .collect(Collectors.toMap(a -> a.getPersona().getId(), a -> a));

        List<AsistenciaResponse> result = new ArrayList<>();

        for (Docente d : docentes) {
            if (!d.getActivo()) continue;
            Asistencia existente = mapExistentes.get(d.getId());
            if (existente != null) {
                result.add(toResponse(existente));
            } else {
                result.add(new AsistenciaResponse(
                    null, d.getId(), d.getNombres() + " " + d.getApellidos(),
                    d.getCodigoDocente(), "DOCENTE",
                    fecha, null, null,
                    null, null, null, null,
                    null, null
                ));
            }
        }

        return result;
    }

    @Transactional
    public List<AsistenciaResponse> guardarAsistenciaDocentes(AsistenciaDocenteBatchRequest request, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        List<AsistenciaResponse> results = new ArrayList<>();

        for (AsistenciaIndividualRequest reg : request.registros()) {
            Persona persona = personaRepository.findById(reg.estudianteId())
                .orElseThrow(() -> new IllegalArgumentException("Docente no encontrado: " + reg.estudianteId()));

            Optional<Asistencia> existente = repository.findByPersonaIdAndFechaAndAsignacionDocenteId(
                persona.getId(), request.fecha(), null);

            Asistencia asistencia;
            if (existente.isPresent()) {
                asistencia = existente.get();
                asistencia.setEstado(reg.estado());
                asistencia.setObservacion(reg.observacion());
                asistencia.setRegistradoPor(usuario);
            } else {
                asistencia = Asistencia.builder()
                    .persona(persona)
                    .fecha(request.fecha())
                    .estado(reg.estado())
                    .asignacionDocente(null)
                    .observacion(reg.observacion())
                    .registradoPor(usuario)
                    .build();
            }

            results.add(toResponse(repository.save(asistencia)));
        }

        return results;
    }

    // --- Reportes ---

    @Transactional(readOnly = true)
    public List<AsistenciaReporteRow> reportePorCurso(Long asignacionDocenteId, LocalDate desde, LocalDate hasta) {
        List<Object[]> raw = repository.contarPorEstadoPorCurso(asignacionDocenteId, desde, hasta);

        Map<Long, Map<EstadoAsistencia, Long>> grouped = new HashMap<>();
        for (Object[] row : raw) {
            Long personaId = (Long) row[0];
            EstadoAsistencia estado = (EstadoAsistencia) row[1];
            Long count = (Long) row[2];
            grouped.computeIfAbsent(personaId, k -> new HashMap<>()).put(estado, count);
        }

        AsignacionDocente ad = asignacionDocenteRepository.findById(asignacionDocenteId).orElse(null);
        List<Long> estudianteIds = ad != null ? matriculaRepository.findByGradoIdAndEstado(
            ad.getCurso().getGrado().getId(), EstadoMatricula.ACTIVO
        ).stream().map(m -> m.getEstudiante().getId()).toList() : List.of();

        List<AsistenciaReporteRow> report = new ArrayList<>();
        for (Long estId : estudianteIds) {
            Persona p = personaRepository.findById(estId).orElse(null);
            if (p == null) continue;

            Map<EstadoAsistencia, Long> counts = grouped.getOrDefault(estId, new HashMap<>());
            int total = counts.values().stream().mapToInt(Long::intValue).sum();
            int presentes = counts.getOrDefault(EstadoAsistencia.PRESENTE, 0L).intValue();
            int tardanzas = counts.getOrDefault(EstadoAsistencia.TARDANZA, 0L).intValue();
            int faltas = counts.getOrDefault(EstadoAsistencia.FALTA, 0L).intValue();
            int justificados = counts.getOrDefault(EstadoAsistencia.JUSTIFICADO, 0L).intValue();
            double porcentaje = total > 0 ? (double) (presentes + justificados) / total * 100 : 0;

            report.add(new AsistenciaReporteRow(
                estId,
                p.getNombres() + " " + p.getApellidos(),
                p instanceof Estudiante e ? e.getCodigoEstudiante() : null,
                total, presentes, tardanzas, faltas, justificados,
                Math.round(porcentaje * 100.0) / 100.0
            ));
        }

        return report;
    }

    @Transactional(readOnly = true)
    public List<AsistenciaResponse> historialEstudiante(Long estudianteId, Long asignacionDocenteId, LocalDate desde, LocalDate hasta) {
        List<Asistencia> list;
        if (asignacionDocenteId != null) {
            list = repository.findByPersonaIdAndAsignacionDocenteIdAndFechaBetween(
                estudianteId, asignacionDocenteId, desde, hasta);
        } else {
            list = repository.findByPersonaIdAndFechaBetweenOrderByFechaAsc(estudianteId, desde, hasta);
        }
        return list.stream().map(this::toResponse).toList();
    }

    // --- Helper ---

    private AsistenciaResponse toResponse(Asistencia a) {
        String cursoNombre = null, materiaNombre = null, periodoNombre = null;
        if (a.getAsignacionDocente() != null) {
            materiaNombre = a.getAsignacionDocente().getCurso().getMateria().getNombre();
            periodoNombre = a.getAsignacionDocente().getPeriodoAcademico().getNombre();
        }

        String tipoPersona = "PERSONA";
        String codigo = null;
        if (a.getPersona() instanceof Estudiante e) {
            tipoPersona = "ESTUDIANTE";
            codigo = e.getCodigoEstudiante();
        } else if (a.getPersona() instanceof Docente d) {
            tipoPersona = "DOCENTE";
            codigo = d.getCodigoDocente();
        }

        return new AsistenciaResponse(
            a.getId(),
            a.getPersona().getId(),
            a.getPersona().getNombres() + " " + a.getPersona().getApellidos(),
            codigo,
            tipoPersona,
            a.getFecha(),
            a.getHoraIngreso(),
            a.getEstado(),
            a.getAsignacionDocente() != null ? a.getAsignacionDocente().getId() : null,
            cursoNombre,
            materiaNombre,
            periodoNombre,
            a.getObservacion(),
            a.getCreadoEn()
        );
    }
}
