package pe.edu.aduniplus.backend.notas.importacion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import pe.edu.aduniplus.backend.academico.AsignacionDocenteRepository;
import pe.edu.aduniplus.backend.academico.Curso;
import pe.edu.aduniplus.backend.academico.CursoRepository;
import pe.edu.aduniplus.backend.academico.EstadoAsignacionDocente;
import pe.edu.aduniplus.backend.academico.EstadoMatricula;
import pe.edu.aduniplus.backend.academico.Grado;
import pe.edu.aduniplus.backend.academico.GradoRepository;
import pe.edu.aduniplus.backend.academico.Materia;
import pe.edu.aduniplus.backend.academico.MateriaRepository;
import pe.edu.aduniplus.backend.academico.MatriculaRepository;
import pe.edu.aduniplus.backend.academico.PeriodoAcademico;
import pe.edu.aduniplus.backend.academico.PeriodoAcademicoRepository;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ErrorImportacionDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.EstudianteNotaPreviewDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasMetadataDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasPreviewResponse;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasResumenDTO;
import pe.edu.aduniplus.backend.persona.Docente;
import pe.edu.aduniplus.backend.persona.DocenteRepository;
import pe.edu.aduniplus.backend.persona.Estudiante;
import pe.edu.aduniplus.backend.persona.EstudianteRepository;
import pe.edu.aduniplus.backend.persona.Persona;
import pe.edu.aduniplus.backend.security.AuthenticatedUser;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RegistroNotasValidacionService {
    private final MateriaRepository materiaRepository;
    private final GradoRepository gradoRepository;
    private final CursoRepository cursoRepository;
    private final PeriodoAcademicoRepository periodoAcademicoRepository;
    private final AsignacionDocenteRepository asignacionDocenteRepository;
    private final EstudianteRepository estudianteRepository;
    private final MatriculaRepository matriculaRepository;
    private final DocenteRepository docenteRepository;

    RegistroNotasValidationResult validar(RegistroNotasParseResult parsed, AuthenticatedUser user) {
        List<ErrorImportacionDTO> globalErrors = new ArrayList<>(parsed.errores());
        RegistroNotasMetadataDTO metadata = parsed.metadata();

        Curso curso = resolveCourse(metadata, globalErrors).orElse(null);
        Map<PeriodoExcel, PeriodoAcademico> periodos = resolvePeriods(curso, globalErrors);
        Map<PeriodoExcel, AsignacionDocente> asignaciones = resolveAssignments(curso, periodos, user, metadata, globalErrors);

        StudentNameIndex studentNameIndex = buildStudentNameIndex();
        List<RegistroNotasValidatedStudent> rows = new ArrayList<>();
        int found = 0;
        int notFound = 0;
        int rowsWithError = 0;
        int importable = 0;

        for (RegistroNotasParsedStudent studentRow : parsed.estudiantes()) {
            List<ErrorImportacionDTO> rowErrors = new ArrayList<>(studentRow.errores());
            Estudiante student = resolveStudent(studentRow, studentNameIndex, rowErrors);
            if (student == null) {
                notFound++;
            } else {
                found++;
                validateEnrollment(studentRow, student, curso, rowErrors);
            }

            if (studentRow.notas().isEmpty()) {
                rowErrors.add(rowError(studentRow, "notas", "La fila no contiene notas numéricas evaluables."));
            }

            if (!rowErrors.isEmpty()) {
                rowsWithError++;
            } else if (student != null) {
                importable++;
            }

            EstudianteNotaPreviewDTO previewRow = new EstudianteNotaPreviewDTO(
                studentRow.filaExcel(),
                studentRow.numeroOrden(),
                studentRow.nombreExcel(),
                student == null ? null : student.getId(),
                student == null ? null : student.getCodigoEstudiante(),
                student == null ? "NO_ENCONTRADO" : "ENCONTRADO",
                studentRow.notas().get(PeriodoExcel.I_TRIMESTRE),
                studentRow.notas().get(PeriodoExcel.II_TRIMESTRE),
                studentRow.notas().get(PeriodoExcel.III_TRIMESTRE),
                studentRow.promedioAnual(),
                studentRow.logroLiteral(),
                studentRow.situacionFinal(),
                List.copyOf(rowErrors)
            );
            rows.add(new RegistroNotasValidatedStudent(studentRow, student, previewRow));
        }

        boolean blocked = globalErrors.stream().anyMatch(ErrorImportacionDTO::critico);
        RegistroNotasPreviewResponse preview = new RegistroNotasPreviewResponse(
            metadata,
            new RegistroNotasResumenDTO(parsed.estudiantes().size(), found, notFound, rowsWithError, importable),
            rows.stream().map(RegistroNotasValidatedStudent::preview).toList(),
            List.copyOf(globalErrors),
            blocked
        );

        return new RegistroNotasValidationResult(
            parsed,
            preview,
            curso,
            Map.copyOf(periodos),
            Map.copyOf(asignaciones),
            List.copyOf(rows)
        );
    }

    private Optional<Curso> resolveCourse(RegistroNotasMetadataDTO metadata, List<ErrorImportacionDTO> errors) {
        Optional<Materia> materia = materiaRepository.findAll().stream()
            .filter((item) -> same(item.getNombre(), metadata.areaCurricular()))
            .findFirst();
        if (materia.isEmpty()) {
            errors.add(globalError("areaCurricular", "No se encontró una asignatura/materia para el área " + metadata.areaCurricular() + "."));
            return Optional.empty();
        }

        Optional<Grado> grado = gradoRepository.findAll().stream()
            .filter((item) -> same(item.getNombre(), metadata.grado()) && same(item.getParalelo(), metadata.seccion()))
            .findFirst();
        if (grado.isEmpty()) {
            errors.add(globalError("grado", "No se encontró el aula/grado " + metadata.grado() + " sección " + metadata.seccion() + "."));
            return Optional.empty();
        }

        Optional<Curso> curso = cursoRepository.findByGradoIdAndMateriaId(grado.get().getId(), materia.get().getId());
        if (curso.isEmpty()) {
            errors.add(globalError("curso", "No existe un curso para " + metadata.areaCurricular() + " en " + metadata.grado() + " " + metadata.seccion() + "."));
        }
        return curso;
    }

    private Map<PeriodoExcel, PeriodoAcademico> resolvePeriods(Curso curso, List<ErrorImportacionDTO> errors) {
        Map<PeriodoExcel, PeriodoAcademico> result = new EnumMap<>(PeriodoExcel.class);
        if (curso == null) {
            return result;
        }

        Long gestionId = curso.getGrado().getNivelEducativo().getGestionAcademica().getId();
        List<PeriodoAcademico> periods = periodoAcademicoRepository.findByGestionAcademicaIdOrderByOrdenAsc(gestionId);
        for (PeriodoExcel expected : PeriodoExcel.values()) {
            Optional<PeriodoAcademico> period = periods.stream()
                .filter((item) -> matchesPeriod(item, expected))
                .findFirst();
            if (period.isPresent()) {
                result.put(expected, period.get());
            } else {
                errors.add(globalError("periodo", "No se encontró el periodo académico " + expected.nombre() + " para la gestión del curso."));
            }
        }
        return result;
    }

    private Map<PeriodoExcel, AsignacionDocente> resolveAssignments(
        Curso curso,
        Map<PeriodoExcel, PeriodoAcademico> periodos,
        AuthenticatedUser user,
        RegistroNotasMetadataDTO metadata,
        List<ErrorImportacionDTO> errors
    ) {
        Map<PeriodoExcel, AsignacionDocente> result = new EnumMap<>(PeriodoExcel.class);
        if (curso == null || periodos.isEmpty()) {
            return result;
        }

        boolean admin = hasRole(user, "ADMINISTRADOR");
        if (!admin) {
            Optional<Docente> docente = docenteRepository.findById(user.personaId());
            if (docente.isEmpty()) {
                errors.add(globalError("docente", "El usuario autenticado no está registrado como docente."));
                return result;
            }
            String docenteSistema = fullName(docente.get());
            if (!NombreNormalizador.mismosTokens(metadata.docente(), docenteSistema)) {
                errors.add(globalError("docente", "El docente del Excel no coincide con el docente autenticado."));
            }
        }

        for (Map.Entry<PeriodoExcel, PeriodoAcademico> entry : periodos.entrySet()) {
            Optional<AsignacionDocente> assignment = admin
                ? asignacionDocenteRepository.findByCursoIdAndPeriodoAcademicoId(curso.getId(), entry.getValue().getId()).stream()
                    .filter((item) -> item.getEstado() == EstadoAsignacionDocente.ACTIVA)
                    .findFirst()
                : asignacionDocenteRepository.findByDocenteIdAndCursoIdAndPeriodoAcademicoId(
                    user.personaId(),
                    curso.getId(),
                    entry.getValue().getId()
                ).filter((item) -> item.getEstado() == EstadoAsignacionDocente.ACTIVA);

            if (assignment.isPresent()) {
                result.put(entry.getKey(), assignment.get());
            } else {
                errors.add(globalError(
                    "asignacionDocente",
                    "No existe una asignación docente activa para " + curso.getMateria().getNombre() + " en " + entry.getKey().nombre() + "."
                ));
            }
        }
        return result;
    }

    private Estudiante resolveStudent(
        RegistroNotasParsedStudent row,
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

    private void validateEnrollment(
        RegistroNotasParsedStudent row,
        Estudiante student,
        Curso curso,
        List<ErrorImportacionDTO> errors
    ) {
        if (curso == null) {
            return;
        }
        boolean hasActiveEnrollment = matriculaRepository.findByEstudianteIdAndGradoId(student.getId(), curso.getGrado().getId())
            .filter((item) -> item.getEstado() == EstadoMatricula.ACTIVA)
            .isPresent();
        if (!hasActiveEnrollment) {
            errors.add(rowError(row, "matricula", "El estudiante no tiene matrícula activa en el grado detectado."));
        }
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
        if (period.getOrden() != null && period.getOrden() == expected.orden()) {
            return true;
        }
        String normalized = NombreNormalizador.normalizar(period.getNombre());
        return switch (expected) {
            case I_TRIMESTRE -> normalized.equals("I TRIMESTRE")
                || normalized.contains("PRIMER")
                || normalized.equals("1 TRIMESTRE");
            case II_TRIMESTRE -> normalized.equals("II TRIMESTRE")
                || normalized.contains("SEGUNDO")
                || normalized.equals("2 TRIMESTRE");
            case III_TRIMESTRE -> normalized.equals("III TRIMESTRE")
                || normalized.contains("TERCER")
                || normalized.equals("3 TRIMESTRE");
            case ANUAL -> normalized.contains("ANUAL");
        };
    }

    private boolean same(String left, String right) {
        return NombreNormalizador.normalizar(left).equals(NombreNormalizador.normalizar(right));
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

    private ErrorImportacionDTO rowError(RegistroNotasParsedStudent row, String field, String description) {
        return new ErrorImportacionDTO(row.filaExcel(), row.nombreExcel(), field, description, false);
    }

    private record StudentNameIndex(Map<String, Estudiante> studentsByName, Set<String> ambiguousNames) {}
}
