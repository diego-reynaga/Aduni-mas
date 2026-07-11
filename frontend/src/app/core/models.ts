export type RoleName = 'ADMINISTRADOR' | 'DOCENTE' | 'ESTUDIANTE' | 'PADRE_FAMILIA';
export type EntityId = string;

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
  userId: EntityId;
  personaId: EntityId;
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
  id: EntityId;
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
  assignmentId: EntityId;
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

export type CompetencyNumber = 1 | 2 | 3 | 4;

export interface CompetencyCapacity {
  numero: number;
  nombre: string;
}

export interface CompetencyConfig {
  numero: CompetencyNumber;
  nombre: string;
  capacidades: CompetencyCapacity[];
}

export interface StudentCompetencyGrades {
  numero: CompetencyNumber;
  notas: Array<number | null>;
}

export interface GradeEntry {
  estudianteId: EntityId;
  codigo: string;
  estudiante: string;
  competencias: StudentCompetencyGrades[];
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
  assignmentId: EntityId | null;
  selectedCourse: CourseAssignment | null;
  trimestre: TrimestreImportacion;
  competencias: CompetencyConfig[];
  rows: GradeEntry[];
}

export interface TeacherGradesSaveInput {
  trimestre: TrimestreImportacion;
  competencias: CompetencyConfig[];
  estudiantes: Array<{
    estudianteId: EntityId;
    competencias: StudentCompetencyGrades[];
  }>;
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
  numeroCapacidad?: number;
  nombreNota: string;
  valor: number | null;
  activa?: boolean;
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
  idEstudiante: EntityId | null;
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
  idEstudiante: EntityId | null;
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
  idImportacion: EntityId;
  totalFilas: number;
  totalCorrectas: number;
  totalConError: number;
  calificacionesGuardadas: number;
  errores: ErrorImportacionNotas[];
}

export interface ResultadoImportacionTrimestre {
  message: string;
  idImportacion: EntityId;
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
  idImportacion: EntityId;
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
  idImportacion: EntityId;
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

export interface UsuarioResponse {
  id: EntityId;
  username: string;
  activo: boolean;
  personaId: EntityId;
  roles: string[];
  nombreCompleto?: string;
  documentoIdentidad?: string;
  correo?: string;
}

export interface UsuarioRequest {
  username: string;
  password?: string;
  personaId: EntityId;
  roles: string[];
}

export interface RolResponse {
  id: EntityId;
  nombre: string;
  creadoEn: string;
  actualizadoEn?: string;
}

export interface RolRequest {
  nombre: string;
}

export interface PersonaDropdown {
  id: EntityId;
  nombreCompleto: string;
  documentoIdentidad: string;
  correo?: string;
}

export interface PersonaRequest {
  nombres: string;
  apellidos: string;
  documentoIdentidad: string;
  tipoDocumento?: string;
  fechaNacimiento?: string;
  genero?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  activo?: boolean;
  tipoPersona: string;
  codigo?: string;
  cargo?: string;
  especialidad?: string;
  areaAcademica?: string;
  ocupacion?: string;
}

export interface PersonaResponse {
  id: EntityId;
  nombres: string;
  apellidos: string;
  documentoIdentidad: string;
  tipoDocumento?: string;
  fechaNacimiento?: string;
  genero?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  activo: boolean;
  tipoPersona: string;
  subtypeId?: EntityId;
  codigo?: string;
  cargo?: string;
  especialidad?: string;
  areaAcademica?: string;
  ocupacion?: string;
  creadoEn: string;
  actualizadoEn?: string;
  nombreCompleto?: string;
}

export interface StudentAdminRequest {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documentoIdentidad: string;
  fechaNacimiento?: string;
  genero?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  codigoEstudiante?: string;
  activo?: boolean;
}

export interface StudentAdminResponse extends StudentAdminRequest {
  id: EntityId;
  personaId: EntityId;
  codigoEstudiante: string;
  activo: boolean;
}

export interface AuditoriaResponse {
  id: EntityId;
  creadoEn: string;
  accion: string;
  entidad: string;
  entidadId: EntityId | null;
  usuarioResponsable: string;
  detalle: string;
}

export interface AuditFilters {
  usuario?: string;
  accion?: string;
  entidad?: string;
  fechaInicio?: string;
  fechaFin?: string;
  limit?: number;
  offset?: number;
}

export interface AuditPageMeta {
  total: number;
  limit: number;
  offset: number;
  pages: number;
}

export interface AuditPageResponse {
  data: AuditoriaResponse[];
  meta: AuditPageMeta;
}

export type AuditDatePreset = 'hoy' | '7d' | '30d' | 'mes' | 'personalizado';



export interface EstudianteApoderadoRequest {
  padreFamiliaId: EntityId;
  parentesco: string;
  principal: boolean;
}

export interface EstudianteApoderadoResponse {
  id: EntityId;
  estudianteId: EntityId;
  padreFamiliaId: EntityId;
  padreNombreCompleto: string;
  padreDocumento: string;
  padreTelefono: string;
  padreCorreo: string;
  parentesco: string;
  principal: boolean;
}

export interface ClonarEstructuraRequest {
  gestionOrigenId: EntityId;
  gestionDestinoId: EntityId;
}
