package pe.edu.aduniplus.backend.notas.importacion;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ErrorImportacionDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ImportacionNotasDetalleDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ImportacionNotasHistorialDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasPreviewResponse;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.RegistroNotasTrimestrePreviewResponse;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ResultadoImportacionDTO;
import pe.edu.aduniplus.backend.notas.importacion.RegistroNotasDtos.ResultadoImportacionTrimestreDTO;
import pe.edu.aduniplus.backend.security.AuthenticatedUser;
import java.util.List;

@RestController
@RequestMapping("/notas")
@RequiredArgsConstructor
public class RegistroNotasExcelController {
    private final RegistroNotasExcelService registroNotasExcelService;

    @PostMapping(value = "/importar-excel/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('DOCENTE', 'ADMINISTRADOR')")
    public RegistroNotasPreviewResponse preview(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam("file") MultipartFile file
    ) {
        return registroNotasExcelService.preview(file, user);
    }

    @PostMapping(value = "/importar-excel/confirmar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('DOCENTE', 'ADMINISTRADOR')")
    public ResultadoImportacionDTO confirmar(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam("file") MultipartFile file
    ) {
        return registroNotasExcelService.confirmar(file, user);
    }

    @PostMapping(value = "/importar-trimestre/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('DOCENTE', 'ADMINISTRADOR')")
    public RegistroNotasTrimestrePreviewResponse previewTrimestre(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam("file") MultipartFile file,
        @RequestParam PeriodoExcel trimestre,
        @RequestParam(required = false) Long assignmentId,
        @RequestParam(required = false) Long cursoId
    ) {
        return registroNotasExcelService.previewTrimestre(file, trimestre, assignmentId, cursoId, user);
    }

    @PostMapping(value = "/importar-trimestre/confirmar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('DOCENTE', 'ADMINISTRADOR')")
    public ResultadoImportacionTrimestreDTO confirmarTrimestre(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam("file") MultipartFile file,
        @RequestParam PeriodoExcel trimestre,
        @RequestParam(required = false) Long assignmentId,
        @RequestParam(required = false) Long cursoId
    ) {
        return registroNotasExcelService.confirmarTrimestre(file, trimestre, assignmentId, cursoId, user);
    }

    @GetMapping("/importaciones")
    @PreAuthorize("hasAnyRole('DOCENTE', 'ADMINISTRADOR')")
    public List<ImportacionNotasHistorialDTO> listarImportaciones(@AuthenticationPrincipal AuthenticatedUser user) {
        return registroNotasExcelService.listarImportaciones(user);
    }

    @GetMapping("/importaciones/{id}")
    @PreAuthorize("hasAnyRole('DOCENTE', 'ADMINISTRADOR')")
    public ImportacionNotasDetalleDTO obtenerImportacion(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long id
    ) {
        return registroNotasExcelService.obtenerImportacion(id, user);
    }

    @GetMapping("/importaciones/{id}/errores")
    @PreAuthorize("hasAnyRole('DOCENTE', 'ADMINISTRADOR')")
    public List<ErrorImportacionDTO> listarErrores(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long id
    ) {
        return registroNotasExcelService.listarErrores(id, user);
    }
}
