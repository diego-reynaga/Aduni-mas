package pe.edu.aduniplus.backend.notas.importacion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import pe.edu.aduniplus.backend.academico.AsignacionDocenteRepository;
import pe.edu.aduniplus.backend.academico.Curso;
import pe.edu.aduniplus.backend.academico.CursoRepository;
import pe.edu.aduniplus.backend.academico.EstadoAsignacionDocente;
import pe.edu.aduniplus.backend.academico.EstadoMatricula;
import pe.edu.aduniplus.backend.academico.Matricula;
import pe.edu.aduniplus.backend.academico.MatriculaRepository;
import pe.edu.aduniplus.backend.academico.PeriodoAcademico;
import pe.edu.aduniplus.backend.academico.PeriodoAcademicoRepository;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.CompetenciaTrimestreDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ErrorImportacionDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.EstudianteTrimestrePreviewDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.NotaIndividualTrimestreDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasTrimestreMetadataDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasTrimestrePreviewResponse;
import pe.edu.aduniplus.backend.persona.Docente;
import pe.edu.aduniplus.backend.persona.DocenteRepository;
import pe.edu.aduniplus.backend.persona.Estudiante;
import pe.edu.aduniplus.backend.persona.EstudianteRepository;
import pe.edu.aduniplus.backend.persona.Persona;
import pe.edu.aduniplus.backend.security.AuthenticatedUser;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RegistroNotasTrimestreValidacionService {
    private final AsignacionDocenteRepository asignacionDocenteRepository;
    private final CursoRepository cursoRepository;
    private final PeriodoAcademicoRepository periodoAcademicoRepository;
    private final MatriculaRepository matriculaRepository;
    private final EstudianteRepository estudianteRepository;
    private final DocenteRepository docenteRepository;

    RegistroNotasTrimestreValidationResult validar(
        RegistroNotasTrimestreParseResult parsed,
        AuthenticatedUser user,
        Long assignmentId,
        Long cursoId
    ) {
        List<ErrorImportacionDTO> globalErrors = new ArrayList<>(parsed.errores());
        AsignacionDocente assignment = resolveAssignment(parsed, user, assignmentId, cursoId, globalErrors).orElse(null);
        Curso curso = assignment == null ? resolveCurso(cursoId).orElse(null) : assignment.getCurso();
        PeriodoAcademico period = assignment == null ? resolvePeriod(curso, parsed.trimestre()).orElse(null) : assignment.getPeriodoAcademico();

        if (assignment != null) {
            validateTeacherName(parsed.metadata(), assignment, user, globalErrors);
        }

        StudentNameIndex index = buildStudentNameIndex();
        List<RegistroNotasTrimestreValidatedStudent> rows = new ArrayList<>();
        int rowsWithError = 0;

        for (RegistroNotasTrimestreParsedStudent parsedStudent : parsed.estudiantes()) {
            List<ErrorImportacionDTO> rowErrors = new ArrayList<>(parsedStudent.errores());
            Estudiante student = resolveStudent(parsedStudent, index, rowErrors);
            Matricula matricula = student == null || curso == null ? null : resolveEnrollment(parsedStudent, student, curso, rowErrors).orElse(null);
            if (parsedStudent.promedioFinalTrimestre() == null) {
                rowErrors.add(rowError(parsedStudent, "promedioFinalTrimestre", "El estudiante no tiene notas válidas en el trimestre seleccionado."));
            }

            if (!rowErrors.isEmpty()) {
                rowsWithError++;
            }

            rows.add(new RegistroNotasTrimestreValidatedStudent(
                parsedStudent,
                student,
                matricula,
                toPreview(parsedStudent, student, rowErrors)
            ));
        }

        long found = rows.stream().filter((row) -> row.estudiante() != null).count();
        boolean blocked = globalErrors.stream().anyMatch(ErrorImportacionDTO::critico);
        RegistroNotasTrimestrePreviewResponse preview = new RegistroNotasTrimestrePreviewResponse(
            parsed.metadata(),
            parsed.resumen(),
            rows.stream().map(RegistroNotasTrimestreValidatedStudent::preview).toList(),
            List.copyOf(globalErrors),
            blocked
        );

        return new RegistroNotasTrimestreValidationResult(
            parsed,
            preview,
            curso,
            period,
            assignment,
            List.copyOf(rows)
        );
    }

    private Optional<AsignacionDocente> resolveAssignment(
        RegistroNotasTrimestreParseResult parsed,
        AuthenticatedUser user,
        Long assignmentId,
        Long cursoId,
        List<ErrorImportacionDTO> errors
    ) {
        boolean admin = hasRole(user, "ADMINISTRADOR");
        if (assignmentId != null) {
            Optional<AsignacionDocente> assignment = asignacionDocenteRepository.findById(assignmentId)
                .filter((item) -> admin || Objects.equals(item.getDocente().getId(), user.personaId()));
            if (assignment.isEmpty()) {
                errors.add(globalError("idAsignacionDocente", "La asignación docente seleccionada no existe o no pertenece al usuario."));
                return Optional.empty();
            }
            AsignacionDocente selected = assignment.get();
            if (selected.getEstado() != EstadoAsignacionDocente.ACTIVA) {
                errors.add(globalError("idAsignacionDocente", "La asignación docente seleccionada no está activa."));
            }
            if (!matchesPeriod(selected.getPeriodoAcademico(), parsed.trimestre())) {
                errors.add(globalError("trimestre", "La asignación seleccionada no corresponde a " + parsed.trimestre().nombre() + "."));
            }
            return assignment;
        }

        Optional<Curso> course = resolveCurso(cursoId);
        Optional<PeriodoAcademico> period = resolvePeriod(course.orElse(null), parsed.trimestre());
        if (course.isEmpty() || period.isEmpty()) {
            errors.add(globalError("curso", "Debe seleccionar un curso/asignación válida para el trimestre."));
            return Optional.empty();
        }

        Optional<AsignacionDocente> assignment = admin
            ? asignacionDocenteRepository.findByCursoIdAndPeriodoAcademicoId(course.get().getId(), period.get().getId()).stream()
                .filter((item) -> item.getEstado() == EstadoAsignacionDocente.ACTIVA)
                .findFirst()
            : asignacionDocenteRepository.findByDocenteIdAndCursoIdAndPeriodoAcademicoId(
                user.personaId(),
                course.get().getId(),
                period.get().getId()
            ).filter((item) -> item.getEstado() == EstadoAsignacionDocente.ACTIVA);

        if (assignment.isEmpty()) {
            errors.add(globalError("asignacionDocente", "El docente no tiene asignado el curso para " + parsed.trimestre().nombre() + "."));
        }
        return assignment;
    }

    private Optional<Curso> resolveCurso(Long cursoId) {
        if (cursoId == null) {
            return Optional.empty();
        }
        return cursoRepository.findById(cursoId);
    }

    private Optional<PeriodoAcademico> resolvePeriod(Curso curso, PeriodoExcel trimestre) {
        if (curso == null) {
            return Optional.empty();
        }
        Long gestionId = curso.getGrado().getNivelEducativo().getGestionAcademica().getId();
        return periodoAcademicoRepository.findByGestionAcademicaIdOrderByOrdenAsc(gestionId).stream()
            .filter((period) -> matchesPeriod(period, trimestre))
            .findFirst();
    }

    private void validateTeacherName(
        RegistroNotasTrimestreMetadataDTO metadata,
        AsignacionDocente assignment,
        AuthenticatedUser user,
        List<ErrorImportacionDTO> errors
    ) {
        if (hasRole(user, "ADMINISTRADOR")) {
            return;
        }
        Optional<Docente> docente = docenteRepository.findById(user.personaId());
        if (docente.isEmpty()) {
            errors.add(globalError("docente", "El usuario autenticado no está registrado como docente."));
            return;
        }
        if (!NombreNormalizador.mismosTokens(metadata.docente(), fullName(docente.get()))) {
            errors.add(globalError("docente", "El docente del Excel no coincide con el docente autenticado."));
        }
        if (!Objects.equals(assignment.getDocente().getId(), user.personaId())) {
            errors.add(globalError("docente", "La asignación seleccionada no pertenece al docente autenticado."));
        }
    }

    private Estudiante resolveStudent(
        RegistroNotasTrimestreParsedStudent row,
        StudentNameIndex index,
        List<ErrorImportacionDTO> errors
    ) {
        String normalized = NombreNormalizador.normalizar(row.nombreExcel());
        if (index.ambiguousNames().contains(normalized)) {
            errors.add(rowError(row, "estudiante", "El nombre coincide con más de un estudiante y requiere mapeo manual."));
            return null;
        }

        Estudiante student = index.studentsByName().get(normalized);
        if (student == null) {
            errors.add(rowError(row, "estudiante", "Estudiante no encontrado en la base de datos."));
            return null;
        }
        if (!Boolean.TRUE.equals(student.getActivo())) {
            errors.add(rowError(row, "estudiante", "El estudiante está inactivo."));
            return null;
        }
        return student;
    }

    private Optional<Matricula> resolveEnrollment(
        RegistroNotasTrimestreParsedStudent row,
        Estudiante student,
        Curso curso,
        List<ErrorImportacionDTO> errors
    ) {
        Optional<Matricula> enrollment = matriculaRepository.findByEstudianteIdAndGradoId(student.getId(), curso.getGrado().getId())
            .filter((item) -> item.getEstado() == EstadoMatricula.ACTIVA);
        if (enrollment.isEmpty()) {
            errors.add(rowError(row, "matricula", "El estudiante no tiene matrícula activa en el grado detectado."));
        }
        return enrollment;
    }

    private EstudianteTrimestrePreviewDTO toPreview(
        RegistroNotasTrimestreParsedStudent parsed,
        Estudiante student,
        List<ErrorImportacionDTO> rowErrors
    ) {
        return new EstudianteTrimestrePreviewDTO(
            parsed.filaExcel(),
            parsed.numeroOrden(),
            parsed.nombreExcel(),
            student == null ? null : student.getId(),
            student == null ? null : student.getCodigoEstudiante(),
            student == null ? "NO_ENCONTRADO" : "ENCONTRADO",
            parsed.competencias().stream()
                .map((competence) -> new CompetenciaTrimestreDTO(
                    competence.numero(),
                    competence.nombre(),
                    competence.notas().stream()
                        .map((note) -> new NotaIndividualTrimestreDTO(note.columnaExcel(), note.nombreNota(), note.valor()))
                        .toList(),
                    competence.promedioCompetencia(),
                    competence.logroLiteral()
                ))
                .toList(),
            parsed.promedioFinalTrimestre(),
            parsed.logroFinalTrimestre(),
            List.copyOf(rowErrors)
        );
    }

    private StudentNameIndex buildStudentNameIndex() {
        Map<String, Estudiante> studentsByName = new LinkedHashMap<>();
        Set<String> ambiguousNames = new HashSet<>();
        for (Estudiante student : estudianteRepository.findAll()) {
            indexStudentName(studentsByName, ambiguousNames, fullName(student), student);
            indexStudentName(studentsByName, ambiguousNames, student.getNombres() + " " + student.getApellidos(), student);
        }
        return new StudentNameIndex(studentsByName, ambiguousNames);
    }

    private void indexStudentName(
        Map<String, Estudiante> studentsByName,
        Set<String> ambiguousNames,
        String name,
        Estudiante student
    ) {
        String normalized = NombreNormalizador.normalizar(name);
        if (normalized.isBlank()) {
            return;
        }
        Estudiante existing = studentsByName.get(normalized);
        if (existing != null && !Objects.equals(existing.getId(), student.getId())) {
            studentsByName.remove(normalized);
            ambiguousNames.add(normalized);
            return;
        }
        if (!ambiguousNames.contains(normalized)) {
            studentsByName.put(normalized, student);
        }
    }

    private boolean matchesPeriod(PeriodoAcademico period, PeriodoExcel expected) {
        if (period == null) {
            return false;
        }
        if (period.getOrden() != null && period.getOrden() == expected.orden()) {
            return true;
        }
        String normalized = NombreNormalizador.normalizar(period.getNombre());
        return switch (expected) {
            case I_TRIMESTRE -> normalized.equals("I TRIMESTRE") || normalized.contains("PRIMER") || normalized.equals("1 TRIMESTRE");
            case II_TRIMESTRE -> normalized.equals("II TRIMESTRE") || normalized.contains("SEGUNDO") || normalized.equals("2 TRIMESTRE");
            case III_TRIMESTRE -> normalized.equals("III TRIMESTRE") || normalized.contains("TERCER") || normalized.equals("3 TRIMESTRE");
            case ANUAL -> normalized.contains("ANUAL");
        };
    }

    private boolean hasRole(AuthenticatedUser user, String role) {
        return user != null && user.roles().stream().anyMatch(role::equals);
    }

    private String fullName(Persona person) {
        return (safe(person.getApellidos()) + " " + safe(person.getNombres())).replaceAll("\\s+", " ").trim();
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private ErrorImportacionDTO globalError(String field, String description) {
        return new ErrorImportacionDTO(null, null, field, description, true);
    }

    private ErrorImportacionDTO rowError(RegistroNotasTrimestreParsedStudent row, String field, String description) {
        return new ErrorImportacionDTO(row.filaExcel(), row.nombreExcel(), field, description, false);
    }

    private record StudentNameIndex(Map<String, Estudiante> studentsByName, Set<String> ambiguousNames) {}
}
