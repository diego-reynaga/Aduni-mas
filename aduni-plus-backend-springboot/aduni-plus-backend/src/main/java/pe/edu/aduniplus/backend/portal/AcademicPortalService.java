package pe.edu.aduniplus.backend.portal;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.aduniplus.backend.asistencia.Asistencia;
import pe.edu.aduniplus.backend.asistencia.AsistenciaRepository;
import pe.edu.aduniplus.backend.asistencia.EstadoAsistencia;
import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import pe.edu.aduniplus.backend.academico.AsignacionDocenteRepository;
import pe.edu.aduniplus.backend.academico.Curso;
import pe.edu.aduniplus.backend.academico.CursoRepository;
import pe.edu.aduniplus.backend.academico.EstadoAsignacionDocente;
import pe.edu.aduniplus.backend.academico.EstadoMatricula;
import pe.edu.aduniplus.backend.academico.Grado;
import pe.edu.aduniplus.backend.academico.GradoRepository;
import pe.edu.aduniplus.backend.academico.Matricula;
import pe.edu.aduniplus.backend.academico.MatriculaRepository;
import pe.edu.aduniplus.backend.academico.NivelEducativo;
import pe.edu.aduniplus.backend.academico.NivelEducativoRepository;
import pe.edu.aduniplus.backend.academico.PeriodoAcademicoRepository;
import pe.edu.aduniplus.backend.auditoria.Auditoria;
import pe.edu.aduniplus.backend.auditoria.AuditoriaRepository;
import pe.edu.aduniplus.backend.institucion.ConfiguracionInstitucional;
import pe.edu.aduniplus.backend.institucion.ConfiguracionInstitucionalRepository;
import pe.edu.aduniplus.backend.notas.EstadoImportacionNotas;
import pe.edu.aduniplus.backend.notas.Evaluacion;
import pe.edu.aduniplus.backend.notas.EvaluacionRepository;
import pe.edu.aduniplus.backend.notas.ImportacionNotas;
import pe.edu.aduniplus.backend.notas.ImportacionNotasRepository;
import pe.edu.aduniplus.backend.notas.Nota;
import pe.edu.aduniplus.backend.notas.NotaRepository;
import pe.edu.aduniplus.backend.notas.PromedioAcademico;
import pe.edu.aduniplus.backend.notas.PromedioAcademicoRepository;
import pe.edu.aduniplus.backend.notas.TipoEvaluacion;
import pe.edu.aduniplus.backend.persona.Estudiante;
import pe.edu.aduniplus.backend.persona.EstudianteApoderado;
import pe.edu.aduniplus.backend.persona.EstudianteApoderadoRepository;
import pe.edu.aduniplus.backend.persona.EstudianteRepository;
import pe.edu.aduniplus.backend.persona.PersonaRepository;
import pe.edu.aduniplus.backend.usuario.Usuario;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AcademicPortalService {
    private static final DateTimeFormatter DATE_TIME_UI = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final List<TipoEvaluacion> DEFAULT_EVALUATION_ORDER = List.of(
        TipoEvaluacion.PRACTICA,
        TipoEvaluacion.EXAMEN,
        TipoEvaluacion.TAREA,
        TipoEvaluacion.PARTICIPACION
    );

    private final UsuarioRepository usuarioRepository;
    private final AuditoriaRepository auditoriaRepository;
    private final AsignacionDocenteRepository asignacionDocenteRepository;
    private final MatriculaRepository matriculaRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final NotaRepository notaRepository;
    private final PromedioAcademicoRepository promedioAcademicoRepository;
    private final ConfiguracionInstitucionalRepository configuracionInstitucionalRepository;
    private final NivelEducativoRepository nivelEducativoRepository;
    private final GradoRepository gradoRepository;
    private final CursoRepository cursoRepository;
    private final ImportacionNotasRepository importacionNotasRepository;
    private final EstudianteApoderadoRepository estudianteApoderadoRepository;
    private final PeriodoAcademicoRepository periodoAcademicoRepository;
    private final EstudianteRepository estudianteRepository;
    private final PersonaRepository personaRepository;
    private final AsistenciaRepository asistenciaRepository;

    @Transactional(readOnly = true)
    public AdminDashboardDto getAdminDashboard() {
        List<AsignacionDocente> assignments = asignacionDocenteRepository.findAll();
        List<TeacherProgressDto> progress = buildTeacherProgress(assignments);
        List<AuditEntryDto> audits = latestAudits(12);

        long activeUsers = usuarioRepository.findAll().stream()
            .filter((user) -> Boolean.TRUE.equals(user.getActivo()))
            .count();
        long activeTeachers = assignments.stream()
            .filter((assignment) -> assignment.getEstado() == EstadoAsignacionDocente.ACTIVA)
            .map((assignment) -> assignment.getDocente().getId())
            .distinct()
            .count();
        long enrolledStudents = matriculaRepository.findAll().stream()
            .filter((matricula) -> matricula.getEstado() == EstadoMatricula.ACTIVO)
            .count();
        long observedImports = importacionNotasRepository.findAll().stream()
            .filter((item) -> item.getEstado() == EstadoImportacionNotas.OBSERVADA || item.getEstado() == EstadoImportacionNotas.FALLIDA)
            .count();

        List<MetricDto> metrics = List.of(
            new MetricDto("Usuarios activos", String.valueOf(activeUsers), "Cuentas habilitadas en la plataforma", "gold"),
            new MetricDto("Docentes en operacion", String.valueOf(activeTeachers), "Con asignaciones vigentes", "forest"),
            new MetricDto("Estudiantes matriculados", String.valueOf(enrolledStudents), "Matriculas activas en el sistema", "ink"),
            new MetricDto("Importaciones observadas", String.valueOf(observedImports), "Lotes con incidencias por revisar", "maroon")
        );

        return new AdminDashboardDto(metrics, progress, audits);
    }

    @Transactional(readOnly = true)
    public List<UserRowDto> getAdminUsers() {
        return usuarioRepository.findAll(Sort.by(Sort.Direction.ASC, "username")).stream()
            .map((user) -> new UserRowDto(
                user.getId(),
                userCode(user),
                fullName(user.getPersona()),
                safe(user.getPersona().getDocumentoIdentidad(), "-"),
                user.getRoles().stream().map((rol) -> rol.getNombre().name()).sorted().findFirst().orElse("ESTUDIANTE"),
                safe(user.getPersona().getCorreo(), user.getUsername()),
                Boolean.TRUE.equals(user.getActivo()) ? "Activo" : "Inactivo",
                formatDateTime(user.getActualizadoEn() == null ? user.getCreadoEn() : user.getActualizadoEn())
            ))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AcademicLevelDto> getAdminAcademicLevels() {
        List<NivelEducativo> levels = nivelEducativoRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        List<AcademicLevelDto> response = new ArrayList<>();

        for (NivelEducativo level : levels) {
            List<Grado> grades = gradoRepository.findByNivelEducativoId(level.getId());
            List<String> gradeLabels = grades.stream()
                .map((grade) -> grade.getNombre() + " " + grade.getParalelo())
                .sorted()
                .toList();

            Set<String> subjectSet = new HashSet<>();
            for (Grado grade : grades) {
                List<Curso> courses = cursoRepository.findByGradoId(grade.getId());
                for (Curso course : courses) {
                    String subjectName = course.getMateria() == null ? null : course.getMateria().getNombre();
                    if (subjectName != null && !subjectName.isBlank()) {
                        subjectSet.add(subjectName);
                    }
                }
            }

            List<String> subjects = subjectSet.stream().sorted().toList();
            response.add(new AcademicLevelDto(
                level.getNombre(),
                level.getTurno().name(),
                safe(level.getDescripcion(), "Sin descripcion registrada"),
                gradeLabels,
                subjects
            ));
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<TeacherProgressDto> getAdminSupervision() {
        return buildTeacherProgress(asignacionDocenteRepository.findAll());
    }

    @Transactional(readOnly = true)
    public AdminInstitutionDto getAdminInstitution() {
        ConfiguracionInstitucional config = configuracionInstitucionalRepository.findByCodigo("PRINCIPAL")
            .orElseGet(() -> configuracionInstitucionalRepository.findAll().stream().findFirst().orElse(null));

        return new AdminInstitutionDto(toInstitutionConfig(config), latestAudits(10));
    }

    @Transactional
    public AdminInstitutionDto saveAdminInstitution(Long userId, SaveInstitutionRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La configuracion institucional es obligatoria.");
        }

        Usuario user = usuarioRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        Optional<ConfiguracionInstitucional> existing = configuracionInstitucionalRepository.findByCodigo("PRINCIPAL");
        boolean created = existing.isEmpty();
        ConfiguracionInstitucional config = existing.orElseGet(() -> ConfiguracionInstitucional.builder()
            .codigo("PRINCIPAL")
            .build());

        config.setNombre(requiredText(request.nombre(), "El nombre institucional", 150));
        config.setRuc(optionalText(request.ruc(), "El RUC", 20));
        config.setTelefono(optionalText(request.telefono(), "El telefono", 30));
        config.setDireccion(optionalText(request.direccion(), "La direccion", 200));
        config.setCorreoInstitucional(validatedEmail(request.correoInstitucional()));
        config.setSitioWeb(validatedWebUrl(request.sitioWeb(), "El sitio web", 150));
        config.setLogoUrl(validatedWebUrl(request.logoUrl(), "La URL del logo", 250));
        config = configuracionInstitucionalRepository.save(config);

        audit(
            created ? "CREAR_CONFIGURACION" : "ACTUALIZAR_CONFIGURACION",
            "configuraciones_institucionales",
            config.getId(),
            user,
            (created ? "Se creo" : "Se actualizo") + " la ficha institucional principal."
        );

        return new AdminInstitutionDto(toInstitutionConfig(config), latestAudits(10));
    }

    @Transactional(readOnly = true)
    public TeacherDashboardDto getTeacherDashboard(Long docenteId) {
        List<AsignacionDocente> assignments = asignacionDocenteRepository.findByDocenteId(docenteId).stream()
            .sorted(Comparator.comparing(AsignacionDocente::getId))
            .toList();
        List<CourseAssignmentDto> courses = assignments.stream()
            .map(this::toCourseAssignment)
            .toList();

        long uniqueStudents = assignments.stream()
            .map((item) -> item.getCurso().getGrado().getId())
            .distinct()
            .flatMap((gradeId) -> matriculaRepository.findByGradoIdAndEstado(gradeId, EstadoMatricula.ACTIVO).stream())
            .map((matricula) -> matricula.getEstudiante().getId())
            .distinct()
            .count();

        long closed = courses.stream()
            .filter((course) -> "CERRADA".equals(course.estado()) || course.avance() >= 100)
            .count();

        long observedImports = importacionNotasRepository.findByDocenteId(docenteId).stream()
            .filter((item) -> item.getEstado() != EstadoImportacionNotas.PROCESADA)
            .count();

        List<MetricDto> metrics = List.of(
            new MetricDto("Cursos asignados", String.valueOf(courses.size()), "Asignaciones vigentes del docente", "gold"),
            new MetricDto("Estudiantes a cargo", String.valueOf(uniqueStudents), "Total de estudiantes matriculados", "forest"),
            new MetricDto("Actas cerradas", String.valueOf(closed), "Cursos con carga completa", "ink"),
            new MetricDto("Importaciones pendientes", String.valueOf(observedImports), "Lotes por revisar o reprocesar", "maroon")
        );

        return new TeacherDashboardDto(metrics, courses);
    }

    @Transactional(readOnly = true)
    public TeacherGradesDto getTeacherGrades(Long docenteId, Long assignmentId) {
        List<AsignacionDocente> assignments = asignacionDocenteRepository.findByDocenteId(docenteId).stream()
            .sorted(Comparator.comparing(AsignacionDocente::getId))
            .toList();
        if (assignments.isEmpty()) {
            return new TeacherGradesDto(null, null, List.of());
        }

        AsignacionDocente selected = resolveAssignment(assignments, assignmentId);
        Map<TipoEvaluacion, Evaluacion> evaluations = loadEvaluationsByType(selected);
        List<Nota> notes = notaRepository.findByAsignacionDocenteId(selected.getId());
        Map<String, Nota> noteByStudentEval = notes.stream().collect(Collectors.toMap(
            (note) -> note.getEstudiante().getId() + "|" + note.getEvaluacion().getId(),
            (note) -> note,
            (left, right) -> left
        ));

        List<Matricula> matriculas = matriculaRepository.findByGradoIdAndEstado(
            selected.getCurso().getGrado().getId(),
            EstadoMatricula.ACTIVO
        );
        List<GradeEntryDto> rows = matriculas.stream()
            .map(Matricula::getEstudiante)
            .sorted(Comparator.comparing(this::fullName))
            .map((student) -> {
                double practica = scoreFor(student, evaluations.get(TipoEvaluacion.PRACTICA), noteByStudentEval);
                double examen = scoreFor(student, evaluations.get(TipoEvaluacion.EXAMEN), noteByStudentEval);
                double tarea = scoreFor(student, evaluations.get(TipoEvaluacion.TAREA), noteByStudentEval);
                double participacion = scoreFor(student, evaluations.get(TipoEvaluacion.PARTICIPACION), noteByStudentEval);
                double promedio = round2((practica + examen + tarea + participacion) / 4d);
                String observacion = firstObservation(student, evaluations.values(), noteByStudentEval);

                return new GradeEntryDto(
                    student.getCodigoEstudiante(),
                    fullName(student),
                    practica,
                    examen,
                    tarea,
                    participacion,
                    promedio,
                    observacion
                );
            })
            .toList();

        return new TeacherGradesDto(selected.getId(), toCourseAssignment(selected), rows);
    }

    @Transactional
    public OperationMessageDto saveTeacherGrades(Long docenteId, Long userId, SaveGradesRequest request) {
        if (request == null || request.assignmentId() == null || request.rows() == null) {
            throw new IllegalArgumentException("Solicitud de guardado incompleta");
        }

        AsignacionDocente assignment = loadTeacherAssignment(docenteId, request.assignmentId());
        Usuario user = usuarioRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        Map<TipoEvaluacion, Evaluacion> evaluations = ensureEvaluations(
            assignment,
            new HashSet<>(DEFAULT_EVALUATION_ORDER)
        );
        Map<String, Estudiante> studentsByCode = matriculaRepository.findByGradoIdAndEstado(
            assignment.getCurso().getGrado().getId(),
            EstadoMatricula.ACTIVO
        ).stream().collect(Collectors.toMap(
            (matricula) -> matricula.getEstudiante().getCodigoEstudiante(),
            Matricula::getEstudiante,
            (left, right) -> left
        ));

        int processed = 0;
        for (GradeEntryInputDto row : request.rows()) {
            if (row == null || row.codigo() == null || row.codigo().isBlank()) {
                continue;
            }
            Estudiante student = studentsByCode.get(row.codigo().trim());
            if (student == null) {
                continue;
            }

            upsertGrade(student, evaluations.get(TipoEvaluacion.PRACTICA), assignment, user, row.practica(), row.observacion(), null);
            upsertGrade(student, evaluations.get(TipoEvaluacion.EXAMEN), assignment, user, row.examen(), row.observacion(), null);
            upsertGrade(student, evaluations.get(TipoEvaluacion.TAREA), assignment, user, row.tarea(), row.observacion(), null);
            upsertGrade(student, evaluations.get(TipoEvaluacion.PARTICIPACION), assignment, user, row.participacion(), row.observacion(), null);
            refreshAverage(student, assignment.getCurso(), assignment, evaluations.values());
            processed++;
        }

        audit(
            "ACTUALIZAR_NOTAS",
            "notas",
            assignment.getId(),
            user,
            "Se registraron " + processed + " filas de notas para la asignacion " + assignment.getId()
        );

        return new OperationMessageDto("Se guardaron " + processed + " registros de notas correctamente.");
    }

    @Transactional(readOnly = true)
    public TeacherImportContextDto getTeacherImportContext(Long docenteId) {
        List<CourseAssignmentDto> courses = asignacionDocenteRepository.findByDocenteId(docenteId).stream()
            .sorted(Comparator.comparing(AsignacionDocente::getId))
            .map(this::toCourseAssignment)
            .toList();

        List<ImportBatchDto> history = importacionNotasRepository.findByDocenteIdOrderByCreadoEnDesc(docenteId).stream()
            .limit(8)
            .map((item) -> new ImportBatchDto(
                item.getNombreArchivo(),
                item.getPeriodoAcademico().getNombre(),
                item.getEstado().name(),
                formatDateTime(item.getCreadoEn()),
                safe(item.getDetalle(), "")
            ))
            .toList();

        return new TeacherImportContextDto(courses, history);
    }

    @Transactional
    public ExcelImportResultDto importTeacherExcel(Long docenteId, Long userId, Long assignmentId, MultipartFile file) {
        if (assignmentId == null || file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar una asignacion y un archivo Excel.");
        }

        AsignacionDocente assignment = loadTeacherAssignment(docenteId, assignmentId);
        Usuario user = usuarioRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException ex) {
            throw new IllegalArgumentException("No se pudo leer el archivo cargado.");
        }

        String originalName = safe(file.getOriginalFilename(), "registro_notas.xlsx");
        ImportacionNotas batch = ImportacionNotas.builder()
            .docente(assignment.getDocente())
            .curso(assignment.getCurso())
            .periodoAcademico(assignment.getPeriodoAcademico())
            .usuarioResponsable(user)
            .nombreArchivo(originalName)
            .hashArchivo(hashSha256(content))
            .estado(EstadoImportacionNotas.PENDIENTE)
            .detalle("Procesando archivo")
            .build();
        batch = importacionNotasRepository.save(batch);

        int totalRows = 0;
        int validRows = 0;
        int observedRows = 0;
        int matchedStudents = 0;
        int createdStudents = 0;
        int newEnrolments = 0;
        List<String> observations = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            DataFormatter formatter = new DataFormatter(Locale.US, false);
            Sheet sheet = selectTrimesterSheet(workbook, assignment.getPeriodoAcademico().getNombre());
            HeaderDetection headerDetection = detectHeader(sheet, formatter);
            if (headerDetection == null || headerDetection.columnsByType().isEmpty()) {
                throw new IllegalArgumentException("No se encontraron columnas validas de evaluacion en la plantilla.");
            }

            Map<TipoEvaluacion, Evaluacion> evaluations = ensureEvaluations(assignment, headerDetection.columnsByType().keySet());
            StudentNameIndex studentIndex = buildStudentNameIndex(estudianteRepository.findAll());
            Map<String, Estudiante> studentsByNormalizedName = studentIndex.studentsByName();

            int blankStreak = 0;
            for (int rowIdx = headerDetection.rowIndex() + 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                Row row = sheet.getRow(rowIdx);
                String sourceStudentName = readCellText(row, 1, formatter);
                String normalizedStudentName = normalizeName(sourceStudentName);
                if (normalizedStudentName.isBlank()) {
                    blankStreak++;
                    if (blankStreak >= 12) {
                        break;
                    }
                    continue;
                }
                blankStreak = 0;
                totalRows++;

                Map<TipoEvaluacion, Double> validScores = new EnumMap<>(TipoEvaluacion.class);
                boolean rowObserved = false;
                for (TipoEvaluacion type : headerDetection.columnsByType().keySet()) {
                    Integer colIdx = headerDetection.columnByType(type);
                    String rawValue = readCellText(row, colIdx, formatter);
                    if (rawValue.isBlank()) {
                        continue;
                    }

                    Double value = readNumericCell(row, colIdx, formatter);
                    if (value == null || value < 0 || value > 20) {
                        rowObserved = true;
                        addObservation(
                            observations,
                            "Fila " + (rowIdx + 1) + ": valor invalido en " + type.name() + " para " + sourceStudentName + "."
                        );
                        continue;
                    }
                    validScores.put(type, value);
                }

                if (validScores.isEmpty()) {
                    observedRows++;
                    addObservation(
                        observations,
                        "Fila " + (rowIdx + 1) + ": " + sourceStudentName + " no tiene notas numericas validas."
                    );
                    continue;
                }

                if (studentIndex.ambiguousNames().contains(normalizedStudentName)) {
                    observedRows++;
                    addObservation(
                        observations,
                        "Fila " + (rowIdx + 1) + ": " + sourceStudentName
                            + " coincide con mas de un estudiante y requiere identificacion manual."
                    );
                    continue;
                }

                Estudiante student = studentsByNormalizedName.get(normalizedStudentName);
                boolean studentCreated = false;
                if (student == null) {
                    student = createImportedStudent(sourceStudentName);
                    indexStudentName(studentIndex, normalizedStudentName, student);
                    indexStudentName(studentIndex, normalizeName(fullName(student)), student);
                    indexStudentName(studentIndex, normalizeName(student.getNombres() + " " + student.getApellidos()), student);
                    createdStudents++;
                    studentCreated = true;
                } else {
                    if (!Boolean.TRUE.equals(student.getActivo())) {
                        student.setActivo(true);
                        student = estudianteRepository.save(student);
                    }
                    matchedStudents++;
                }

                if (ensureEnrollment(student, assignment.getCurso().getGrado())) {
                    newEnrolments++;
                }

                for (Map.Entry<TipoEvaluacion, Double> score : validScores.entrySet()) {
                    TipoEvaluacion type = score.getKey();

                    upsertGrade(
                        student,
                        evaluations.get(type),
                        assignment,
                        user,
                        score.getValue(),
                        "Importado desde plantilla institucional",
                        batch
                    );
                }

                refreshAverage(student, assignment.getCurso(), assignment, evaluations.values());
                validRows++;
                if (rowObserved) {
                    observedRows++;
                }
                if (studentCreated) {
                    addObservation(
                        observations,
                        "Fila " + (rowIdx + 1) + ": se creo y matriculo a " + fullName(student)
                            + " con codigo " + student.getCodigoEstudiante() + "."
                    );
                }
            }

            String stateMessage = "Importacion completada: " + validRows + " filas con notas, "
                + createdStudents + " estudiantes creados y " + observedRows + " filas observadas.";

            batch.setTotalRegistros(totalRows);
            batch.setRegistrosValidos(validRows);
            batch.setRegistrosObservados(observedRows);
            batch.setEstado(observedRows == 0 ? EstadoImportacionNotas.PROCESADA : EstadoImportacionNotas.OBSERVADA);
            batch.setDetalle(stateMessage);
            importacionNotasRepository.save(batch);

            audit(
                "IMPORTAR_EXCEL",
                "importaciones_notas",
                batch.getId(),
                user,
                "Archivo " + originalName + " procesado. Validos: " + validRows
                    + ", estudiantes creados: " + createdStudents + ", observados: " + observedRows
            );

            return new ExcelImportResultDto(
                stateMessage,
                totalRows,
                validRows,
                observedRows,
                matchedStudents,
                createdStudents,
                newEnrolments,
                observations
            );
        } catch (IllegalArgumentException ex) {
            batch.setEstado(EstadoImportacionNotas.FALLIDA);
            batch.setDetalle(ex.getMessage());
            importacionNotasRepository.save(batch);
            throw ex;
        } catch (Exception ex) {
            batch.setEstado(EstadoImportacionNotas.FALLIDA);
            batch.setDetalle("No se pudo procesar el Excel. Verifique la plantilla institucional.");
            importacionNotasRepository.save(batch);
            throw new IllegalArgumentException("No se pudo procesar el Excel. Verifique la plantilla institucional.");
        }
    }

    @Transactional(readOnly = true)
    public StudentPortalDto getStudentPortal(Long studentId) {
        List<PromedioAcademico> averages = promedioAcademicoRepository.findByEstudianteIdAndPublicadoTrue(studentId).stream()
            .sorted(Comparator.comparing((PromedioAcademico item) -> item.getPeriodoAcademico().getOrden()))
            .toList();
        List<StudentCourseReportDto> reports = buildReportsForStudent(studentId, averages);

        double generalAverage = reports.isEmpty()
            ? 0
            : reports.stream().mapToDouble(StudentCourseReportDto::promedio).average().orElse(0);
        double bestAverage = reports.stream().mapToDouble(StudentCourseReportDto::promedio).max().orElse(0);
        long closedPeriods = periodoAcademicoRepository.findAll().stream()
            .filter((period) -> Boolean.TRUE.equals(period.getCerrado()))
            .count();

        List<MetricDto> metrics = List.of(
            new MetricDto("Promedio general", formatNumber(generalAverage), "Promedio acumulado publicado", "gold"),
            new MetricDto("Cursos publicados", String.valueOf(reports.size()), "Cursos visibles para consulta", "forest"),
            new MetricDto("Mejor promedio", formatNumber(bestAverage), "Rendimiento mas alto del periodo", "ink"),
            new MetricDto("Periodos cerrados", String.valueOf(closedPeriods), "Periodos academicos concluidos", "maroon")
        );

        return new StudentPortalDto(metrics, reports, calculateAsistenciaSummary(studentId), studentId);
    }

    @Transactional(readOnly = true)
    public FamilyPortalDto getFamilyPortal(Long fatherId) {
        List<EstudianteApoderado> links = estudianteApoderadoRepository.findByPadreFamiliaId(fatherId);
        List<Estudiante> students = links.stream()
            .map(EstudianteApoderado::getEstudiante)
            .distinct()
            .sorted(Comparator.comparing(this::fullName))
            .toList();

        Map<String, List<StudentCourseReportDto>> reportsByStudent = new LinkedHashMap<>();
        List<FamilyStudentDto> summary = new ArrayList<>();
        List<FamilyAlertDto> alerts = new ArrayList<>();

        for (Estudiante student : students) {
            List<PromedioAcademico> averages = promedioAcademicoRepository.findByEstudianteIdAndPublicadoTrue(student.getId());
            List<StudentCourseReportDto> reports = buildReportsForStudent(student.getId(), averages);
            reportsByStudent.put(student.getCodigoEstudiante(), reports);

            double average = reports.stream().mapToDouble(StudentCourseReportDto::promedio).average().orElse(0);
            String gradeLabel = latestGradeLabel(student);
            String relation = links.stream()
                .filter((item) -> Objects.equals(item.getEstudiante().getId(), student.getId()))
                .findFirst()
                .map(EstudianteApoderado::getParentesco)
                .orElse("Apoderado");

            summary.add(new FamilyStudentDto(
                student.getCodigoEstudiante(),
                fullName(student),
                gradeLabel,
                relation,
                round2(average),
                calculateAsistenciaSummary(student.getId()),
                student.getId()
            ));

            if (reports.stream().anyMatch((report) -> report.promedio() < 11)) {
                alerts.add(new FamilyAlertDto(
                    "Curso con apoyo requerido",
                    fullName(student) + " tiene promedios en riesgo y requiere seguimiento.",
                    "Pendiente"
                ));
            }
            if (reports.stream().anyMatch((report) -> report.promedio() >= 17)) {
                alerts.add(new FamilyAlertDto(
                    "Rendimiento destacado",
                    fullName(student) + " registra desempeno sobresaliente en cursos publicados.",
                    "Destacado"
                ));
            }
        }

        if (alerts.isEmpty()) {
            alerts.add(new FamilyAlertDto(
                "Sin alertas criticas",
                "No se detectaron riesgos academicos con la informacion publicada.",
                "Estable"
            ));
        }

        return new FamilyPortalDto(summary, reportsByStudent, alerts);
    }

    private StudentAsistenciaResumen calculateAsistenciaSummary(Long studentId) {
        List<Asistencia> list = asistenciaRepository.findByPersonaIdAndFechaBetweenOrderByFechaAsc(studentId, LocalDate.of(2000, 1, 1), LocalDate.of(2100, 1, 1));
        int total = list.size();
        int presentes = 0;
        int tardanzas = 0;
        int faltas = 0;
        int justificados = 0;
        for (Asistencia a : list) {
            if (a.getEstado() == EstadoAsistencia.PRESENTE) presentes++;
            else if (a.getEstado() == EstadoAsistencia.TARDANZA) tardanzas++;
            else if (a.getEstado() == EstadoAsistencia.FALTA) faltas++;
            else if (a.getEstado() == EstadoAsistencia.JUSTIFICADO) justificados++;
        }
        double pct = total > 0 ? (double) (presentes + justificados) / total * 100 : 0;
        return new StudentAsistenciaResumen(total, presentes, tardanzas, faltas, justificados, Math.round(pct * 100.0) / 100.0);
    }

    private AsignacionDocente resolveAssignment(List<AsignacionDocente> assignments, Long assignmentId) {
        if (assignmentId == null) {
            return assignments.getFirst();
        }
        return assignments.stream()
            .filter((assignment) -> Objects.equals(assignment.getId(), assignmentId))
            .findFirst()
            .orElse(assignments.getFirst());
    }

    private AsignacionDocente loadTeacherAssignment(Long docenteId, Long assignmentId) {
        return asignacionDocenteRepository.findById(assignmentId)
            .filter((assignment) -> Objects.equals(assignment.getDocente().getId(), docenteId))
            .orElseThrow(() -> new IllegalArgumentException("La asignacion seleccionada no pertenece al docente."));
    }

    private List<TeacherProgressDto> buildTeacherProgress(List<AsignacionDocente> assignments) {
        return assignments.stream()
            .sorted(Comparator.comparing(AsignacionDocente::getId))
            .map((assignment) -> {
                ProgressStats stats = calculateProgress(assignment);
                return new TeacherProgressDto(
                    fullName(assignment.getDocente()),
                    safe(assignment.getDocente().getCodigoDocente(), "DOC-" + assignment.getDocente().getId()),
                    safe(assignment.getDocente().getAreaAcademica(), safe(assignment.getCurso().getMateria().getArea(), "General")),
                    assignment.getCurso().getMateria().getNombre(),
                    assignment.getCurso().getGrado().getNombre() + " " + assignment.getCurso().getGrado().getParalelo(),
                    assignment.getPeriodoAcademico().getNombre(),
                    stats.progress(),
                    stats.status()
                );
            })
            .toList();
    }

    private CourseAssignmentDto toCourseAssignment(AsignacionDocente assignment) {
        ProgressStats stats = calculateProgress(assignment);
        return new CourseAssignmentDto(
            assignment.getId(),
            safe(assignment.getCurso().getMateria().getCodigo(), "CUR-" + assignment.getCurso().getId()),
            assignment.getCurso().getMateria().getNombre(),
            assignment.getCurso().getGrado().getNombre(),
            assignment.getCurso().getGrado().getParalelo(),
            assignment.getPeriodoAcademico().getNombre(),
            stats.students(),
            stats.evaluations(),
            stats.progress(),
            assignment.getEstado().name()
        );
    }

    private ProgressStats calculateProgress(AsignacionDocente assignment) {
        List<Evaluacion> evaluations = evaluacionRepository.findByCursoIdAndPeriodoAcademicoIdOrderByOrdenAsc(
            assignment.getCurso().getId(),
            assignment.getPeriodoAcademico().getId()
        );
        List<Matricula> students = matriculaRepository.findByGradoIdAndEstado(
            assignment.getCurso().getGrado().getId(),
            EstadoMatricula.ACTIVO
        );
        List<Nota> notes = notaRepository.findByAsignacionDocenteId(assignment.getId());

        int totalExpected = students.size() * evaluations.size();
        int registered = notes.size();
        int progress = totalExpected == 0 ? 0 : (int) Math.round((registered * 100d) / totalExpected);
        progress = Math.max(0, Math.min(progress, 100));

        String status;
        if (assignment.getEstado() == EstadoAsignacionDocente.CERRADA || progress >= 100) {
            status = "Completo";
        } else if (registered > 0) {
            status = "En proceso";
        } else {
            status = "Pendiente";
        }

        return new ProgressStats(progress, status, students.size(), evaluations.size());
    }

    private Map<TipoEvaluacion, Evaluacion> loadEvaluationsByType(AsignacionDocente assignment) {
        return evaluacionRepository.findByCursoIdAndPeriodoAcademicoIdOrderByOrdenAsc(
            assignment.getCurso().getId(),
            assignment.getPeriodoAcademico().getId()
        ).stream().collect(Collectors.toMap(
            Evaluacion::getTipo,
            (eval) -> eval,
            (left, right) -> left,
            () -> new EnumMap<>(TipoEvaluacion.class)
        ));
    }

    private Map<TipoEvaluacion, Evaluacion> ensureEvaluations(
        AsignacionDocente assignment,
        Collection<TipoEvaluacion> requiredTypes
    ) {
        Map<TipoEvaluacion, Evaluacion> evaluations = loadEvaluationsByType(assignment);
        int startOrder = evaluations.values().stream().map(Evaluacion::getOrden).max(Integer::compareTo).orElse(0) + 1;
        int missingCount = (int) requiredTypes.stream().filter((type) -> !evaluations.containsKey(type)).count();
        BigDecimal defaultWeight = missingCount == 0
            ? BigDecimal.valueOf(25)
            : BigDecimal.valueOf(100d / Math.max(requiredTypes.size(), 1)).setScale(2, RoundingMode.HALF_UP);

        for (TipoEvaluacion type : requiredTypes) {
            if (evaluations.containsKey(type)) {
                continue;
            }

            Evaluacion eval = Evaluacion.builder()
                .curso(assignment.getCurso())
                .periodoAcademico(assignment.getPeriodoAcademico())
                .nombre(type.name())
                .tipo(type)
                .peso(defaultWeight)
                .orden(startOrder++)
                .publicada(true)
                .build();
            eval = evaluacionRepository.save(eval);
            evaluations.put(type, eval);
        }

        return evaluations;
    }

    private void upsertGrade(
        Estudiante student,
        Evaluacion evaluation,
        AsignacionDocente assignment,
        Usuario user,
        Double value,
        String observation,
        ImportacionNotas batch
    ) {
        if (evaluation == null || value == null) {
            return;
        }

        double bounded = Math.max(0, Math.min(20, value));
        Nota note = notaRepository.findByEstudianteIdAndEvaluacionId(student.getId(), evaluation.getId())
            .orElseGet(() -> Nota.builder()
                .estudiante(student)
                .evaluacion(evaluation)
                .asignacionDocente(assignment)
                .registradoPor(user)
                .build());

        note.setValor(BigDecimal.valueOf(bounded).setScale(2, RoundingMode.HALF_UP));
        note.setObservacion(safe(observation, ""));
        note.setImportacionNotas(batch);
        note.setAsignacionDocente(assignment);
        note.setRegistradoPor(user);
        notaRepository.save(note);
    }

    private void refreshAverage(
        Estudiante student,
        Curso course,
        AsignacionDocente assignment,
        Collection<Evaluacion> evaluations
    ) {
        if (evaluations.isEmpty()) {
            return;
        }

        List<Double> values = new ArrayList<>();
        for (Evaluacion evaluation : evaluations) {
            notaRepository.findByEstudianteIdAndEvaluacionId(student.getId(), evaluation.getId())
                .ifPresent((note) -> values.add(note.getValor().doubleValue()));
        }
        if (values.isEmpty()) {
            return;
        }

        double average = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        PromedioAcademico promedio = promedioAcademicoRepository.findByEstudianteIdAndCursoIdAndPeriodoAcademicoId(
            student.getId(),
            course.getId(),
            assignment.getPeriodoAcademico().getId()
        ).orElseGet(() -> PromedioAcademico.builder()
            .estudiante(student)
            .curso(course)
            .periodoAcademico(assignment.getPeriodoAcademico())
            .build());

        promedio.setPromedio(BigDecimal.valueOf(round2(average)).setScale(2, RoundingMode.HALF_UP));
        promedio.setPublicado(true);
        promedioAcademicoRepository.save(promedio);
    }

    private List<StudentCourseReportDto> buildReportsForStudent(Long studentId, List<PromedioAcademico> averages) {
        List<Nota> allNotes = notaRepository.findByEstudianteId(studentId);
        List<StudentCourseReportDto> reports = new ArrayList<>();

        for (PromedioAcademico average : averages) {
            Map<TipoEvaluacion, Double> valuesByType = allNotes.stream()
                .filter((note) -> Objects.equals(note.getEvaluacion().getCurso().getId(), average.getCurso().getId()))
                .filter((note) -> Objects.equals(note.getEvaluacion().getPeriodoAcademico().getId(), average.getPeriodoAcademico().getId()))
                .collect(Collectors.toMap(
                    (note) -> note.getEvaluacion().getTipo(),
                    (note) -> note.getValor().doubleValue(),
                    (left, right) -> right,
                    () -> new EnumMap<>(TipoEvaluacion.class)
                ));

            reports.add(new StudentCourseReportDto(
                average.getCurso().getMateria().getNombre(),
                average.getPeriodoAcademico().getNombre(),
                round2(valuesByType.getOrDefault(TipoEvaluacion.PRACTICA, 0d)),
                round2(valuesByType.getOrDefault(TipoEvaluacion.EXAMEN, 0d)),
                round2(valuesByType.getOrDefault(TipoEvaluacion.TAREA, 0d)),
                round2(average.getPromedio().doubleValue()),
                Boolean.TRUE.equals(average.getPublicado()) ? "Publicado" : "En revision"
            ));
        }

        return reports;
    }

    private StudentNameIndex buildStudentNameIndex(List<Estudiante> students) {
        StudentNameIndex index = new StudentNameIndex(new HashMap<>(), new HashSet<>());
        for (Estudiante student : students) {
            indexStudentName(index, normalizeName(fullName(student)), student);
            indexStudentName(index, normalizeName(student.getNombres() + " " + student.getApellidos()), student);
        }
        return index;
    }

    private void indexStudentName(StudentNameIndex index, String normalizedName, Estudiante student) {
        if (normalizedName.isBlank()) {
            return;
        }

        Estudiante existing = index.studentsByName().get(normalizedName);
        if (existing != null && !Objects.equals(existing.getId(), student.getId())) {
            index.ambiguousNames().add(normalizedName);
            index.studentsByName().remove(normalizedName);
            return;
        }
        if (!index.ambiguousNames().contains(normalizedName)) {
            index.studentsByName().put(normalizedName, student);
        }
    }

    private Estudiante createImportedStudent(String sourceName) {
        NameParts name = parseImportedName(sourceName);
        String suffix = Integer.toUnsignedString(normalizeName(sourceName).hashCode(), 36).toUpperCase(Locale.ROOT);

        return estudianteRepository.save(
            Estudiante.builder()
                .nombres(name.nombres())
                .apellidos(name.apellidos())
                .documentoIdentidad(uniqueImportedDocument(suffix))
                .codigoEstudiante(uniqueStudentCode(suffix))
                .activo(true)
                .build()
        );
    }

    private boolean ensureEnrollment(Estudiante student, Grado grade) {
        Optional<Matricula> existing = matriculaRepository.findByEstudianteIdAndGradoId(student.getId(), grade.getId());
        if (existing.isPresent()) {
            Matricula enrollment = existing.get();
            if (enrollment.getEstado() != EstadoMatricula.ACTIVO) {
                enrollment.setEstado(EstadoMatricula.ACTIVO);
                enrollment.setFechaMatricula(LocalDate.now());
                matriculaRepository.save(enrollment);
                return true;
            }
            return false;
        }

        String suffix = Integer.toUnsignedString(
            (student.getCodigoEstudiante() + "|" + grade.getId()).hashCode(),
            36
        ).toUpperCase(Locale.ROOT);

        matriculaRepository.save(
            Matricula.builder()
                .codigoMatricula(uniqueEnrollmentCode(suffix))
                .estudiante(student)
                .grado(grade)
                .fechaMatricula(LocalDate.now())
                .estado(EstadoMatricula.ACTIVO)
                .build()
        );
        return true;
    }

    private NameParts parseImportedName(String sourceName) {
        String cleaned = safe(sourceName, "ESTUDIANTE POR COMPLETAR").replaceAll("\\s+", " ").trim();
        if (cleaned.contains(",")) {
            String[] parts = cleaned.split(",", 2);
            return new NameParts(safe(parts[1], "POR COMPLETAR"), safe(parts[0], "POR COMPLETAR"));
        }

        String[] words = cleaned.split("\\s+");
        if (words.length == 1) {
            return new NameParts(words[0], "POR COMPLETAR");
        }
        if (words.length == 2) {
            return new NameParts(words[1], words[0]);
        }

        String apellidos = words[0] + " " + words[1];
        String nombres = String.join(" ", java.util.Arrays.copyOfRange(words, 2, words.length));
        return new NameParts(nombres, apellidos);
    }

    private String uniqueStudentCode(String suffix) {
        String base = "EST-IMP-" + LocalDate.now().getYear() + "-" + suffix;
        String candidate = base;
        int attempt = 2;
        while (estudianteRepository.existsByCodigoEstudiante(candidate)) {
            candidate = base + "-" + attempt++;
        }
        return candidate;
    }

    private String uniqueImportedDocument(String suffix) {
        String base = "IMP-" + LocalDate.now().getYear() + "-" + suffix;
        String candidate = base;
        int attempt = 2;
        while (personaRepository.existsByDocumentoIdentidad(candidate)) {
            candidate = base + "-" + attempt++;
        }
        return candidate;
    }

    private String uniqueEnrollmentCode(String suffix) {
        String base = "MAT-IMP-" + LocalDate.now().getYear() + "-" + suffix;
        String candidate = base;
        int attempt = 2;
        while (matriculaRepository.findByCodigoMatricula(candidate).isPresent()) {
            candidate = base + "-" + attempt++;
        }
        return candidate;
    }

    private void addObservation(List<String> observations, String observation) {
        if (observations.size() < 30) {
            observations.add(observation);
        }
    }

    private HeaderDetection detectHeader(Sheet sheet, DataFormatter formatter) {
        HeaderDetection best = null;
        int lastRow = Math.min(sheet.getLastRowNum(), 45);

        for (int rowIdx = 0; rowIdx <= lastRow; rowIdx++) {
            Row row = sheet.getRow(rowIdx);
            if (row == null) {
                continue;
            }

            Map<TipoEvaluacion, Integer> columns = new EnumMap<>(TipoEvaluacion.class);
            int lastCol = Math.min(Math.max(row.getLastCellNum(), 0), 130);
            for (int colIdx = 0; colIdx <= lastCol; colIdx++) {
                String text = normalizeName(readCellText(row, colIdx, formatter));
                TipoEvaluacion type = detectEvaluationType(text);
                if (type != null && !columns.containsKey(type)) {
                    columns.put(type, colIdx);
                }
            }

            if (columns.size() >= 2 && (best == null || columns.size() > best.columnsByType().size())) {
                best = new HeaderDetection(rowIdx, columns);
            }
        }

        return best;
    }

    private Sheet selectTrimesterSheet(Workbook workbook, String periodName) {
        String normalizedPeriod = normalizeName(periodName);
        if (normalizedPeriod.contains("III") || normalizedPeriod.contains("3")) {
            Sheet sheet = workbook.getSheet("III TRIMESTRE");
            if (sheet != null) {
                return sheet;
            }
        }
        if (normalizedPeriod.contains("II") || normalizedPeriod.contains("2")) {
            Sheet sheet = workbook.getSheet("II TRIMESTRE");
            if (sheet != null) {
                return sheet;
            }
        }

        Sheet firstTrimester = workbook.getSheet("I TRIMESTRE");
        if (firstTrimester != null) {
            return firstTrimester;
        }

        for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
            Sheet sheet = workbook.getSheetAt(i);
            if (normalizeName(sheet.getSheetName()).contains("TRIMESTRE")) {
                return sheet;
            }
        }

        throw new IllegalArgumentException("La plantilla no contiene hoja de trimestre reconocible.");
    }

    private TipoEvaluacion detectEvaluationType(String cellValue) {
        if (cellValue == null || cellValue.isBlank()) {
            return null;
        }
        if (cellValue.contains("PRACTICA")) {
            return TipoEvaluacion.PRACTICA;
        }
        if (cellValue.contains("EXAMEN")) {
            return TipoEvaluacion.EXAMEN;
        }
        if (cellValue.contains("CUADERNO") || cellValue.contains("TAREA")) {
            return TipoEvaluacion.TAREA;
        }
        if (cellValue.contains("PARTICIPACION")) {
            return TipoEvaluacion.PARTICIPACION;
        }
        return null;
    }

    private String latestGradeLabel(Estudiante student) {
        return matriculaRepository.findByEstudianteId(student.getId()).stream()
            .sorted(Comparator.comparing(Matricula::getFechaMatricula).reversed())
            .findFirst()
            .map((item) -> item.getGrado().getNombre() + " " + item.getGrado().getParalelo())
            .orElse("Sin matricula");
    }

    private List<AuditEntryDto> latestAudits(int limit) {
        return auditoriaRepository.findAll(Sort.by(Sort.Direction.DESC, "creadoEn")).stream()
            .limit(limit)
            .map((entry) -> new AuditEntryDto(
                entry.getAccion(),
                entry.getEntidad(),
                safe(entry.getUsuarioResponsable(), "sistema"),
                formatDateTime(entry.getCreadoEn()),
                safe(entry.getDetalle(), "")
            ))
            .toList();
    }

    private InstitutionConfigDto toInstitutionConfig(ConfiguracionInstitucional config) {
        if (config == null) {
            return new InstitutionConfigDto("", "", "", "", "", "", "");
        }

        return new InstitutionConfigDto(
            safe(config.getNombre(), ""),
            safe(config.getRuc(), ""),
            safe(config.getTelefono(), ""),
            safe(config.getDireccion(), ""),
            safe(config.getCorreoInstitucional(), ""),
            safe(config.getSitioWeb(), ""),
            safe(config.getLogoUrl(), "")
        );
    }

    private String requiredText(String value, String label, int maxLength) {
        String normalized = optionalText(value, label, maxLength);
        if (normalized == null) {
            throw new IllegalArgumentException(label + " es obligatorio.");
        }
        return normalized;
    }

    private String optionalText(String value, String label, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(label + " no puede superar " + maxLength + " caracteres.");
        }
        return normalized;
    }

    private String validatedEmail(String value) {
        String email = optionalText(value, "El correo institucional", 150);
        if (email != null && !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("El correo institucional no es valido.");
        }
        return email;
    }

    private String validatedWebUrl(String value, String label, int maxLength) {
        String url = optionalText(value, label, maxLength);
        if (url == null) {
            return null;
        }

        try {
            URI parsed = URI.create(url);
            if (parsed.getHost() == null || (!"http".equalsIgnoreCase(parsed.getScheme()) && !"https".equalsIgnoreCase(parsed.getScheme()))) {
                throw new IllegalArgumentException(label + " debe comenzar con http:// o https://.");
            }
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(label + " no es valida.");
        }
        return url;
    }

    private void audit(String action, String entity, Long entityId, Usuario user, String detail) {
        auditoriaRepository.save(Auditoria.builder()
            .accion(action)
            .entidad(entity)
            .entidadId(entityId)
            .usuario(user)
            .usuarioResponsable(user.getUsername())
            .detalle(detail)
            .build());
    }

    private double scoreFor(Estudiante student, Evaluacion evaluation, Map<String, Nota> noteByStudentEval) {
        if (evaluation == null) {
            return 0;
        }
        Nota note = noteByStudentEval.get(student.getId() + "|" + evaluation.getId());
        if (note == null || note.getValor() == null) {
            return 0;
        }
        return round2(note.getValor().doubleValue());
    }

    private String firstObservation(Estudiante student, Collection<Evaluacion> evaluations, Map<String, Nota> noteByStudentEval) {
        for (Evaluacion evaluation : evaluations) {
            Nota note = noteByStudentEval.get(student.getId() + "|" + evaluation.getId());
            if (note != null && note.getObservacion() != null && !note.getObservacion().isBlank()) {
                return note.getObservacion();
            }
        }
        return "";
    }

    private Double readNumericCell(Row row, Integer columnIndex, DataFormatter formatter) {
        if (row == null || columnIndex == null) {
            return null;
        }
        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return null;
        }

        try {
            if (cell.getCellType().name().equals("NUMERIC")) {
                return cell.getNumericCellValue();
            }
            String text = formatter.formatCellValue(cell).trim().replace(",", ".");
            if (text.isBlank()) {
                return null;
            }
            return Double.parseDouble(text);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String readCellText(Row row, int columnIndex, DataFormatter formatter) {
        if (row == null) {
            return "";
        }
        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return "";
        }
        return formatter.formatCellValue(cell).trim();
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "-";
        }
        return DATE_TIME_UI.format(dateTime);
    }

    private String userCode(Usuario user) {
        String role = user.getRoles().stream().map((r) -> r.getNombre().name()).sorted().findFirst().orElse("USR");
        String prefix = switch (role) {
            case "ADMINISTRADOR" -> "ADM";
            case "DOCENTE" -> "DOC";
            case "ESTUDIANTE" -> "EST";
            default -> "FAM";
        };
        return prefix + "-" + user.getId();
    }

    private String fullName(pe.edu.aduniplus.backend.persona.Persona person) {
        return (safe(person.getApellidos(), "") + ", " + safe(person.getNombres(), "")).replaceAll("\\s+", " ").trim();
    }

    private String normalizeName(String value) {
        if (value == null) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
        normalized = normalized.replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}\\s]", " ");
        return normalized.replaceAll("\\s+", " ").trim().toUpperCase(Locale.ROOT);
    }

    private String hashSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            return new String(data, 0, Math.min(data.length, 16), StandardCharsets.UTF_8);
        }
    }

    private double round2(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private String formatNumber(double value) {
        return String.format(Locale.US, "%.2f", round2(value));
    }

    private String safe(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private record ProgressStats(int progress, String status, int students, int evaluations) {}

    private record HeaderDetection(int rowIndex, Map<TipoEvaluacion, Integer> columnsByType) {
        Integer columnByType(TipoEvaluacion type) {
            return columnsByType.get(type);
        }
    }

    private record NameParts(String nombres, String apellidos) {}

    private record StudentNameIndex(Map<String, Estudiante> studentsByName, Set<String> ambiguousNames) {}
}
