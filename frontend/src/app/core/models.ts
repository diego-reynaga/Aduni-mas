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
  id: number;
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
  asistencia: StudentAsistenciaResumen;
  estudianteId: number;
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
  asistencia: StudentAsistenciaResumen;
  estudianteId?: number;
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

export interface UsuarioResponse {
  id: number;
  username: string;
  activo: boolean;
  personaId: number;
  roles: string[];
}

export interface UsuarioRequest {
  username: string;
  password?: string;
  personaId: number;
  roles: string[];
}

export interface RolResponse {
  id: number;
  nombre: string;
  creadoEn: string;
  actualizadoEn?: string;
}

export interface RolRequest {
  nombre: string;
}

export interface PersonaDropdown {
  id: number;
  nombreCompleto: string;
  documentoIdentidad: string;
}

export interface PersonaRequest {
  nombres: string;
  apellidos: string;
  documentoIdentidad: string;
  fechaNacimiento?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  tipoPersona: string;
  codigo?: string;
  cargo?: string;
  especialidad?: string;
  areaAcademica?: string;
  ocupacion?: string;
}

export interface PersonaResponse {
  id: number;
  nombres: string;
  apellidos: string;
  documentoIdentidad: string;
  fechaNacimiento?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  tipoPersona: string;
  codigo?: string;
  cargo?: string;
  especialidad?: string;
  areaAcademica?: string;
  ocupacion?: string;
  creadoEn: string;
  actualizadoEn?: string;
}

export interface AuditoriaResponse {
  id: number;
  creadoEn: string;
  accion: string;
  entidad: string;
  entidadId: number | null;
  usuarioResponsable: string;
  detalle: string;
}

export interface PadreFamiliaRequest {
  nombres: string;
  apellidos: string;
  documentoIdentidad: string;
  fechaNacimiento?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  ocupacion?: string;
  activo?: boolean;
}

export interface PadreFamiliaResponse {
  id: number;
  nombres: string;
  apellidos: string;
  documentoIdentidad: string;
  fechaNacimiento?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  ocupacion?: string;
  activo: boolean;
}
export interface EstudianteApoderadoRequest {
  padreFamiliaId: number;
  parentesco: string;
  principal: boolean;
}

export interface EstudianteApoderadoResponse {
  id: number;
  estudianteId: number;
  padreFamiliaId: number;
  padreNombreCompleto: string;
  padreDocumento: string;
  padreTelefono: string;
  padreCorreo: string;
  parentesco: string;
  principal: boolean;
}

export interface ClonarEstructuraRequest {
  gestionOrigenId: number;
  gestionDestinoId: number;
}

// --- Asistencia ---
export type EstadoAsistencia = 'PRESENTE' | 'TARDANZA' | 'FALTA' | 'JUSTIFICADO';

export interface AsistenciaResponse {
  id: number | null;
  personaId: number;
  personaNombre: string;
  personaCodigo: string;
  tipoPersona: string;
  fecha: string;
  horaIngreso: string | null;
  estado: EstadoAsistencia | null;
  asignacionDocenteId: number | null;
  cursoNombre: string | null;
  materiaNombre: string | null;
  periodoNombre: string | null;
  observacion: string | null;
  creadoEn: string | null;
}

export interface AsistenciaIndividualRequest {
  estudianteId: number;
  estado: EstadoAsistencia;
  observacion?: string;
}

export interface AsistenciaBatchRequest {
  asignacionDocenteId: number;
  fecha: string;
  registros: AsistenciaIndividualRequest[];
}

export interface AsistenciaDocenteBatchRequest {
  fecha: string;
  registros: AsistenciaIndividualRequest[];
}

export interface AsistenciaReporteRow {
  personaId: number;
  personaNombre: string;
  personaCodigo: string;
  totalDias: number;
  presentes: number;
  tardanzas: number;
  faltas: number;
  justificados: number;
  porcentajeAsistencia: number;
}

export interface StudentAsistenciaResumen {
  totalDias: number;
  presentes: number;
  tardanzas: number;
  faltas: number;
  justificados: number;
  porcentajeAsistencia: number;
}

// --- Pagos y Cuotas ---
export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO' | 'TARJETA';
export type EstadoCuota = 'PENDIENTE' | 'PAGADO' | 'PARCIAL' | 'VENCIDO' | 'ANULADO';

export interface ConceptoCobroRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface ConceptoCobroResponse {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface CuotaProgramadaRequest {
  numeroCuota: number;
  conceptoCobroId: number;
  fechaVencimiento: string;
  montoProgramado: number;
}

export interface CronogramaRequest {
  estudianteId: number;
  matriculaId?: number;
  gestionAcademicaId?: number;
  cuotas: CuotaProgramadaRequest[];
  observacion?: string;
}

export interface CuotaResponse {
  id: number;
  numeroCuota: number;
  conceptoCobroId: number;
  conceptoCobroNombre: string;
  fechaVencimiento: string;
  montoProgramado: number;
  saldoPendiente: number;
  estado: EstadoCuota;
}

export interface CronogramaResponse {
  id: number;
  estudianteId: number;
  estudianteNombre: string;
  estudianteCodigo: string;
  matriculaId: number | null;
  gestionAcademicaId: number | null;
  totalCuotas: number;
  montoTotal: number;
  observacion: string;
  activo: boolean;
  cuotas: CuotaResponse[];
}

export interface PagoRequest {
  cuotaId?: number;
  cronogramaId?: number;
  estudianteId: number;
  montoPagado: number;
  fechaPago: string;
  metodoPago: MetodoPago;
  numeroComprobante?: string;
  observacion?: string;
}

export interface PagoResponse {
  id: number;
  cuotaId: number | null;
  numeroCuota: number | null;
  cronogramaId: number | null;
  estudianteId: number;
  estudianteNombre: string;
  estudianteCodigo: string;
  montoPagado: number;
  fechaPago: string;
  metodoPago: string;
  numeroComprobante: string;
  observacion: string;
  anulado: boolean;
  fechaAnulacion: string | null;
  motivoAnulacion: string | null;
  reciboGenerado: boolean;
  numeroRecibo: string | null;
}

export interface AnularPagoRequest {
  motivo: string;
}

export interface ReciboResponse {
  id: number;
  pagoId: number;
  numeroRecibo: string;
  monto: number;
  fechaEmision: string;
  rutaPdf: string;
}
