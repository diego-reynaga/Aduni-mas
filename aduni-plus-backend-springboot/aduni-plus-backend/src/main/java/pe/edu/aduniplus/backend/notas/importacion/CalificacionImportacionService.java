package pe.edu.aduniplus.backend.notas.importacion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import pe.edu.aduniplus.backend.academico.Curso;
import pe.edu.aduniplus.backend.academico.PeriodoAcademico;
import pe.edu.aduniplus.backend.auditoria.Auditoria;
import pe.edu.aduniplus.backend.auditoria.AuditoriaRepository;
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
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ErrorImportacionDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ResultadoImportacionDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasMetadataDTO;
import pe.edu.aduniplus.backend.persona.Estudiante;
import pe.edu.aduniplus.backend.usuario.Usuario;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CalificacionImportacionService {
    private final UsuarioRepository usuarioRepository;
    private final ImportacionNotasRepository importacionNotasRepository;
    private final ErrorImportacionExcelRepository errorImportacionExcelRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final NotaRepository notaRepository;
    private final PromedioAcademicoRepository promedioAcademicoRepository;
    private final AuditoriaRepository auditoriaRepository;

    @Transactional
    public ResultadoImportacionDTO confirmar(
        RegistroNotasValidationResult validation,
        Long userId,
        String originalFilename,
        String fileHash
    ) {
        if (validation.tieneErroresCriticos()) {
            throw new IllegalArgumentException("La importación tiene errores críticos. Revise la previsualización antes de confirmar.");
        }

        Usuario user = usuarioRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        AsignacionDocente representative = representativeAssignment(validation);
        RegistroNotasMetadataDTO metadata = validation.parseResult().metadata();
        ImportacionNotas batch = importacionNotasRepository.save(ImportacionNotas.builder()
            .asignacionDocente(representative)
            .usuarioResponsable(user)
            .nombreArchivo(originalFilename)
            .hashArchivo(fileHash)
            .anio(metadata.anio())
            .nivel(metadata.nivel())
            .institucion(metadata.institucion())
            .lugar(metadata.lugar())
            .areaCurricular(metadata.areaCurricular())
            .docenteExcel(metadata.docente())
            .grado(metadata.grado())
            .seccion(metadata.seccion())
            .periodosImportados("I TRIMESTRE, II TRIMESTRE, III TRIMESTRE, ANUAL")
            .estado(EstadoImportacionNotas.PENDIENTE)
            .detalle("Confirmando importación de registro auxiliar de evaluación.")
            .build());

        List<ErrorImportacionDTO> allErrors = collectErrors(validation);
        saveErrors(batch, allErrors);

        Map<PeriodoExcel, Evaluacion> evaluations = ensureEvaluations(validation);
        int savedGrades = 0;
        int importedRows = 0;

        for (RegistroNotasValidatedStudent row : validation.estudiantes()) {
            if (!row.importable()) {
                continue;
            }

            Estudiante student = row.estudiante();
            int rowSaved = 0;
            for (PeriodoExcel period : List.of(PeriodoExcel.I_TRIMESTRE, PeriodoExcel.II_TRIMESTRE, PeriodoExcel.III_TRIMESTRE)) {
                BigDecimal score = row.parsed().notas().get(period);
                if (score == null) {
                    continue;
                }
                upsertFinalGrade(student, score, evaluations.get(period), validation.asignaciones().get(period), user, batch);
                refreshAverage(student, validation.curso(), validation.periodos().get(period), score);
                savedGrades++;
                rowSaved++;
            }

            if (row.parsed().promedioAnual() != null) {
                upsertFinalGrade(
                    student,
                    row.parsed().promedioAnual(),
                    evaluations.get(PeriodoExcel.ANUAL),
                    validation.asignaciones().get(PeriodoExcel.ANUAL),
                    user,
                    batch
                );
                refreshAverage(student, validation.curso(), validation.periodos().get(PeriodoExcel.ANUAL), row.parsed().promedioAnual());
                savedGrades++;
                rowSaved++;
            }

            if (rowSaved > 0) {
                importedRows++;
            }
        }

        int totalRows = validation.preview().resumen().totalFilas();
        int rowsWithError = validation.preview().resumen().filasConError();
        String message = "Importación confirmada: " + importedRows + " estudiantes importados, "
            + savedGrades + " calificaciones guardadas y " + rowsWithError + " filas observadas.";

        batch.setTotalRegistros(totalRows);
        batch.setRegistrosValidos(importedRows);
        batch.setRegistrosObservados(rowsWithError);
        batch.setEstado(rowsWithError == 0 ? EstadoImportacionNotas.PROCESADA : EstadoImportacionNotas.OBSERVADA);
        batch.setDetalle(message);
        importacionNotasRepository.save(batch);

        audit(
            "CONFIRMAR_IMPORTACION_NOTAS",
            "importacion_excel",
            batch.getId(),
            user,
            "Archivo " + originalFilename + ". Filas: " + totalRows + ", importadas: " + importedRows
                + ", errores: " + rowsWithError + ", calificaciones: " + savedGrades + "."
        );

        return new ResultadoImportacionDTO(
            message,
            batch.getId(),
            totalRows,
            importedRows,
            rowsWithError,
            savedGrades,
            allErrors
        );
    }

    private AsignacionDocente representativeAssignment(RegistroNotasValidationResult validation) {
        return validation.asignaciones().entrySet().stream()
            .min(Comparator.comparingInt((entry) -> entry.getKey().orden()))
            .map(Map.Entry::getValue)
            .orElseThrow(() -> new IllegalArgumentException("No se encontró una asignación docente válida para guardar notas."));
    }

    private Map<PeriodoExcel, Evaluacion> ensureEvaluations(RegistroNotasValidationResult validation) {
        Map<PeriodoExcel, Evaluacion> result = new EnumMap<>(PeriodoExcel.class);
        for (PeriodoExcel period : PeriodoExcel.values()) {
            PeriodoAcademico academicPeriod = validation.periodos().get(period);
            if (academicPeriod == null) {
                continue;
            }
            result.put(period, ensureEvaluation(validation.curso(), academicPeriod, period));
        }
        return result;
    }

    private Evaluacion ensureEvaluation(Curso curso, PeriodoAcademico period, PeriodoExcel expected) {
        return evaluacionRepository.findByCursoIdAndPeriodoAcademicoIdOrderByOrdenAsc(curso.getId(), period.getId()).stream()
            .filter((item) -> NombreNormalizador.normalizar(item.getNombre()).equals(NombreNormalizador.normalizar(expected.evaluacionNombre())))
            .findFirst()
            .orElseGet(() -> evaluacionRepository.save(Evaluacion.builder()
                .curso(curso)
                .periodoAcademico(period)
                .nombre(expected.evaluacionNombre())
                .tipo(TipoEvaluacion.OTRO)
                .peso(BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP))
                .orden(90 + expected.orden())
                .publicada(true)
                .build()));
    }

    private void upsertFinalGrade(
        Estudiante student,
        BigDecimal score,
        Evaluacion evaluation,
        AsignacionDocente assignment,
        Usuario user,
        ImportacionNotas batch
    ) {
        if (evaluation == null || assignment == null || score == null) {
            return;
        }

        Nota note = notaRepository.findByEstudianteIdAndEvaluacionId(student.getId(), evaluation.getId())
            .orElseGet(() -> Nota.builder()
                .estudiante(student)
                .evaluacion(evaluation)
                .registradoPor(user)
                .build());

        note.setValor(score.setScale(2, RoundingMode.HALF_UP));
        note.setObservacion("Importado desde registro auxiliar Excel");
        note.setImportacionId(batch.getId());
        note.setRegistradoPor(user);
        notaRepository.save(note);
    }

    private void refreshAverage(Estudiante student, Curso course, PeriodoAcademico period, BigDecimal score) {
        if (period == null || score == null) {
            return;
        }

        PromedioAcademico average = promedioAcademicoRepository.findByEstudianteIdAndCursoIdAndPeriodoAcademicoId(
            student.getId(),
            course.getId(),
            period.getId()
        ).orElseGet(() -> PromedioAcademico.builder()
            .estudiante(student)
            .curso(course)
            .periodoAcademico(period)
            .build());

        average.setPromedio(score.setScale(2, RoundingMode.HALF_UP));
        average.setPublicado(true);
        promedioAcademicoRepository.save(average);
    }

    private List<ErrorImportacionDTO> collectErrors(RegistroNotasValidationResult validation) {
        List<ErrorImportacionDTO> result = new ArrayList<>(validation.preview().errores());
        validation.preview().estudiantes().stream()
            .flatMap((row) -> row.errores().stream())
            .forEach(result::add);
        return List.copyOf(result);
    }

    private void saveErrors(ImportacionNotas batch, List<ErrorImportacionDTO> errors) {
        for (ErrorImportacionDTO error : errors) {
            errorImportacionExcelRepository.save(ErrorImportacionExcel.builder()
                .importacionId(batch.getId())
                .filaExcel(error.filaExcel())
                .estudianteTexto(trim(error.estudianteTexto(), 180))
                .campo(trim(error.campo(), 80))
                .descripcionError(trim(error.descripcionError(), 500))
                .build());
        }
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

    private String trim(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.length() <= maxLength ? normalized : normalized.substring(0, maxLength);
    }
}
