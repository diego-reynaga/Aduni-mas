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
