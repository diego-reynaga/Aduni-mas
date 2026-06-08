package pe.edu.aduniplus.backend.portal;

import java.util.List;
import java.util.Map;

record MetricDto(
    String label,
    String value,
    String detail,
    String tone
) {}

record AuditEntryDto(
    String accion,
    String entidad,
    String responsable,
    String fecha,
    String detalle
) {}

record TeacherProgressDto(
    String docente,
    String codigo,
    String area,
    String curso,
    String grado,
    String periodo,
    int avance,
    String estado
) {}

record UserRowDto(
    String codigo,
    String persona,
    String documento,
    String rol,
    String correo,
    String estado,
    String ultimoAcceso
) {}

record AcademicLevelDto(
    String nivel,
    String turno,
    String descripcion,
    List<String> grados,
    List<String> materias
) {}

record InstitutionConfigDto(
    String nombre,
    String ruc,
    String telefono,
    String direccion,
    String correoInstitucional,
    String sitioWeb,
    String logoUrl
) {}

record AdminDashboardDto(
    List<MetricDto> metrics,
    List<TeacherProgressDto> progress,
    List<AuditEntryDto> audits
) {}

record AdminInstitutionDto(
    InstitutionConfigDto config,
    List<AuditEntryDto> audits
) {}

record CourseAssignmentDto(
    Long assignmentId,
    String codigo,
    String curso,
    String grado,
    String seccion,
    String periodo,
    int estudiantes,
    int evaluaciones,
    int avance,
    String estado
) {}

record TeacherDashboardDto(
    List<MetricDto> metrics,
    List<CourseAssignmentDto> courses
) {}

record GradeEntryDto(
    String codigo,
    String estudiante,
    double practica,
    double examen,
    double tarea,
    double participacion,
    double promedio,
    String observacion
) {}

record GradeEntryInputDto(
    String codigo,
    Double practica,
    Double examen,
    Double tarea,
    Double participacion,
    String observacion
) {}

record SaveGradesRequest(
    Long assignmentId,
    List<GradeEntryInputDto> rows
) {}

record TeacherGradesDto(
    Long assignmentId,
    CourseAssignmentDto selectedCourse,
    List<GradeEntryDto> rows
) {}

record ImportBatchDto(
    String archivo,
    String periodo,
    String estado,
    String fecha,
    String detalle
) {}

record TeacherImportContextDto(
    List<CourseAssignmentDto> courses,
    List<ImportBatchDto> history
) {}

record OperationMessageDto(
    String message
) {}

record ExcelImportResultDto(
    String message,
    int totalRegistros,
    int registrosValidos,
    int registrosObservados,
    int estudiantesEncontrados,
    int estudiantesCreados,
    int nuevasMatriculas,
    List<String> observaciones
) {}

record StudentCourseReportDto(
    String curso,
    String periodo,
    double practica,
    double examen,
    double tarea,
    double promedio,
    String estado
) {}

record StudentPortalDto(
    List<MetricDto> metrics,
    List<StudentCourseReportDto> reports
) {}

record FamilyStudentDto(
    String codigo,
    String estudiante,
    String grado,
    String parentesco,
    double promedioGeneral
) {}

record FamilyAlertDto(
    String titulo,
    String detalle,
    String estado
) {}

record FamilyPortalDto(
    List<FamilyStudentDto> students,
    Map<String, List<StudentCourseReportDto>> reportsByStudent,
    List<FamilyAlertDto> alerts
) {}
