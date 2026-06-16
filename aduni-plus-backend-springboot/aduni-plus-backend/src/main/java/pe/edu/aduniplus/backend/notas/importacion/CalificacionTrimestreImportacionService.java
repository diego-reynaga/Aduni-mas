package pe.edu.aduniplus.backend.notas.importacion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.aduniplus.backend.academico.AsignacionDocente;
import pe.edu.aduniplus.backend.academico.Curso;
import pe.edu.aduniplus.backend.academico.Matricula;
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
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ResultadoImportacionTrimestreDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasTrimestreMetadataDTO;
import pe.edu.aduniplus.backend.usuario.Usuario;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalificacionTrimestreImportacionService {
    private final UsuarioRepository usuarioRepository;
    private final ImportacionNotasRepository importacionNotasRepository;
    private final ErrorImportacionExcelRepository errorImportacionExcelRepository;
    private final CalificacionDetalleTrimestreRepository detalleRepository;
    private final CalificacionCompetenciaTrimestreRepository competenciaRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final NotaRepository notaRepository;
    private final PromedioAcademicoRepository promedioAcademicoRepository;
    private final AuditoriaRepository auditoriaRepository;

    @Transactional
    public ResultadoImportacionTrimestreDTO confirmar(
        RegistroNotasTrimestreValidationResult validation,
        Long userId,
        String originalFilename,
        String fileHash
    ) {
        if (validation.tieneErroresCriticos()) {
            throw new IllegalArgumentException("La importación tiene errores críticos. Revise la previsualización antes de confirmar.");
        }
        if (validation.asignacionDocente() == null || validation.curso() == null || validation.periodoAcademico() == null) {
            throw new IllegalArgumentException("No se encontró curso, periodo o asignación docente válida para confirmar.");
        }

        Usuario user = usuarioRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        RegistroNotasTrimestreMetadataDTO metadata = validation.parseResult().metadata();
        PeriodoExcel trimestre = validation.parseResult().trimestre();
        AsignacionDocente assignment = validation.asignacionDocente();

        ImportacionNotas batch = importacionNotasRepository.save(ImportacionNotas.builder()
            .docente(assignment.getDocente())
            .curso(validation.curso())
            .periodoAcademico(validation.periodoAcademico())
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
            .trimestre(trimestre.name())
            .periodosImportados(trimestre.nombre())
            .estado(EstadoImportacionNotas.PENDIENTE)
            .detalle("Confirmando importación de " + trimestre.nombre() + ".")
            .build());

        List<ErrorImportacionDTO> allErrors = collectErrors(validation);
        saveErrors(batch, allErrors);

        Evaluacion finalEvaluation = ensureFinalEvaluation(validation.curso(), validation.periodoAcademico(), trimestre);
        int savedDetails = 0;
        int savedCompetences = 0;
        int savedFinals = 0;
        int importedRows = 0;

        for (RegistroNotasTrimestreValidatedStudent row : validation.estudiantes()) {
            if (!row.importable()) {
                continue;
            }

            Matricula matricula = row.matricula();
            int rowDetails = 0;
            for (RegistroNotasCompetenciaParsed competence : row.parsed().competencias()) {
                upsertCompetence(validation, batch, matricula, competence);
                savedCompetences++;

                for (RegistroNotasNotaParsed note : competence.notas()) {
                    if (!note.valida()) {
                        continue;
                    }
                    upsertDetail(validation, batch, matricula, competence, note, row.parsed().filaExcel());
                    savedDetails++;
                    rowDetails++;
                }
            }

            if (row.parsed().promedioFinalTrimestre() != null) {
                upsertFinalGrade(row, validation, finalEvaluation, user, batch);
                refreshAverage(row, validation, row.parsed().promedioFinalTrimestre());
                savedFinals++;
            }

            if (rowDetails > 0 || row.parsed().promedioFinalTrimestre() != null) {
                importedRows++;
            }
        }

        int rowsWithError = (int) validation.preview().estudiantes().stream()
            .filter((row) -> !row.errores().isEmpty())
            .count();
        String message = "Importación de " + trimestre.nombre() + " confirmada: " + importedRows
            + " estudiantes, " + savedDetails + " notas individuales, "
            + savedCompetences + " competencias y " + savedFinals + " promedios finales guardados.";

        batch.setTotalRegistros(validation.preview().estudiantes().size());
        batch.setRegistrosValidos(importedRows);
        batch.setRegistrosObservados(rowsWithError);
        batch.setEstado(rowsWithError == 0 ? EstadoImportacionNotas.PROCESADA : EstadoImportacionNotas.OBSERVADA);
        batch.setDetalle(message);
        importacionNotasRepository.save(batch);

        audit(
            "CONFIRMAR_IMPORTACION_NOTAS_TRIMESTRE",
            "importaciones_notas",
            batch.getId(),
            user,
            "Archivo " + originalFilename + ". Trimestre: " + trimestre.name()
                + ". Notas: " + savedDetails + ", competencias: " + savedCompetences + ", finales: " + savedFinals + "."
        );

        return new ResultadoImportacionTrimestreDTO(
            message,
            batch.getId(),
            trimestre.name(),
            validation.preview().estudiantes().size(),
            importedRows,
            rowsWithError,
            savedDetails,
            savedCompetences,
            savedFinals,
            allErrors
        );
    }

    private void upsertDetail(
        RegistroNotasTrimestreValidationResult validation,
        ImportacionNotas batch,
        Matricula matricula,
        RegistroNotasCompetenciaParsed competence,
        RegistroNotasNotaParsed note,
        int filaExcel
    ) {
        CalificacionDetalleTrimestre detail = detalleRepository
            .findByMatriculaIdAndCursoIdAndTrimestreAndNumeroCompetenciaAndColumnaExcel(
                matricula.getId(),
                validation.curso().getId(),
                validation.parseResult().trimestre(),
                competence.numero(),
                note.columnaExcel()
            ).orElseGet(() -> CalificacionDetalleTrimestre.builder()
                .matricula(matricula)
                .curso(validation.curso())
                .periodoAcademico(validation.periodoAcademico())
                .trimestre(validation.parseResult().trimestre())
                .numeroCompetencia(competence.numero())
                .columnaExcel(note.columnaExcel())
                .build());

        detail.setNombreCompetencia(trim(competence.nombre(), 255));
        detail.setNombreNota(trim(note.nombreNota(), 100));
        detail.setValorNota(note.valor() == null ? null : note.valor().setScale(2, RoundingMode.HALF_UP));
        detail.setFilaExcel(filaExcel);
        detail.setImportacionNotas(batch);
        detalleRepository.save(detail);
    }

    private void upsertCompetence(
        RegistroNotasTrimestreValidationResult validation,
        ImportacionNotas batch,
        Matricula matricula,
        RegistroNotasCompetenciaParsed competence
    ) {
        CalificacionCompetenciaTrimestre summary = competenciaRepository
            .findByMatriculaIdAndCursoIdAndTrimestreAndNumeroCompetencia(
                matricula.getId(),
                validation.curso().getId(),
                validation.parseResult().trimestre(),
                competence.numero()
            ).orElseGet(() -> CalificacionCompetenciaTrimestre.builder()
                .matricula(matricula)
                .curso(validation.curso())
                .periodoAcademico(validation.periodoAcademico())
                .trimestre(validation.parseResult().trimestre())
                .numeroCompetencia(competence.numero())
                .build());

        summary.setNombreCompetencia(trim(competence.nombre(), 255));
        summary.setPromedioCompetencia(competence.promedioCompetencia() == null ? null : competence.promedioCompetencia().setScale(2, RoundingMode.HALF_UP));
        summary.setLogroLiteral(competence.logroLiteral());
        summary.setImportacionNotas(batch);
        competenciaRepository.save(summary);
    }

    private void upsertFinalGrade(
        RegistroNotasTrimestreValidatedStudent row,
        RegistroNotasTrimestreValidationResult validation,
        Evaluacion evaluation,
        Usuario user,
        ImportacionNotas batch
    ) {
        Nota note = notaRepository.findByEstudianteIdAndEvaluacionId(row.estudiante().getId(), evaluation.getId())
            .orElseGet(() -> Nota.builder()
                .estudiante(row.estudiante())
                .evaluacion(evaluation)
                .asignacionDocente(validation.asignacionDocente())
                .registradoPor(user)
                .build());

        note.setValor(row.parsed().promedioFinalTrimestre().setScale(2, RoundingMode.HALF_UP));
        note.setObservacion("Promedio final importado desde " + validation.parseResult().trimestre().nombre());
        note.setImportacionNotas(batch);
        note.setAsignacionDocente(validation.asignacionDocente());
        note.setRegistradoPor(user);
        notaRepository.save(note);
    }

    private void refreshAverage(
        RegistroNotasTrimestreValidatedStudent row,
        RegistroNotasTrimestreValidationResult validation,
        BigDecimal score
    ) {
        PromedioAcademico average = promedioAcademicoRepository.findByEstudianteIdAndCursoIdAndPeriodoAcademicoId(
            row.estudiante().getId(),
            validation.curso().getId(),
            validation.periodoAcademico().getId()
        ).orElseGet(() -> PromedioAcademico.builder()
            .estudiante(row.estudiante())
            .curso(validation.curso())
            .periodoAcademico(validation.periodoAcademico())
            .build());

        average.setPromedio(score.setScale(2, RoundingMode.HALF_UP));
        average.setPublicado(true);
        promedioAcademicoRepository.save(average);
    }

    private Evaluacion ensureFinalEvaluation(Curso curso, PeriodoAcademico period, PeriodoExcel trimestre) {
        String name = "PROMEDIO FINAL " + trimestre.nombre();
        return evaluacionRepository.findByCursoIdAndPeriodoAcademicoIdOrderByOrdenAsc(curso.getId(), period.getId()).stream()
            .filter((item) -> NombreNormalizador.normalizar(item.getNombre()).equals(NombreNormalizador.normalizar(name)))
            .findFirst()
            .orElseGet(() -> evaluacionRepository.save(Evaluacion.builder()
                .curso(curso)
                .periodoAcademico(period)
                .nombre(name)
                .tipo(TipoEvaluacion.OTRO)
                .peso(BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP))
                .orden(90 + trimestre.orden())
                .publicada(true)
                .build()));
    }

    private List<ErrorImportacionDTO> collectErrors(RegistroNotasTrimestreValidationResult validation) {
        List<ErrorImportacionDTO> result = new ArrayList<>(validation.preview().errores());
        validation.preview().estudiantes().stream()
            .flatMap((row) -> row.errores().stream())
            .forEach(result::add);
        return List.copyOf(result);
    }

    private void saveErrors(ImportacionNotas batch, List<ErrorImportacionDTO> errors) {
        for (ErrorImportacionDTO error : errors) {
            errorImportacionExcelRepository.save(ErrorImportacionExcel.builder()
                .importacionNotas(batch)
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
