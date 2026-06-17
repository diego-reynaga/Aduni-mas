package pe.edu.aduniplus.backend.notas.importacion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.aduniplus.backend.auditoria.Auditoria;
import pe.edu.aduniplus.backend.auditoria.AuditoriaRepository;
import pe.edu.aduniplus.backend.notas.ImportacionNotas;
import pe.edu.aduniplus.backend.notas.ImportacionNotasRepository;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ErrorImportacionDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ImportacionNotasDetalleDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ImportacionNotasHistorialDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasMetadataDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasPreviewResponse;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasTrimestrePreviewResponse;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ResultadoImportacionDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ResultadoImportacionTrimestreDTO;
import pe.edu.aduniplus.backend.security.AuthenticatedUser;
import pe.edu.aduniplus.backend.usuario.Usuario;
import pe.edu.aduniplus.backend.usuario.UsuarioRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistroNotasExcelService {
    private static final long MAX_FILE_SIZE = 10L * 1024L * 1024L;
    private static final DateTimeFormatter DATE_TIME_UI = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final RegistroNotasExcelParser parser;
    private final RegistroNotasTrimestreParser trimestreParser;
    private final RegistroNotasValidacionService validacionService;
    private final RegistroNotasTrimestreValidacionService trimestreValidacionService;
    private final CalificacionImportacionService calificacionImportacionService;
    private final CalificacionTrimestreImportacionService calificacionTrimestreImportacionService;
    private final ImportacionNotasRepository importacionNotasRepository;
    private final ErrorImportacionExcelRepository errorImportacionExcelRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaRepository auditoriaRepository;

    @Transactional
    public RegistroNotasPreviewResponse preview(MultipartFile file, AuthenticatedUser user) {
        byte[] content = readFile(file);
        RegistroNotasValidationResult validation = validacionService.validar(parser.parse(content), user);
        audit(
            "PREVISUALIZAR_IMPORTACION_NOTAS",
            "importacion_excel",
            null,
            user.userId(),
            "Archivo " + originalFilename(file) + ". Filas detectadas: " + validation.preview().resumen().totalFilas()
                + ", errores: " + validation.preview().resumen().filasConError() + "."
        );
        return validation.preview();
    }

    @Transactional
    public ResultadoImportacionDTO confirmar(MultipartFile file, AuthenticatedUser user) {
        byte[] content = readFile(file);
        RegistroNotasValidationResult validation = validacionService.validar(parser.parse(content), user);
        return calificacionImportacionService.confirmar(validation, user.userId(), originalFilename(file), hashSha256(content));
    }

    @Transactional
    public RegistroNotasTrimestrePreviewResponse previewTrimestre(
        MultipartFile file,
        PeriodoExcel trimestre,
        Long assignmentId,
        Long cursoId,
        AuthenticatedUser user
    ) {
        byte[] content = readFile(file);
        RegistroNotasTrimestreValidationResult validation = trimestreValidacionService.validar(
            trimestreParser.parse(content, trimestre),
            user,
            assignmentId,
            cursoId
        );
        audit(
            "PREVISUALIZAR_IMPORTACION_NOTAS_TRIMESTRE",
            "importacion_excel",
            null,
            user.userId(),
            "Archivo " + originalFilename(file) + ". Trimestre: " + trimestre.name()
                + ". Estudiantes: " + validation.preview().estudiantes().size() + "."
        );
        return validation.preview();
    }

    @Transactional
    public ResultadoImportacionTrimestreDTO confirmarTrimestre(
        MultipartFile file,
        PeriodoExcel trimestre,
        Long assignmentId,
        Long cursoId,
        AuthenticatedUser user
    ) {
        byte[] content = readFile(file);
        RegistroNotasTrimestreValidationResult validation = trimestreValidacionService.validar(
            trimestreParser.parse(content, trimestre),
            user,
            assignmentId,
            cursoId
        );
        return calificacionTrimestreImportacionService.confirmar(validation, user.userId(), originalFilename(file), hashSha256(content));
    }

    @Transactional(readOnly = true)
    public List<ImportacionNotasHistorialDTO> listarImportaciones(AuthenticatedUser user) {
        List<ImportacionNotas> rows = hasRole(user, "ADMINISTRADOR")
            ? importacionNotasRepository.findAllByOrderByCreadoEnDesc()
            : importacionNotasRepository.findByDocenteIdOrderByCreadoEnDesc(user.personaId());

        return rows.stream()
            .map(this::toHistory)
            .toList();
    }

    @Transactional(readOnly = true)
    public ImportacionNotasDetalleDTO obtenerImportacion(Long id, AuthenticatedUser user) {
        ImportacionNotas batch = loadAuthorizedImport(id, user);
        return new ImportacionNotasDetalleDTO(
            batch.getId(),
            batch.getNombreArchivo(),
            safe(batch.getTrimestre()),
            metadata(batch),
            batch.getUsuarioResponsable().getUsername(),
            formatDateTime(batch.getCreadoEn()),
            batch.getEstado().name(),
            value(batch.getTotalRegistros()),
            value(batch.getRegistrosValidos()),
            value(batch.getRegistrosObservados()),
            safe(batch.getDetalle())
        );
    }

    @Transactional(readOnly = true)
    public List<ErrorImportacionDTO> listarErrores(Long id, AuthenticatedUser user) {
        loadAuthorizedImport(id, user);
        return errorImportacionExcelRepository.findByImportacionNotasIdOrderByFilaExcelAscIdAsc(id).stream()
            .map((error) -> new ErrorImportacionDTO(
                error.getFilaExcel(),
                error.getEstudianteTexto(),
                error.getCampo(),
                error.getDescripcionError(),
                false
            ))
            .toList();
    }

    private byte[] readFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar un archivo Excel.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("El archivo supera el máximo permitido de 10MB.");
        }
        String name = originalFilename(file).toLowerCase();
        if (!name.endsWith(".xlsx")) {
            throw new IllegalArgumentException("El archivo debe tener formato .xlsx.");
        }

        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new IllegalArgumentException("No se pudo leer el archivo cargado.");
        }
    }

    private ImportacionNotas loadAuthorizedImport(Long id, AuthenticatedUser user) {
        ImportacionNotas batch = importacionNotasRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Importación no encontrada."));
        if (!hasRole(user, "ADMINISTRADOR") && !batch.getDocente().getId().equals(user.personaId())) {
            throw new IllegalArgumentException("No tiene permiso para revisar esta importación.");
        }
        return batch;
    }

    private ImportacionNotasHistorialDTO toHistory(ImportacionNotas batch) {
        return new ImportacionNotasHistorialDTO(
            batch.getId(),
            batch.getNombreArchivo(),
            safe(batch.getTrimestre()),
            batch.getAnio(),
            safe(batch.getAreaCurricular(), batch.getCurso().getMateria().getNombre()),
            safe(batch.getGrado(), batch.getCurso().getGrado().getNombre()),
            safe(batch.getSeccion(), batch.getCurso().getGrado().getParalelo()),
            safe(batch.getDocenteExcel(), fullName(batch.getDocente())),
            batch.getUsuarioResponsable().getUsername(),
            formatDateTime(batch.getCreadoEn()),
            batch.getEstado().name(),
            value(batch.getTotalRegistros()),
            value(batch.getRegistrosValidos()),
            value(batch.getRegistrosObservados()),
            safe(batch.getDetalle())
        );
    }

    private RegistroNotasMetadataDTO metadata(ImportacionNotas batch) {
        return new RegistroNotasMetadataDTO(
            batch.getAnio(),
            safe(batch.getNivel()),
            safe(batch.getInstitucion()),
            safe(batch.getLugar()),
            safe(batch.getAreaCurricular(), batch.getCurso().getMateria().getNombre()),
            safe(batch.getDocenteExcel(), fullName(batch.getDocente())),
            safe(batch.getGrado(), batch.getCurso().getGrado().getNombre()),
            safe(batch.getSeccion(), batch.getCurso().getGrado().getParalelo())
        );
    }

    private void audit(String action, String entity, Long entityId, Long userId, String detail) {
        Usuario user = usuarioRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        auditoriaRepository.save(Auditoria.builder()
            .accion(action)
            .entidad(entity)
            .entidadId(entityId)
            .usuario(user)
            .usuarioResponsable(user.getUsername())
            .detalle(detail)
            .build());
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

    private boolean hasRole(AuthenticatedUser user, String role) {
        return user != null && user.roles().stream().anyMatch(role::equals);
    }

    private String originalFilename(MultipartFile file) {
        String name = file == null ? null : file.getOriginalFilename();
        return name == null || name.isBlank() ? "registro_notas.xlsx" : name.trim();
    }

    private String fullName(pe.edu.aduniplus.backend.persona.Persona person) {
        return (safe(person.getApellidos()) + " " + safe(person.getNombres())).replaceAll("\\s+", " ").trim();
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime == null ? "-" : DATE_TIME_UI.format(dateTime);
    }

    private int value(Integer value) {
        return value == null ? 0 : value;
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
