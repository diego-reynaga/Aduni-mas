import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { API_URL } from './api.constants';
import * as Academico from './academico.models';
import {
  AcademicLevel,
  AdminDashboardPayload,
  AdminInstitutionPayload,
  FamilyPortalPayload,
  MessagePayload,
  StudentPortalPayload,
  TeacherDashboardPayload,
  TeacherGradesPayload,
  TeacherImportContextPayload,
  TeacherProgress,
  UserRow,
  GradeEntryInput,
  InstitutionConfig,
  UsuarioResponse,
  UsuarioRequest,
  RolResponse,
  RolRequest,
  PersonaDropdown,
  PersonaRequest,
  PersonaResponse,
  AuditoriaResponse,
  EstudianteApoderadoRequest,
  EstudianteApoderadoResponse,
  ClonarEstructuraRequest,
  PadreFamiliaRequest,
  PadreFamiliaResponse
} from './models';


@Injectable({ providedIn: 'root' })
export class PortalService {
  private readonly http = inject(HttpClient);

  adminDashboard(): Observable<AdminDashboardPayload> {
    return this.http.get<AdminDashboardPayload>(`${API_URL}/portal/admin/dashboard`);
  }

  adminUsers(): Observable<UserRow[]> {
    return this.http.get<UserRow[]>(`${API_URL}/portal/admin/users`);
  }

  adminAcademicLevels(): Observable<AcademicLevel[]> {
    return this.http.get<AcademicLevel[]>(`${API_URL}/portal/admin/academic-levels`);
  }

  adminSupervision(): Observable<TeacherProgress[]> {
    return this.http.get<TeacherProgress[]>(`${API_URL}/portal/admin/supervision`);
  }

  adminInstitution(): Observable<AdminInstitutionPayload> {
    return this.http.get<InstitutionConfig>(`${API_URL}/institucion`).pipe(
      switchMap(config =>
        this.getAuditorias({ entidad: 'configuraciones_institucionales' }).pipe(
          map(audits => ({
            config,
            audits: audits.map(a => ({
              accion: a.accion,
              entidad: a.entidad,
              responsable: a.usuarioResponsable,
              fecha: a.creadoEn,
              detalle: a.detalle
            }))
          }))
        )
      )
    );
  }

  saveAdminInstitution(config: InstitutionConfig): Observable<AdminInstitutionPayload> {
    return this.http.put<InstitutionConfig>(`${API_URL}/institucion`, config).pipe(
      map(savedConfig => ({ config: savedConfig, audits: [] }))
    );
  }

  uploadLogo(file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ logoUrl: string }>(`${API_URL}/institucion/upload-logo`, formData);
  }

  // --- Gestiones Academicas ---
  getGestiones(): Observable<Academico.GestionAcademicaResponse[]> {
    return this.http.get<Academico.GestionAcademicaResponse[]>(`${API_URL}/academico/gestiones`);
  }

  createGestion(req: Academico.GestionAcademicaRequest): Observable<Academico.GestionAcademicaResponse> {
    return this.http.post<Academico.GestionAcademicaResponse>(`${API_URL}/academico/gestiones`, req);
  }

  updateGestion(id: number, req: Academico.GestionAcademicaRequest): Observable<Academico.GestionAcademicaResponse> {
    return this.http.put<Academico.GestionAcademicaResponse>(`${API_URL}/academico/gestiones/${id}`, req);
  }

  // --- Periodos Academicos ---
  getPeriodos(gestionId: number): Observable<Academico.PeriodoAcademicoResponse[]> {
    let params = new HttpParams().set('gestionId', gestionId.toString());
    return this.http.get<Academico.PeriodoAcademicoResponse[]>(`${API_URL}/academico/periodos`, { params });
  }

  createPeriodo(req: Academico.PeriodoAcademicoRequest): Observable<Academico.PeriodoAcademicoResponse> {
    return this.http.post<Academico.PeriodoAcademicoResponse>(`${API_URL}/academico/periodos`, req);
  }

  updatePeriodo(id: number, req: Academico.PeriodoAcademicoRequest): Observable<Academico.PeriodoAcademicoResponse> {
    return this.http.put<Academico.PeriodoAcademicoResponse>(`${API_URL}/academico/periodos/${id}`, req);
  }

  teacherDashboard(): Observable<TeacherDashboardPayload> {
    return this.http.get<TeacherDashboardPayload>(`${API_URL}/portal/teacher/dashboard`);
  }

  teacherGrades(assignmentId?: number): Observable<TeacherGradesPayload> {
    let params = new HttpParams();
    if (assignmentId !== undefined && assignmentId !== null) {
      params = params.set('assignmentId', assignmentId);
    }

    return this.http.get<TeacherGradesPayload>(`${API_URL}/portal/teacher/grades`, { params });
  }

  saveTeacherGrades(assignmentId: number, rows: GradeEntryInput[]): Observable<MessagePayload> {
    return this.http.put<MessagePayload>(`${API_URL}/portal/teacher/grades`, {
      assignmentId,
      rows,
    });
  }

  teacherImportContext(): Observable<TeacherImportContextPayload> {
    return this.http.get<TeacherImportContextPayload>(`${API_URL}/portal/teacher/import-context`);
  }

  studentPortal(): Observable<StudentPortalPayload> {
    return this.http.get<StudentPortalPayload>(`${API_URL}/portal/student`);
  }

  familyPortal(): Observable<FamilyPortalPayload> {
    return this.http.get<FamilyPortalPayload>(`${API_URL}/portal/family`);
  }

  // --- CRUD de Usuarios ---
  getUsers(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${API_URL}/usuarios`);
  }

  getUser(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${API_URL}/usuarios/${id}`);
  }

  createUser(req: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${API_URL}/usuarios`, req);
  }

  updateUser(id: number, req: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${API_URL}/usuarios/${id}`, req);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/usuarios/${id}`);
  }

  activateUser(id: number): Observable<void> {
    return this.http.patch<void>(`${API_URL}/usuarios/${id}/activar`, {});
  }

  // --- CRUD de Roles ---
  getRoles(): Observable<RolResponse[]> {
    return this.http.get<RolResponse[]>(`${API_URL}/roles`);
  }

  createRole(req: RolRequest): Observable<RolResponse> {
    return this.http.post<RolResponse>(`${API_URL}/roles`, req);
  }

  updateRole(id: number, req: RolRequest): Observable<RolResponse> {
    return this.http.put<RolResponse>(`${API_URL}/roles/${id}`, req);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/roles/${id}`);
  }

  // --- Listar Personas Dropdown ---
  getPersonasDropdown(): Observable<PersonaDropdown[]> {
    return this.http.get<PersonaDropdown[]>(`${API_URL}/personas/dropdown`);
  }

  // --- CRUD de Personas ---
  getPersonas(): Observable<PersonaResponse[]> {
    return this.http.get<PersonaResponse[]>(`${API_URL}/personas`);
  }

  getPersona(id: number): Observable<PersonaResponse> {
    return this.http.get<PersonaResponse>(`${API_URL}/personas/${id}`);
  }

  createPersona(req: PersonaRequest): Observable<PersonaResponse> {
    return this.http.post<PersonaResponse>(`${API_URL}/personas`, req);
  }

  updatePersona(id: number, req: PersonaRequest): Observable<PersonaResponse> {
    return this.http.put<PersonaResponse>(`${API_URL}/personas/${id}`, req);
  }

  deletePersona(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/personas/${id}`);
  }

  // --- Consulta de Auditorías ---
  getAuditorias(filters: {
    usuario?: string;
    accion?: string;
    entidad?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }): Observable<AuditoriaResponse[]> {
    let params = new HttpParams();
    if (filters.usuario) params = params.set('usuario', filters.usuario);
    if (filters.accion) params = params.set('accion', filters.accion);
    if (filters.entidad) params = params.set('entidad', filters.entidad);
    if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);

    return this.http.get<AuditoriaResponse[]>(`${API_URL}/auditorias`, { params });
  }

  // --- Módulo de Estructura Académica ---

  getNiveles(): Observable<Academico.NivelEducativoResponse[]> {
    return this.http.get<Academico.NivelEducativoResponse[]>(`${API_URL}/academico/niveles`);
  }

  createNivel(req: Academico.NivelEducativoRequest): Observable<Academico.NivelEducativoResponse> {
    return this.http.post<Academico.NivelEducativoResponse>(`${API_URL}/academico/niveles`, req);
  }

  updateNivel(id: number, req: Academico.NivelEducativoRequest): Observable<Academico.NivelEducativoResponse> {
    return this.http.put<Academico.NivelEducativoResponse>(`${API_URL}/academico/niveles/${id}`, req);
  }

  deleteNivel(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/academico/niveles/${id}`);
  }

  clonarEstructura(req: ClonarEstructuraRequest): Observable<void> {
    return this.http.post<void>(`${API_URL}/academico/niveles/clonar`, req);
  }

  getGrados(nivelId: number): Observable<Academico.GradoResponse[]> {
    const params = new HttpParams().set('nivelId', nivelId.toString());
    return this.http.get<Academico.GradoResponse[]>(`${API_URL}/academico/grados`, { params });
  }

  createGrado(req: Academico.GradoRequest): Observable<Academico.GradoResponse> {
    return this.http.post<Academico.GradoResponse>(`${API_URL}/academico/grados`, req);
  }

  updateGrado(id: number, req: Academico.GradoRequest): Observable<Academico.GradoResponse> {
    return this.http.put<Academico.GradoResponse>(`${API_URL}/academico/grados/${id}`, req);
  }

  // --- CRUD Estudiantes ---
  buscarEstudiantes(search: string = ''): Observable<any[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<any[]>(`${API_URL}/estudiantes/search`, { params });
  }

  crearEstudiante(req: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/estudiantes`, req);
  }

  actualizarEstudiante(id: number, req: any): Observable<any> {
    return this.http.put<any>(`${API_URL}/estudiantes/${id}`, req);
  }

  obtenerEstudiante(id: number): Observable<any> {
    return this.http.get<any>(`${API_URL}/estudiantes/${id}`);
  }

  // --- CRUD Matriculas ---
  listarMatriculas(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/matriculas`);
  }

  matricularEstudiante(req: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/matriculas`, req);
  }

  listarMatriculasPorEstudiante(estudianteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/matriculas/estudiante/${estudianteId}`);
  }

  cambiarEstadoMatricula(id: number, estado: string): Observable<void> {
    return this.http.patch<void>(`${API_URL}/matriculas/${id}/estado`, { estado });
  }

  deleteGrado(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/academico/grados/${id}`);
  }

  getMaterias(): Observable<Academico.MateriaResponse[]> {
    return this.http.get<Academico.MateriaResponse[]>(`${API_URL}/academico/materias`);
  }

  createMateria(req: Academico.MateriaRequest): Observable<Academico.MateriaResponse> {
    return this.http.post<Academico.MateriaResponse>(`${API_URL}/academico/materias`, req);
  }

  updateMateria(id: number, req: Academico.MateriaRequest): Observable<Academico.MateriaResponse> {
    return this.http.put<Academico.MateriaResponse>(`${API_URL}/academico/materias/${id}`, req);
  }

  deleteMateria(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/academico/materias/${id}`);
  }

  getCursos(gradoId: number): Observable<Academico.CursoResponse[]> {
    const params = new HttpParams().set('gradoId', gradoId.toString());
    return this.http.get<Academico.CursoResponse[]>(`${API_URL}/academico/cursos`, { params });
  }

  asignarCursosMasivo(req: Academico.CursoAsignacionMasivaRequest): Observable<void> {
    return this.http.post<void>(`${API_URL}/academico/cursos/asignacion-masiva`, req);
  }

  removerCurso(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/academico/cursos/${id}`);
  }

  // --- Apoderados ---
  getApoderados(estudianteId: number): Observable<EstudianteApoderadoResponse[]> {
    return this.http.get<EstudianteApoderadoResponse[]>(`${API_URL}/estudiantes/${estudianteId}/apoderados`);
  }

  asignarApoderado(estudianteId: number, req: EstudianteApoderadoRequest): Observable<EstudianteApoderadoResponse> {
    return this.http.post<EstudianteApoderadoResponse>(`${API_URL}/estudiantes/${estudianteId}/apoderados`, req);
  }

  actualizarApoderado(estudianteId: number, id: number, req: EstudianteApoderadoRequest): Observable<EstudianteApoderadoResponse> {
    return this.http.put<EstudianteApoderadoResponse>(`${API_URL}/estudiantes/${estudianteId}/apoderados/${id}`, req);
  }

  removerApoderado(estudianteId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/estudiantes/${estudianteId}/apoderados/${id}`);
  }

  buscarApoderados(search?: string): Observable<PadreFamiliaResponse[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<PadreFamiliaResponse[]>(`${API_URL}/apoderados/search`, { params });
  }

  obtenerApoderado(id: number): Observable<PadreFamiliaResponse> {
    return this.http.get<PadreFamiliaResponse>(`${API_URL}/apoderados/${id}`);
  }

  crearApoderado(req: PadreFamiliaRequest): Observable<PadreFamiliaResponse> {
    return this.http.post<PadreFamiliaResponse>(`${API_URL}/apoderados`, req);
  }

  actualizarPadreFamilia(id: number, req: PadreFamiliaRequest): Observable<PadreFamiliaResponse> {
    return this.http.put<PadreFamiliaResponse>(`${API_URL}/apoderados/${id}`, req);
  }

  // --- Asignación Docente ---
  getAsignaciones(periodoId?: number, docenteId?: number): Observable<Academico.AsignacionDocenteResponse[]> {
    let params = new HttpParams();
    if (periodoId) params = params.set('periodoId', periodoId);
    if (docenteId) params = params.set('docenteId', docenteId);
    return this.http.get<Academico.AsignacionDocenteResponse[]>(`${API_URL}/academico/asignaciones`, { params });
  }

  getCursosDisponibles(periodoId: number): Observable<Academico.CursoDisponibleResponse[]> {
    return this.http.get<Academico.CursoDisponibleResponse[]>(`${API_URL}/academico/asignaciones/disponibles`, { params: new HttpParams().set('periodoId', periodoId) });
  }

  asignarDocente(req: Academico.AsignacionDocenteRequest): Observable<Academico.AsignacionDocenteResponse> {
    return this.http.post<Academico.AsignacionDocenteResponse>(`${API_URL}/academico/asignaciones`, req);
  }

  removerAsignacion(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/academico/asignaciones/${id}`);
  }

  getDocentesDropdown(): Observable<PersonaDropdown[]> {
    return this.http.get<PersonaDropdown[]>(`${API_URL}/personas/docentes-dropdown`);
  }
}


