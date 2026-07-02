package pe.edu.aduniplus.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.*;
import pe.edu.aduniplus.backend.auditoria.Auditoria;
import pe.edu.aduniplus.backend.auditoria.AuditoriaRepository;
import pe.edu.aduniplus.backend.notas.*;
import pe.edu.aduniplus.backend.persona.*;
import pe.edu.aduniplus.backend.usuario.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DatabaseSeeder implements CommandLineRunner {
    public static final String TEST_PASSWORD = "Aduni1234!";

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;
    private final AdministrativoRepository administrativoRepository;
    private final DocenteRepository docenteRepository;
    private final EstudianteRepository estudianteRepository;
    private final PadreFamiliaRepository padreFamiliaRepository;
    private final GestionAcademicaRepository gestionRepository;
    private final PeriodoAcademicoRepository periodoRepository;
    private final NivelEducativoRepository nivelRepository;
    private final GradoRepository gradoRepository;
    private final MateriaRepository materiaRepository;
    private final CursoRepository cursoRepository;
    private final MatriculaRepository matriculaRepository;
    private final DetalleMatriculaRepository detalleRepository;
    private final AsignacionDocenteRepository asignacionRepository;
    private final EstudianteApoderadoRepository vinculoRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final NotaRepository notaRepository;
    private final PromedioAcademicoRepository promedioRepository;
    private final AuditoriaRepository auditoriaRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Verificando datos iniciales de desarrollo de Aduni+...");

        Rol adminRole = role(RolNombre.ADMINISTRADOR);
        Rol teacherRole = role(RolNombre.DOCENTE);
        Rol studentRole = role(RolNombre.ESTUDIANTE);
        Rol familyRole = role(RolNombre.PADRE_FAMILIA);

        Administrativo admin = admin();
        Docente teacher = teacher();
        Estudiante studentOne = student("70000001", "EST-2026-001", "Lucía", "Quispe Flores", "lucia@aduniplus.test");
        Estudiante studentTwo = student("70000002", "EST-2026-002", "Mateo", "Ramos Díaz", "mateo@aduniplus.test");
        PadreFamilia parentOne = parent("60000001", "Rosa", "Flores Huamán", "rosa@aduniplus.test");
        PadreFamilia parentTwo = parent("60000002", "Carlos", "Ramos Soto", "carlos@aduniplus.test");

        Usuario adminUser = user("admin", admin, adminRole);
        Usuario teacherUser = user("docente", teacher, teacherRole);
        Usuario studentUser = user("estudiante", studentOne, studentRole);
        user("estudiante2", studentTwo, studentRole);
        user("padre", parentOne, familyRole);
        user("padre2", parentTwo, familyRole);

        GestionAcademica gestion = gestion();
        List<PeriodoAcademico> periods = periods(gestion);
        NivelEducativo level = level(gestion);
        Grado grade = grade(level);
        Materia math = subject("MAT", "Matemática", "CIENCIAS");
        Materia communication = subject("COM", "Comunicación", "COMUNICACIÓN");
        Curso mathCourse = course(grade, math);
        course(grade, communication);

        Matricula enrollmentOne = enrollment(studentOne, grade, "MAT-2026-001");
        Matricula enrollmentTwo = enrollment(studentTwo, grade, "MAT-2026-002");
        detail(enrollmentOne, math);
        detail(enrollmentOne, communication);
        detail(enrollmentTwo, math);
        detail(enrollmentTwo, communication);

        for (PeriodoAcademico period : periods) {
            assignment(teacher, mathCourse, period);
        }
        link(studentOne, parentOne, "MADRE", true);
        link(studentTwo, parentTwo, "PADRE", true);

        seedGrades(studentOne, mathCourse, periods.getFirst(), teacherUser, List.of(18, 17, 19, 18));
        seedGrades(studentTwo, mathCourse, periods.getFirst(), teacherUser, List.of(14, 15, 13, 16));

        if (auditoriaRepository.count() == 0) {
            auditoriaRepository.save(Auditoria.builder()
                .accion("INICIALIZAR").entidad("sistema").usuario(adminUser)
                .usuarioResponsable("sistema")
                .detalle("Datos iniciales de desarrollo creados de forma idempotente.").build());
        }
        log.info("Datos de prueba listos: admin, docente, estudiantes y padres; contraseña común {}", TEST_PASSWORD);
    }

    private Rol role(RolNombre name) {
        return rolRepository.findByNombre(name)
            .orElseGet(() -> rolRepository.save(Rol.builder().nombre(name).build()));
    }

    private Administrativo admin() {
        return personaRepository.findByDocumentoIdentidad("00000000")
            .filter(Administrativo.class::isInstance).map(Administrativo.class::cast)
            .orElseGet(() -> administrativoRepository.save(Administrativo.builder()
                .nombres("Administrador").apellidos("Aduni+").tipoDocumento("DNI")
                .documentoIdentidad("00000000").correo("admin@aduniplus.test")
                .codigoAdministrativo("ADM-001").cargo("Administrador del sistema")
                .activo(true).estadoPersona(true).build()));
    }

    private Docente teacher() {
        return docenteRepository.findByCodigoDocente("DOC-001")
            .orElseGet(() -> docenteRepository.save(Docente.builder()
                .nombres("Elena").apellidos("Vargas Soto").tipoDocumento("DNI")
                .documentoIdentidad("40000001").correo("elena@aduniplus.test")
                .codigoDocente("DOC-001").especialidad("Matemática")
                .areaAcademica("Ciencias").activo(true).estadoPersona(true).build()));
    }

    private Estudiante student(String document, String code, String firstName, String lastName, String email) {
        return estudianteRepository.findByCodigoEstudiante(code)
            .orElseGet(() -> estudianteRepository.save(Estudiante.builder()
                .nombres(firstName).apellidos(lastName).tipoDocumento("DNI")
                .documentoIdentidad(document).correo(email).codigoEstudiante(code)
                .activo(true).estadoPersona(true).build()));
    }

    private PadreFamilia parent(String document, String firstName, String lastName, String email) {
        return personaRepository.findByDocumentoIdentidad(document)
            .filter(PadreFamilia.class::isInstance).map(PadreFamilia.class::cast)
            .orElseGet(() -> padreFamiliaRepository.save(PadreFamilia.builder()
                .nombres(firstName).apellidos(lastName).tipoDocumento("DNI")
                .documentoIdentidad(document).correo(email).ocupacion("Independiente")
                .activo(true).estadoPersona(true).build()));
    }

    private Usuario user(String username, Persona person, Rol role) {
        return usuarioRepository.findByUsername(username).orElseGet(() -> usuarioRepository.save(Usuario.builder()
            .username(username).password(passwordEncoder.encode(TEST_PASSWORD))
            .persona(person).roles(Set.of(role)).activo(true).build()));
    }

    private GestionAcademica gestion() {
        return gestionRepository.findByAnio(2026).orElseGet(() -> gestionRepository.save(GestionAcademica.builder()
            .anio(2026).nombre("Año lectivo 2026").fechaInicio(LocalDate.of(2026, 3, 2))
            .fechaFin(LocalDate.of(2026, 12, 18)).activa(true).build()));
    }

    private List<PeriodoAcademico> periods(GestionAcademica gestion) {
        return List.of(
            period(gestion, "I Trimestre", 1, LocalDate.of(2026, 3, 2), LocalDate.of(2026, 5, 29)),
            period(gestion, "II Trimestre", 2, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 9, 4)),
            period(gestion, "III Trimestre", 3, LocalDate.of(2026, 9, 7), LocalDate.of(2026, 12, 18))
        );
    }

    private PeriodoAcademico period(GestionAcademica gestion, String name, int order, LocalDate start, LocalDate end) {
        return periodoRepository.findByGestionAcademicaIdAndNombre(gestion.getId(), name)
            .orElseGet(() -> periodoRepository.save(PeriodoAcademico.builder()
                .gestionAcademica(gestion).nombre(name).orden(order).fechaInicio(start).fechaFin(end).cerrado(false).build()));
    }

    private NivelEducativo level(GestionAcademica gestion) {
        return nivelRepository.findByGestionAcademicaId(gestion.getId()).stream()
            .filter(item -> item.getNombre().equals("Secundaria") && item.getTurno() == Turno.MANANA)
            .findFirst().orElseGet(() -> nivelRepository.save(NivelEducativo.builder()
                .gestionAcademica(gestion).nombre("Secundaria").turno(Turno.MANANA)
                .descripcion("Nivel de demostración").activo(true).build()));
    }

    private Grado grade(NivelEducativo level) {
        return gradoRepository.findByNivelEducativoId(level.getId()).stream()
            .filter(item -> item.getNombre().equals("1ro") && item.getParalelo().equals("A"))
            .findFirst().orElseGet(() -> gradoRepository.save(Grado.builder()
                .nivelEducativo(level).nombre("1ro").paralelo("A").capacidad(30).activo(true).build()));
    }

    private Materia subject(String code, String name, String area) {
        return materiaRepository.findByCodigo(code)
            .or(() -> materiaRepository.findByNombre(name))
            .orElseGet(() -> materiaRepository.save(Materia.builder()
            .codigo(code).nombre(name).area(area).activa(true).build()));
    }

    private Curso course(Grado grade, Materia subject) {
        return cursoRepository.findByGradoIdAndMateriaId(grade.getId(), subject.getId())
            .orElseGet(() -> cursoRepository.save(Curso.builder().grado(grade).materia(subject).activo(true).build()));
    }

    private Matricula enrollment(Estudiante student, Grado grade, String code) {
        return matriculaRepository.findByEstudianteIdAndGradoId(student.getId(), grade.getId())
            .orElseGet(() -> matriculaRepository.save(Matricula.builder().codigoMatricula(code)
                .estudiante(student).grado(grade).fechaMatricula(LocalDate.of(2026, 2, 20))
                .estado(EstadoMatricula.ACTIVA).build()));
    }

    private void detail(Matricula enrollment, Materia subject) {
        if (!detalleRepository.existsByMatriculaIdAndMateriaId(enrollment.getId(), subject.getId())) {
            detalleRepository.save(DetalleMatricula.builder().matricula(enrollment).materia(subject)
                .fechaRegistro(LocalDate.now()).estado(true).build());
        }
    }

    private void assignment(Docente teacher, Curso course, PeriodoAcademico period) {
        if (!asignacionRepository.existsByDocenteIdAndCursoIdAndPeriodoAcademicoId(teacher.getId(), course.getId(), period.getId())) {
            asignacionRepository.save(AsignacionDocente.builder().docente(teacher).curso(course)
                .periodoAcademico(period).fechaAsignacion(LocalDate.of(2026, 3, 2))
                .estado(EstadoAsignacionDocente.ACTIVA).build());
        }
    }

    private void link(Estudiante student, PadreFamilia parent, String relationship, boolean main) {
        if (!vinculoRepository.existsByEstudianteIdAndPadreFamiliaId(student.getId(), parent.getId())) {
            vinculoRepository.save(EstudianteApoderado.builder().estudiante(student).padreFamilia(parent)
                .parentesco(relationship).principal(main).estado(true).build());
        }
    }

    private void seedGrades(Estudiante student, Curso course, PeriodoAcademico period, Usuario teacher, List<Integer> scores) {
        List<TipoEvaluacion> types = List.of(TipoEvaluacion.PRACTICA, TipoEvaluacion.EXAMEN, TipoEvaluacion.TAREA, TipoEvaluacion.PARTICIPACION);
        BigDecimal total = BigDecimal.ZERO;
        for (int i = 0; i < types.size(); i++) {
            TipoEvaluacion type = types.get(i);
            Evaluacion evaluation = evaluacionRepository.findByCursoIdAndPeriodoAcademicoIdOrderByOrdenAsc(course.getId(), period.getId())
                .stream().filter(item -> item.getTipo() == type).findFirst()
                .orElseGet(() -> evaluacionRepository.save(Evaluacion.builder().curso(course).periodoAcademico(period)
                    .nombre(type.name()).tipo(type).peso(new BigDecimal("25.00")).orden(types.indexOf(type) + 1).publicada(true).build()));
            BigDecimal score = BigDecimal.valueOf(scores.get(i));
            total = total.add(score);
            if (!notaRepository.existsByEstudianteIdAndEvaluacionId(student.getId(), evaluation.getId())) {
                notaRepository.save(Nota.builder().estudiante(student).evaluacion(evaluation).registradoPor(teacher)
                    .valor(score).observacion("Nota de ejemplo").build());
            }
        }
        BigDecimal average = total.divide(BigDecimal.valueOf(types.size()), 2, java.math.RoundingMode.HALF_UP);
        PromedioAcademico row = promedioRepository.findByEstudianteIdAndCursoIdAndPeriodoAcademicoId(student.getId(), course.getId(), period.getId())
            .orElseGet(() -> PromedioAcademico.builder().estudiante(student).curso(course).periodoAcademico(period).build());
        row.setPromedio(average);
        row.setPublicado(true);
        promedioRepository.save(row);
    }
}
