export type RoleName = 'ADMINISTRADOR' | 'DOCENTE' | 'ESTUDIANTE' | 'PADRE_FAMILIA';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  roles: string[];
}

export interface Session {
  token: string;
  username: string;
  roles: RoleName[];
  preferredRole: RoleName;
  issuedAt: string;
}

export interface Metric {
  label: string;
  value: string;
  detail: string;
  tone: 'maroon' | 'forest' | 'gold' | 'ink';
}

export interface UserRow {
  codigo: string;
  persona: string;
  documento: string;
  rol: RoleName;
  correo: string;
  estado: 'Activo' | 'Pendiente' | 'Inactivo';
  ultimoAcceso: string;
}

export interface TeacherProgress {
  docente: string;
  codigo: string;
  area: string;
  curso: string;
  grado: string;
  periodo: string;
  avance: number;
  estado: 'Completo' | 'En proceso' | 'Pendiente';
}

export interface AcademicLevel {
  nivel: string;
  turno: string;
  descripcion: string;
  grados: string[];
  materias: string[];
}

export interface CourseAssignment {
  assignmentId: number;
  codigo: string;
  curso: string;
  grado: string;
  seccion: string;
  periodo: string;
  estudiantes: number;
  evaluaciones: number;
  avance: number;
  estado: 'ACTIVA' | 'CERRADA';
}

export interface GradeEntry {
  codigo: string;
  estudiante: string;
  practica: number;
  examen: number;
  tarea: number;
  participacion: number;
  promedio: number;
  observacion: string;
}

export interface StudentCourseReport {
  curso: string;
  periodo: string;
  practica: number;
  examen: number;
  tarea: number;
  promedio: number;
  estado: 'Publicado' | 'En revision';
}

export interface FamilyStudent {
  codigo: string;
  estudiante: string;
  grado: string;
  parentesco: string;
  promedioGeneral: number;
}

export interface AuditEntry {
  accion: string;
  entidad: string;
  responsable: string;
  fecha: string;
  detalle: string;
}

export interface InstitutionConfig {
  nombre: string;
  ruc: string;
  telefono: string;
  direccion: string;
  correoInstitucional: string;
  sitioWeb: string;
  logoUrl: string;
}

export interface AdminDashboardPayload {
  metrics: Metric[];
  progress: TeacherProgress[];
  audits: AuditEntry[];
}

export interface AdminInstitutionPayload {
  config: InstitutionConfig;
  audits: AuditEntry[];
}

export interface TeacherDashboardPayload {
  metrics: Metric[];
  courses: CourseAssignment[];
}

export interface TeacherGradesPayload {
  assignmentId: number | null;
  selectedCourse: CourseAssignment | null;
  rows: GradeEntry[];
}

export interface GradeEntryInput {
  codigo: string;
  practica: number;
  examen: number;
  tarea: number;
  participacion: number;
  observacion: string;
}

export interface ImportBatch {
  archivo: string;
  periodo: string;
  estado: string;
  fecha: string;
  detalle: string;
}

export interface TeacherImportContextPayload {
  courses: CourseAssignment[];
  history: ImportBatch[];
}

export interface MessagePayload {
  message: string;
}

export interface ExcelImportResult {
  message: string;
  totalRegistros: number;
  registrosValidos: number;
  registrosObservados: number;
  estudiantesEncontrados: number;
  estudiantesCreados: number;
  nuevasMatriculas: number;
  observaciones: string[];
}

export interface RegistroNotasMetadata {
  anio: number | null;
  nivel: string;
  institucion: string;
  lugar: string;
  areaCurricular: string;
  docente: string;
  grado: string;
  seccion: string;
}

export type TrimestreImportacion = 'I_TRIMESTRE' | 'II_TRIMESTRE' | 'III_TRIMESTRE';

export interface RegistroNotasTrimestreMetadata extends RegistroNotasMetadata {
  trimestre: TrimestreImportacion;
}

export interface RegistroNotasResumen {
  totalFilas: number;
  estudiantesEncontrados: number;
  estudiantesNoEncontrados: number;
  filasConError: number;
  filasImportables: number;
}

export interface ErrorImportacionNotas {
  filaExcel: number | null;
  estudianteTexto: string | null;
  campo: string;
  descripcionError: string;
  critico: boolean;
}

export interface NotaIndividualTrimestre {
  columnaExcel: string;
  nombreNota: string;
  valor: number | null;
}

export interface CompetenciaTrimestre {
  numero: number;
  nombre: string;
  notas: NotaIndividualTrimestre[];
  promedioCompetencia: number | null;
  logroLiteral: string | null;
}

export interface ResumenEstadisticoTrimestre {
  matriculados: number;
  evaluados: number;
  noEvaluados: number;
  aprobados: number;
  desaprobados: number;
  nivelAD: number;
  nivelA: number;
  nivelB: number;
  nivelC: number;
  porcentajeAD: number;
  porcentajeA: number;
  porcentajeB: number;
  porcentajeC: number;
}

export interface EstudianteTrimestrePreview {
  filaExcel: number;
  numeroOrden: number | null;
  nombreExcel: string;
  idEstudiante: number | null;
  codigoEstudiante: string | null;
  estadoMapeo: 'ENCONTRADO' | 'NO_ENCONTRADO';
  competencias: CompetenciaTrimestre[];
  promedioFinalTrimestre: number | null;
  logroFinalTrimestre: string | null;
  errores: ErrorImportacionNotas[];
}

export interface RegistroNotasTrimestrePreviewResponse {
  metadata: RegistroNotasTrimestreMetadata;
  resumen: ResumenEstadisticoTrimestre;
  estudiantes: EstudianteTrimestrePreview[];
  errores: ErrorImportacionNotas[];
  bloqueante: boolean;
}

export interface EstudianteNotaPreview {
  filaExcel: number;
  numeroOrden: number | null;
  nombreExcel: string;
  idEstudiante: number | null;
  codigoEstudiante: string | null;
  estadoMapeo: 'ENCONTRADO' | 'NO_ENCONTRADO';
  iTrimestre: number | null;
  iiTrimestre: number | null;
  iiiTrimestre: number | null;
  promedioAnual: number | null;
  logroLiteral: string;
  situacionFinal: string;
  errores: ErrorImportacionNotas[];
}

export interface RegistroNotasPreviewResponse {
  metadata: RegistroNotasMetadata;
  resumen: RegistroNotasResumen;
  estudiantes: EstudianteNotaPreview[];
  errores: ErrorImportacionNotas[];
  bloqueante: boolean;
}

export interface ResultadoImportacionNotas {
  message: string;
  idImportacion: number;
  totalFilas: number;
  totalCorrectas: number;
  totalConError: number;
  calificacionesGuardadas: number;
  errores: ErrorImportacionNotas[];
}

export interface ResultadoImportacionTrimestre {
  message: string;
  idImportacion: number;
  trimestre: TrimestreImportacion;
  totalFilas: number;
  totalCorrectas: number;
  totalConError: number;
  notasIndividualesGuardadas: number;
  competenciasGuardadas: number;
  promediosFinalesGuardados: number;
  errores: ErrorImportacionNotas[];
}

export interface ImportacionNotasHistorial {
  idImportacion: number;
  nombreArchivo: string;
  trimestre: string;
  anio: number | null;
  areaCurricular: string;
  grado: string;
  seccion: string;
  docente: string;
  usuarioResponsable: string;
  fechaImportacion: string;
  estado: string;
  totalFilas: number;
  totalCorrectas: number;
  totalConError: number;
  observacion: string;
}

export interface ImportacionNotasDetalle {
  idImportacion: number;
  nombreArchivo: string;
  trimestre: string;
  metadata: RegistroNotasMetadata;
  usuarioResponsable: string;
  fechaImportacion: string;
  estado: string;
  totalFilas: number;
  totalCorrectas: number;
  totalConError: number;
  observacion: string;
}

export interface StudentPortalPayload {
  metrics: Metric[];
  reports: StudentCourseReport[];
}

export interface FamilyAlert {
  titulo: string;
  detalle: string;
  estado: string;
}

export interface FamilyPortalPayload {
  students: FamilyStudent[];
  reportsByStudent: Record<string, StudentCourseReport[]>;
  alerts: FamilyAlert[];
}

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMINISTRADOR: 'Administrador',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  PADRE_FAMILIA: 'Padre de familia',
};

export const ROLE_HOME: Record<RoleName, string> = {
  ADMINISTRADOR: '/admin',
  DOCENTE: '/docente',
  ESTUDIANTE: '/estudiante',
  PADRE_FAMILIA: '/familia',
};

export const ALL_ROLES: RoleName[] = ['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', 'PADRE_FAMILIA'];

export function normalizeRole(role: string): RoleName {
  const candidate = role.replace(/^ROLE_/, '').toUpperCase();

  if (candidate === 'PADRE' || candidate === 'PADRE_FAMILIA') {
    return 'PADRE_FAMILIA';
  }

  if (candidate === 'DOCENTE') {
    return 'DOCENTE';
  }

  if (candidate === 'ESTUDIANTE') {
    return 'ESTUDIANTE';
  }

  return 'ADMINISTRADOR';
}

export function primaryRole(roles: RoleName[]): RoleName {
  return roles[0] ?? 'ADMINISTRADOR';
}
