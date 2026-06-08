package pe.edu.aduniplus.backend.portal;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.aduniplus.backend.security.AuthenticatedUser;
import java.util.List;

@RestController
@RequestMapping("/portal")
@RequiredArgsConstructor
public class PortalController {
    private final AcademicPortalService portalService;

    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public AdminDashboardDto adminDashboard() {
        return portalService.getAdminDashboard();
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<UserRowDto> adminUsers() {
        return portalService.getAdminUsers();
    }

    @GetMapping("/admin/academic-levels")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<AcademicLevelDto> adminAcademicLevels() {
        return portalService.getAdminAcademicLevels();
    }

    @GetMapping("/admin/supervision")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<TeacherProgressDto> adminSupervision() {
        return portalService.getAdminSupervision();
    }

    @GetMapping("/admin/institution")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public AdminInstitutionDto adminInstitution() {
        return portalService.getAdminInstitution();
    }

    @GetMapping("/teacher/dashboard")
    @PreAuthorize("hasRole('DOCENTE')")
    public TeacherDashboardDto teacherDashboard(@AuthenticationPrincipal AuthenticatedUser user) {
        return portalService.getTeacherDashboard(user.personaId());
    }

    @GetMapping("/teacher/grades")
    @PreAuthorize("hasRole('DOCENTE')")
    public TeacherGradesDto teacherGrades(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam(required = false) Long assignmentId
    ) {
        return portalService.getTeacherGrades(user.personaId(), assignmentId);
    }

    @PutMapping("/teacher/grades")
    @PreAuthorize("hasRole('DOCENTE')")
    public OperationMessageDto saveTeacherGrades(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestBody SaveGradesRequest request
    ) {
        return portalService.saveTeacherGrades(user.personaId(), user.userId(), request);
    }

    @GetMapping("/teacher/import-context")
    @PreAuthorize("hasRole('DOCENTE')")
    public TeacherImportContextDto teacherImportContext(@AuthenticationPrincipal AuthenticatedUser user) {
        return portalService.getTeacherImportContext(user.personaId());
    }

    @PostMapping(value = "/teacher/import-excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('DOCENTE')")
    public ExcelImportResultDto importExcel(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam Long assignmentId,
        @RequestParam("file") MultipartFile file
    ) {
        return portalService.importTeacherExcel(user.personaId(), user.userId(), assignmentId, file);
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public StudentPortalDto studentPortal(@AuthenticationPrincipal AuthenticatedUser user) {
        return portalService.getStudentPortal(user.personaId());
    }

    @GetMapping("/family")
    @PreAuthorize("hasRole('PADRE_FAMILIA')")
    public FamilyPortalDto familyPortal(@AuthenticationPrincipal AuthenticatedUser user) {
        return portalService.getFamilyPortal(user.personaId());
    }
}
