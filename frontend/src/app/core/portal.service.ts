import { inject, Injectable } from '@angular/core';
import { defer, from, map, Observable, of, throwError } from 'rxjs';
import * as Academico from './academico.models';
import { AuthService } from './auth.service';
import {
  AcademicLevel,
  AdminDashboardPayload,
  AdminInstitutionPayload,
  AuditoriaResponse,
  ClonarEstructuraRequest,
  CourseAssignment,
  EntityId,
  EstudianteApoderadoRequest,
  EstudianteApoderadoResponse,
  FamilyPortalPayload,
  GradeEntry,
  GradeEntryInput,
  InstitutionConfig,
  MessagePayload,
  PersonaDropdown,
  PersonaRequest,
  PersonaResponse,
  RolRequest,
  RolResponse,
  StudentCourseReport,
  StudentPortalPayload,
  TeacherDashboardPayload,
  TeacherGradesPayload,
  TeacherImportContextPayload,
  TeacherProgress,
  UsuarioRequest,
  UsuarioResponse,
  UserRow,
} from './models';
import { supabase } from './supabase.client';

type DbResult<T = any> = { data: T; error: { message: string; details?: string } | null };

function dataOf<T>(result: DbResult<T>): T {
  if (result.error) throw new Error(result.error.details || result.error.message);
  return result.data;
}

function embedded<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function dateText(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString('es-PE') : '-';
}

@Injectable({ providedIn: 'root' })
export class PortalService {
  private readonly auth = inject(AuthService);

  adminDashboard(): Observable<AdminDashboardPayload> {
    return this.observe(async () => {
      const [users, teachers, students, imports, audits] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('docentes').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('estudiantes').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('importaciones_notas').select('*', { count: 'exact', head: true }).in('estado', ['OBSERVADA', 'FALLIDA']),
        this.fetchAudits({}),
      ]);
      return {
        metrics: [
          { label: 'Usuarios activos', value: String(users.count ?? 0), detail: 'Supabase Auth + profiles', tone: 'maroon' },
          { label: 'Docentes activos', value: String(teachers.count ?? 0), detail: 'Personal habilitado', tone: 'forest' },
          { label: 'Estudiantes', value: String(students.count ?? 0), detail: 'Directorio académico', tone: 'gold' },
          { label: 'Importaciones observadas', value: String(imports.count ?? 0), detail: 'Requieren revisión', tone: 'ink' },
        ],
        progress: await this.fetchSupervision(),
        audits: audits.slice(0, 12).map((item) => ({
          accion: item.accion,
          entidad: item.entidad,
          responsable: item.usuarioResponsable,
          fecha: item.creadoEn,
          detalle: item.detalle,
        })),
      };
    });
  }

  adminUsers(): Observable<UserRow[]> {
    return this.getUsers().pipe(map((rows) => rows.map((row) => ({
      id: row.id,
      codigo: row.id.slice(0, 8).toUpperCase(),
      persona: row.nombreCompleto ?? row.username,
      documento: row.documentoIdentidad ?? '-',
      rol: row.roles[0] as any,
      correo: row.correo ?? row.username,
      estado: row.activo ? 'Activo' : 'Inactivo',
      ultimoAcceso: '-',
    }))));
  }

  adminAcademicLevels(): Observable<AcademicLevel[]> {
    return this.observe(async () => {
      const rows = dataOf(await supabase.from('niveles').select('nombre,turno,descripcion,grados(nombre,paralelo,cursos(materias(nombre)))').order('nombre') as DbResult<any[]>);
      return rows.map((row) => ({
        nivel: row.nombre,
        turno: row.turno,
        descripcion: row.descripcion ?? '',
        grados: (row.grados ?? []).map((grade: any) => `${grade.nombre} ${grade.paralelo}`),
        materias: [...new Set((row.grados ?? []).flatMap((grade: any) => (grade.cursos ?? []).map((course: any) => embedded<any>(course.materias)?.nombre)).filter(Boolean))] as string[],
      }));
    });
  }

  adminSupervision(): Observable<TeacherProgress[]> {
    return this.observe(() => this.fetchSupervision());
  }

  adminInstitution(): Observable<AdminInstitutionPayload> {
    return this.observe(async () => {
      const result = await supabase.from('configuracion_institucional').select('*').eq('codigo', 'PRINCIPAL').single();
      const row = dataOf(result as DbResult<any>);
      const audits = await this.fetchAudits({ entidad: 'configuracion_institucional' });
      return {
        config: this.toInstitution(row),
        audits: audits.map((item) => ({ accion: item.accion, entidad: item.entidad, responsable: item.usuarioResponsable, fecha: item.creadoEn, detalle: item.detalle })),
      };
    });
  }

  saveAdminInstitution(config: InstitutionConfig): Observable<AdminInstitutionPayload> {
    return this.observe(async () => {
      const result = await supabase.from('configuracion_institucional').update({
        nombre: config.nombre,
        ruc: config.ruc || null,
        telefono: config.telefono || null,
        direccion: config.direccion || null,
        correo_institucional: config.correoInstitucional || null,
        sitio_web: config.sitioWeb || null,
        logo_url: config.logoUrl || null,
      }).eq('codigo', 'PRINCIPAL').select().single();
      return { config: this.toInstitution(dataOf(result as DbResult<any>)), audits: [] };
    });
  }

  uploadLogo(_file: File): Observable<{ logoUrl: string }> {
    return throwError(() => new Error('Storage está deshabilitado en esta fase; use una URL HTTPS para el logotipo.'));
  }

  getGestiones(): Observable<Academico.GestionAcademicaResponse[]> {
    return this.observe(async () => (dataOf(await supabase.from('gestiones').select('*').order('anio', { ascending: false }) as DbResult<any[]>)).map(this.toGestion));
  }

  createGestion(req: Academico.GestionAcademicaRequest): Observable<Academico.GestionAcademicaResponse> {
    return this.insertOne('gestiones', { anio: req.anio, nombre: req.nombre, fecha_inicio: req.fechaInicio || null, fecha_fin: req.fechaFin || null, activa: req.activa }, this.toGestion);
  }

  updateGestion(id: EntityId, req: Academico.GestionAcademicaRequest): Observable<Academico.GestionAcademicaResponse> {
    return this.updateOne('gestiones', id, { anio: req.anio, nombre: req.nombre, fecha_inicio: req.fechaInicio || null, fecha_fin: req.fechaFin || null, activa: req.activa }, this.toGestion);
  }

  deleteGestion(id: EntityId): Observable<void> { return this.deleteOne('gestiones', id); }

  getPeriodos(gestionId: EntityId): Observable<Academico.PeriodoAcademicoResponse[]> {
    return this.observe(async () => (dataOf(await supabase.from('periodos').select('*').eq('gestion_id', gestionId).order('orden') as DbResult<any[]>)).map(this.toPeriodo));
  }

  createPeriodo(req: Academico.PeriodoAcademicoRequest): Observable<Academico.PeriodoAcademicoResponse> {
    return this.insertOne('periodos', this.periodPayload(req), this.toPeriodo);
  }

  updatePeriodo(id: EntityId, req: Academico.PeriodoAcademicoRequest): Observable<Academico.PeriodoAcademicoResponse> {
    return this.updateOne('periodos', id, this.periodPayload(req), this.toPeriodo);
  }

  deletePeriodo(id: EntityId): Observable<void> { return this.deleteOne('periodos', id); }

  getAsignacionesDocentes(): Observable<Academico.AsignacionDocenteResponse[]> {
    return this.observe(async () => {
      const query = await supabase.from('asignaciones_docente').select('*,docentes(codigo,personas(nombres,apellidos)),cursos(materias(nombre),grados(nombre,paralelo)),periodos(nombre)').order('created_at', { ascending: false });
      return dataOf(query as DbResult<any[]>).map(this.toAssignment);
    });
  }

  createAsignacionDocente(req: Academico.AsignacionDocenteRequest): Observable<Academico.AsignacionDocenteResponse> {
    return this.observe(async () => {
      dataOf(await supabase.from('asignaciones_docente').insert({ docente_id: req.docenteId, curso_id: req.cursoId, periodo_id: req.periodoAcademicoId, estado: req.estado }) as DbResult);
      return await this.fetchAssignmentByKeys(req.docenteId, req.cursoId, req.periodoAcademicoId);
    });
  }

  updateAsignacionDocente(id: EntityId, req: Academico.AsignacionDocenteRequest): Observable<Academico.AsignacionDocenteResponse> {
    return this.observe(async () => {
      dataOf(await supabase.from('asignaciones_docente').update({ docente_id: req.docenteId, curso_id: req.cursoId, periodo_id: req.periodoAcademicoId, estado: req.estado }).eq('id', id) as DbResult);
      const row = dataOf(await supabase.from('asignaciones_docente').select('*,docentes(codigo,personas(nombres,apellidos)),cursos(materias(nombre),grados(nombre,paralelo)),periodos(nombre)').eq('id', id).single() as DbResult<any>);
      return this.toAssignment(row);
    });
  }

  closeAsignacionDocente(id: EntityId): Observable<void> {
    return this.observe(async () => { dataOf(await supabase.from('asignaciones_docente').update({ estado: 'CERRADA' }).eq('id', id) as DbResult); });
  }

  teacherDashboard(): Observable<TeacherDashboardPayload> {
    return this.observe(async () => {
      const courses = await this.fetchTeacherCourses();
      return {
        metrics: [
          { label: 'Cursos asignados', value: String(courses.length), detail: 'Asignaciones visibles por RLS', tone: 'maroon' },
          { label: 'Estudiantes', value: String(courses.reduce((sum, item) => sum + item.estudiantes, 0)), detail: 'Matrículas activas', tone: 'forest' },
          { label: 'Avance promedio', value: `${courses.length ? Math.round(courses.reduce((sum, item) => sum + item.avance, 0) / courses.length) : 0}%`, detail: 'Notas publicadas', tone: 'gold' },
          { label: 'Seguridad', value: 'RLS', detail: 'Solo cursos propios', tone: 'ink' },
        ],
        courses,
      };
    });
  }

  teacherGrades(assignmentId?: EntityId): Observable<TeacherGradesPayload> {
    return this.observe(async () => {
      const courses = await this.fetchTeacherCourses();
      const selected = courses.find((item) => item.assignmentId === assignmentId) ?? courses[0] ?? null;
      if (!selected) return { assignmentId: null, selectedCourse: null, rows: [] };
      const details = dataOf(await supabase.from('asignaciones_docente').select('id,cursos!inner(grado_id),periodos!inner(gestion_id,nombre)').eq('id', selected.assignmentId).single() as DbResult<any>);
      const course = embedded<any>(details.cursos)!;
      const period = embedded<any>(details.periodos)!;
      const enrollments = dataOf(await supabase.from('matriculas').select('estudiantes!inner(id,codigo,personas!inner(nombres,apellidos))').eq('grado_id', course.grado_id).eq('gestion_id', period.gestion_id).eq('estado', 'ACTIVA') as DbResult<any[]>);
      const notes = dataOf(await supabase.from('notas').select('*').eq('asignacion_docente_id', selected.assignmentId) as DbResult<any[]>);
      const noteMap = new Map(notes.map((note) => [`${note.estudiante_id}|${note.tipo}`, note]));
      const rows: GradeEntry[] = enrollments.map((item) => {
        const student = embedded<any>(item.estudiantes)!;
        const person = embedded<any>(student.personas)!;
        const value = (type: string) => Number(noteMap.get(`${student.id}|${type}`)?.valor ?? 0);
        return {
          codigo: student.codigo,
          estudiante: `${person.apellidos}, ${person.nombres}`,
          practica: value('PRACTICA'), examen: value('EXAMEN'), tarea: value('TAREA'), participacion: value('PARTICIPACION'),
          promedio: value('PROMEDIO_FINAL'),
          observacion: noteMap.get(`${student.id}|PROMEDIO_FINAL`)?.observacion ?? '',
        };
      });
      return { assignmentId: selected.assignmentId, selectedCourse: selected, rows };
    });
  }

  saveTeacherGrades(assignmentId: EntityId, rows: GradeEntryInput[]): Observable<MessagePayload> {
    return this.observe(async () => {
      const session = this.auth.session();
      if (!session) throw new Error('Sesión expirada.');
      const assignment = dataOf(await supabase.from('asignaciones_docente').select('periodos(nombre)').eq('id', assignmentId).single() as DbResult<any>);
      const trimester = this.trimesterFrom(embedded<any>(assignment.periodos)?.nombre ?? '');
      const students = dataOf(await supabase.from('estudiantes').select('id,codigo').in('codigo', rows.map((row) => row.codigo)) as DbResult<any[]>);
      const studentByCode = new Map(students.map((student) => [student.codigo, student.id]));
      const noteRows = rows.flatMap((row) => {
        const studentId = studentByCode.get(row.codigo);
        if (!studentId) return [];
        const grades = [
          ['PRACTICA', row.practica], ['EXAMEN', row.examen], ['TAREA', row.tarea], ['PARTICIPACION', row.participacion],
        ] as const;
        const final = Math.round((grades.reduce((sum, [, value]) => sum + Number(value || 0), 0) / grades.length) * 100) / 100;
        return [...grades.map(([tipo, valor]) => ({ estudiante_id: studentId, asignacion_docente_id: assignmentId, trimestre: trimester, tipo, valor: Number(valor), publicado: true, registrado_por: session.userId })),
          { estudiante_id: studentId, asignacion_docente_id: assignmentId, trimestre: trimester, tipo: 'PROMEDIO_FINAL', valor: final, logro_literal: this.achievement(final), publicado: true, observacion: row.observacion || null, registrado_por: session.userId }];
      });
      if (noteRows.some((row) => row.valor < 0 || row.valor > 20)) throw new Error('Todas las notas deben estar entre 0 y 20.');
      dataOf(await supabase.from('notas').upsert(noteRows, { onConflict: 'estudiante_id,asignacion_docente_id,trimestre,tipo' }) as DbResult);
      return { message: 'Notas guardadas y publicadas correctamente.' };
    });
  }

  teacherImportContext(): Observable<TeacherImportContextPayload> {
    return this.observe(async () => {
      const courses = await this.fetchTeacherCourses();
      const history = dataOf(await supabase.from('importaciones_notas').select('*').order('created_at', { ascending: false }).limit(10) as DbResult<any[]>);
      return { courses, history: history.map((row) => ({ archivo: row.nombre_archivo, periodo: row.trimestre, estado: row.estado, fecha: dateText(row.created_at), detalle: row.detalle ?? '' })) };
    });
  }

  studentPortal(): Observable<StudentPortalPayload> {
    return this.observe(async () => {
      const student = dataOf(await supabase.from('estudiantes').select('id,codigo').single() as DbResult<any>);
      const reports = await this.fetchReports([student.id]);
      const own = reports.get(student.id) ?? [];
      const average = own.length ? own.reduce((sum, item) => sum + item.promedio, 0) / own.length : 0;
      return {
        metrics: [
          { label: 'Promedio general', value: average.toFixed(2), detail: 'Solo notas publicadas', tone: 'maroon' },
          { label: 'Cursos publicados', value: String(own.length), detail: 'Protegidos por RLS', tone: 'forest' },
          { label: 'Código', value: student.codigo, detail: 'Estudiante autenticado', tone: 'gold' },
          { label: 'Acceso', value: 'Lectura', detail: 'Sin permisos de modificación', tone: 'ink' },
        ], reports: own,
      };
    });
  }

  familyPortal(): Observable<FamilyPortalPayload> {
    return this.observe(async () => {
      const links = dataOf(await supabase.from('estudiante_apoderados').select('parentesco,estudiantes!inner(id,codigo,personas!inner(nombres,apellidos),matriculas(grados(nombre,paralelo)))').eq('activo', true) as DbResult<any[]>);
      const ids = links.map((link) => embedded<any>(link.estudiantes)?.id).filter(Boolean);
      const reports = await this.fetchReports(ids);
      const students = links.map((link) => {
        const student = embedded<any>(link.estudiantes)!;
        const person = embedded<any>(student.personas)!;
        const grade = embedded<any>(embedded<any>(student.matriculas)?.grados);
        const list = reports.get(student.id) ?? [];
        return { codigo: student.codigo, estudiante: `${person.apellidos}, ${person.nombres}`, grado: grade ? `${grade.nombre} ${grade.paralelo}` : 'Sin matrícula', parentesco: link.parentesco, promedioGeneral: list.length ? list.reduce((sum, item) => sum + item.promedio, 0) / list.length : 0 };
      });
      return { students, reportsByStudent: Object.fromEntries(students.map((item, index) => [item.codigo, reports.get(ids[index]) ?? []])), alerts: [] };
    });
  }

  getUsers(): Observable<UsuarioResponse[]> {
    return this.observe(async () => {
      const rows = dataOf(await supabase.from('profiles').select('*,personas(nombres,apellidos,numero_documento,correo)').order('username') as DbResult<any[]>);
      return rows.map((row) => {
        const person = embedded<any>(row.personas);
        return { id: row.id, username: row.username, activo: row.activo, personaId: row.persona_id, roles: [row.rol], nombreCompleto: person ? `${person.apellidos}, ${person.nombres}` : row.username, documentoIdentidad: person?.numero_documento, correo: person?.correo } as UsuarioResponse;
      });
    });
  }

  getUser(id: EntityId): Observable<UsuarioResponse> {
    return this.getUsers().pipe(map((rows) => { const row = rows.find((item) => item.id === id); if (!row) throw new Error('Usuario no encontrado.'); return row; }));
  }

  createUser(req: UsuarioRequest): Observable<UsuarioResponse> {
    const email = req.username.includes('@') ? req.username : `${req.username}@aduni.local`;
    return this.userFunction({ action: 'crear', email, username: email, password: req.password, personaId: req.personaId, rol: req.roles[0] });
  }

  updateUser(id: EntityId, req: UsuarioRequest): Observable<UsuarioResponse> {
    const email = req.username.includes('@') ? req.username : `${req.username}@aduni.local`;
    return this.userFunction({ action: 'actualizar', userId: id, email, username: email, password: req.password || undefined, rol: req.roles[0] });
  }

  deleteUser(id: EntityId): Observable<void> { return this.userFunction({ action: 'desactivar', userId: id }).pipe(map(() => undefined)); }
  activateUser(id: EntityId): Observable<void> { return this.userFunction({ action: 'activar', userId: id }).pipe(map(() => undefined)); }

  getRoles(): Observable<RolResponse[]> {
    return of(['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', 'PADRE_FAMILIA'].map((nombre) => ({ id: nombre, nombre, creadoEn: '-' })));
  }
  createRole(_req: RolRequest): Observable<RolResponse> { return throwError(() => new Error('Los roles son fijos y se administran en la migración SQL.')); }
  updateRole(_id: EntityId, _req: RolRequest): Observable<RolResponse> { return throwError(() => new Error('Los roles son fijos.')); }
  deleteRole(_id: EntityId): Observable<void> { return throwError(() => new Error('Los roles son fijos y no pueden eliminarse.')); }

  getPersonasDropdown(): Observable<PersonaDropdown[]> {
    return this.getPersonas().pipe(map((rows) => rows.map((row) => ({ id: row.id, nombreCompleto: `${row.apellidos}, ${row.nombres}`, documentoIdentidad: row.documentoIdentidad }))));
  }

  getPersonas(): Observable<PersonaResponse[]> {
    return this.observe(async () => {
      const rows = dataOf(await supabase.from('personas').select('*,docentes(*),estudiantes(*),padres_familia(*),administrativos(*)').order('apellidos') as DbResult<any[]>);
      return rows.map((row) => this.toPerson(row));
    });
  }

  getPersona(id: EntityId): Observable<PersonaResponse> {
    return this.getPersonas().pipe(map((rows) => { const row = rows.find((item) => item.id === id); if (!row) throw new Error('Persona no encontrada.'); return row; }));
  }

  createPersona(req: PersonaRequest): Observable<PersonaResponse> {
    return this.observe(async () => {
      const person = dataOf(await supabase.from('personas').insert(this.personPayload(req)).select().single() as DbResult<any>);
      await this.savePersonSubtype(person.id, req);
      return await this.fetchPerson(person.id);
    });
  }

  updatePersona(id: EntityId, req: PersonaRequest): Observable<PersonaResponse> {
    return this.observe(async () => {
      dataOf(await supabase.from('personas').update(this.personPayload(req)).eq('id', id) as DbResult);
      await this.savePersonSubtype(id, req);
      return await this.fetchPerson(id);
    });
  }

  deletePersona(id: EntityId): Observable<void> {
    return this.observe(async () => { dataOf(await supabase.from('personas').update({ activo: false }).eq('id', id) as DbResult); });
  }

  getAuditorias(filters: { usuario?: string; accion?: string; entidad?: string; fechaInicio?: string; fechaFin?: string }): Observable<AuditoriaResponse[]> {
    return this.observe(() => this.fetchAudits(filters));
  }

  getNiveles(): Observable<Academico.NivelEducativoResponse[]> {
    return this.observe(async () => (dataOf(await supabase.from('niveles').select('*').order('nombre') as DbResult<any[]>)).map(this.toLevel));
  }
  createNivel(req: Academico.NivelEducativoRequest): Observable<Academico.NivelEducativoResponse> { return this.insertOne('niveles', this.levelPayload(req), this.toLevel); }
  updateNivel(id: EntityId, req: Academico.NivelEducativoRequest): Observable<Academico.NivelEducativoResponse> { return this.updateOne('niveles', id, this.levelPayload(req), this.toLevel); }
  deleteNivel(id: EntityId): Observable<void> { return this.deleteOne('niveles', id); }
  clonarEstructura(_req: ClonarEstructuraRequest): Observable<void> { return throwError(() => new Error('La clonación masiva de estructura académica todavía no está disponible.')); }

  getGrados(nivelId: EntityId): Observable<Academico.GradoResponse[]> {
    return this.observe(async () => (dataOf(await supabase.from('grados').select('*,niveles(nombre)').eq('nivel_id', nivelId).order('nombre') as DbResult<any[]>)).map(this.toGrade));
  }
  createGrado(req: Academico.GradoRequest): Observable<Academico.GradoResponse> { return this.insertOne('grados', this.gradePayload(req), this.toGrade); }
  updateGrado(id: EntityId, req: Academico.GradoRequest): Observable<Academico.GradoResponse> { return this.updateOne('grados', id, this.gradePayload(req), this.toGrade); }
  deleteGrado(id: EntityId): Observable<void> { return this.deleteOne('grados', id); }

  buscarEstudiantes(search = ''): Observable<any[]> {
    return this.observe(async () => {
      const rows = dataOf(await supabase.from('estudiantes').select('id,codigo,activo,persona_id,personas!inner(*)').order('created_at', { ascending: false }) as DbResult<any[]>);
      const term = search.trim().toLowerCase();
      return rows.map((row) => { const p = embedded<any>(row.personas)!; return { id: row.id, personaId: row.persona_id, codigoEstudiante: row.codigo, activo: row.activo, nombres: p.nombres, apellidos: p.apellidos, documentoIdentidad: p.numero_documento, fechaNacimiento: p.fecha_nacimiento, correo: p.correo, telefono: p.telefono, direccion: p.direccion }; })
        .filter((row) => !term || `${row.nombres} ${row.apellidos} ${row.documentoIdentidad} ${row.codigoEstudiante}`.toLowerCase().includes(term));
    });
  }

  crearEstudiante(req: any): Observable<any> {
    return this.observe(async () => {
      const person = dataOf(await supabase.from('personas').insert({ nombres: req.nombres, apellidos: req.apellidos, numero_documento: req.documentoIdentidad, fecha_nacimiento: req.fechaNacimiento || null, correo: req.correo || null, telefono: req.telefono || null, direccion: req.direccion || null }).select().single() as DbResult<any>);
      const student = dataOf(await supabase.from('estudiantes').insert({ persona_id: person.id, codigo: `EST-${req.documentoIdentidad}`.slice(0, 30), activo: req.activo ?? true }).select().single() as DbResult<any>);
      return { ...req, id: student.id };
    });
  }

  actualizarEstudiante(id: EntityId, req: any): Observable<any> {
    return this.observe(async () => {
      const student = dataOf(await supabase.from('estudiantes').select('persona_id').eq('id', id).single() as DbResult<any>);
      dataOf(await supabase.from('personas').update({ nombres: req.nombres, apellidos: req.apellidos, numero_documento: req.documentoIdentidad, fecha_nacimiento: req.fechaNacimiento || null, correo: req.correo || null, telefono: req.telefono || null, direccion: req.direccion || null }).eq('id', student.persona_id) as DbResult);
      dataOf(await supabase.from('estudiantes').update({ activo: req.activo ?? true }).eq('id', id) as DbResult);
      return { ...req, id };
    });
  }
  desactivarEstudiante(id: EntityId): Observable<void> { return this.observe(async () => { dataOf(await supabase.from('estudiantes').update({ activo: false }).eq('id', id) as DbResult); }); }

  listarMatriculas(): Observable<any[]> {
    return this.observe(async () => {
      const rows = dataOf(await supabase.from('matriculas').select('*,estudiantes(codigo,personas(nombres,apellidos)),grados(nombre,paralelo),gestiones(nombre)').order('created_at', { ascending: false }) as DbResult<any[]>);
      return rows.map((row) => { const student = embedded<any>(row.estudiantes); const person = embedded<any>(student?.personas); const grade = embedded<any>(row.grados); return { id: row.id, codigoMatricula: row.codigo, estudianteId: row.estudiante_id, estudianteNombre: `${person?.apellidos ?? ''}, ${person?.nombres ?? ''}`, grado: `${grade?.nombre ?? ''} ${grade?.paralelo ?? ''}`, fechaMatricula: row.fecha_matricula, estado: row.estado }; });
    });
  }

  matricularEstudiante(req: any): Observable<any> {
    return this.observe(async () => {
      const grade = dataOf(await supabase.from('grados').select('niveles!inner(gestion_id)').eq('id', req.gradoId).single() as DbResult<any>);
      const level = embedded<any>(grade.niveles)!;
      return dataOf(await supabase.from('matriculas').insert({ codigo: `MAT-${Date.now()}`.slice(0, 30), estudiante_id: req.estudianteId, grado_id: req.gradoId, gestion_id: level.gestion_id, estado: 'ACTIVA' }).select().single() as DbResult<any>);
    });
  }
  cambiarEstadoMatricula(id: EntityId, estado: string): Observable<void> { return this.observe(async () => { dataOf(await supabase.from('matriculas').update({ estado }).eq('id', id) as DbResult); }); }

  getMaterias(): Observable<Academico.MateriaResponse[]> { return this.observe(async () => (dataOf(await supabase.from('materias').select('*').order('nombre') as DbResult<any[]>)).map(this.toSubject)); }
  createMateria(req: Academico.MateriaRequest): Observable<Academico.MateriaResponse> { return this.insertOne('materias', { codigo: req.codigo, nombre: req.nombre, area: req.area || null, activa: req.activa }, this.toSubject); }
  updateMateria(id: EntityId, req: Academico.MateriaRequest): Observable<Academico.MateriaResponse> { return this.updateOne('materias', id, { codigo: req.codigo, nombre: req.nombre, area: req.area || null, activa: req.activa }, this.toSubject); }
  deleteMateria(id: EntityId): Observable<void> { return this.deleteOne('materias', id); }

  getCursos(gradoId: EntityId): Observable<Academico.CursoResponse[]> {
    return this.observe(async () => (dataOf(await supabase.from('cursos').select('*,grados(nombre,paralelo),materias(codigo,nombre,area)').eq('grado_id', gradoId).order('created_at') as DbResult<any[]>)).map(this.toCourse));
  }
  asignarCursosMasivo(req: Academico.CursoAsignacionMasivaRequest): Observable<void> { return this.observe(async () => { dataOf(await supabase.from('cursos').upsert(req.materiasIds.map((materiaId) => ({ grado_id: req.gradoId, materia_id: materiaId, activo: true })), { onConflict: 'grado_id,materia_id' }) as DbResult); }); }
  removerCurso(id: EntityId): Observable<void> { return this.deleteOne('cursos', id); }

  getApoderados(estudianteId: EntityId): Observable<EstudianteApoderadoResponse[]> {
    return this.observe(async () => {
      const rows = dataOf(await supabase.from('estudiante_apoderados').select('*,padres_familia!inner(id,personas!inner(nombres,apellidos,numero_documento,telefono,correo))').eq('estudiante_id', estudianteId).eq('activo', true) as DbResult<any[]>);
      return rows.map((row) => this.toGuardianLink(row));
    });
  }
  asignarApoderado(estudianteId: EntityId, req: EstudianteApoderadoRequest): Observable<EstudianteApoderadoResponse> { return this.observe(async () => { const row = dataOf(await supabase.from('estudiante_apoderados').insert({ estudiante_id: estudianteId, padre_familia_id: req.padreFamiliaId, parentesco: req.parentesco, principal: req.principal }).select('*,padres_familia!inner(id,personas!inner(nombres,apellidos,numero_documento,telefono,correo))').single() as DbResult<any>); return this.toGuardianLink(row); }); }
  actualizarApoderado(_estudianteId: EntityId, id: EntityId, req: EstudianteApoderadoRequest): Observable<EstudianteApoderadoResponse> { return this.observe(async () => { const row = dataOf(await supabase.from('estudiante_apoderados').update({ padre_familia_id: req.padreFamiliaId, parentesco: req.parentesco, principal: req.principal }).eq('id', id).select('*,padres_familia!inner(id,personas!inner(nombres,apellidos,numero_documento,telefono,correo))').single() as DbResult<any>); return this.toGuardianLink(row); }); }
  removerApoderado(_estudianteId: EntityId, id: EntityId): Observable<void> { return this.observe(async () => { dataOf(await supabase.from('estudiante_apoderados').update({ activo: false }).eq('id', id) as DbResult); }); }

  private observe<T>(factory: () => Promise<T>): Observable<T> { return defer(() => from(factory())); }
  private insertOne<T>(table: string, payload: any, mapper: (row: any) => T): Observable<T> { return this.observe(async () => mapper(dataOf(await supabase.from(table).insert(payload).select().single() as DbResult<any>))); }
  private updateOne<T>(table: string, id: EntityId, payload: any, mapper: (row: any) => T): Observable<T> { return this.observe(async () => mapper(dataOf(await supabase.from(table).update(payload).eq('id', id).select().single() as DbResult<any>))); }
  private deleteOne(table: string, id: EntityId): Observable<void> { return this.observe(async () => { dataOf(await supabase.from(table).delete().eq('id', id) as DbResult); }); }

  private userFunction(body: Record<string, unknown>): Observable<any> {
    return this.observe(async () => { const { data, error } = await supabase.functions.invoke('administrar-usuario', { body }); if (error) throw error; if (data?.message && !data?.id) throw new Error(data.message); return { id: data.id, personaId: data.persona_id, username: data.email ?? data.username, activo: data.activo, roles: [data.rol] }; });
  }

  private async fetchPerson(id: EntityId): Promise<PersonaResponse> { const row = dataOf(await supabase.from('personas').select('*,docentes(*),estudiantes(*),padres_familia(*),administrativos(*)').eq('id', id).single() as DbResult<any>); return this.toPerson(row); }
  private async savePersonSubtype(personId: EntityId, req: PersonaRequest): Promise<void> {
    const code = (req.codigo || `${req.tipoPersona.slice(0, 3)}-${req.documentoIdentidad}`).slice(0, 30);
    if (req.tipoPersona === 'DOCENTE') dataOf(await supabase.from('docentes').upsert({ persona_id: personId, codigo: code, especialidad: req.especialidad || null, area_academica: req.areaAcademica || null, activo: true }, { onConflict: 'persona_id' }) as DbResult);
    if (req.tipoPersona === 'ESTUDIANTE') dataOf(await supabase.from('estudiantes').upsert({ persona_id: personId, codigo: code, activo: true }, { onConflict: 'persona_id' }) as DbResult);
    if (req.tipoPersona === 'PADRE_FAMILIA') dataOf(await supabase.from('padres_familia').upsert({ persona_id: personId, ocupacion: req.ocupacion || null, activo: true }, { onConflict: 'persona_id' }) as DbResult);
    if (req.tipoPersona === 'ADMINISTRATIVO') dataOf(await supabase.from('administrativos').upsert({ persona_id: personId, codigo: code, cargo: req.cargo || 'Administrativo', activo: true }, { onConflict: 'persona_id' }) as DbResult);
  }
  private personPayload(req: PersonaRequest): any { return { nombres: req.nombres.trim(), apellidos: req.apellidos.trim(), numero_documento: req.documentoIdentidad.trim(), fecha_nacimiento: req.fechaNacimiento || null, direccion: req.direccion || null, telefono: req.telefono || null, correo: req.correo || null }; }
  private toPerson(row: any): PersonaResponse { const teacher = embedded<any>(row.docentes); const student = embedded<any>(row.estudiantes); const parent = embedded<any>(row.padres_familia); const admin = embedded<any>(row.administrativos); const subtype = teacher ?? student ?? parent ?? admin; const type = teacher ? 'DOCENTE' : student ? 'ESTUDIANTE' : parent ? 'PADRE_FAMILIA' : admin ? 'ADMINISTRATIVO' : 'PERSONA'; return { id: row.id, nombres: row.nombres, apellidos: row.apellidos, documentoIdentidad: row.numero_documento, fechaNacimiento: row.fecha_nacimiento, direccion: row.direccion, telefono: row.telefono, correo: row.correo, tipoPersona: type, codigo: subtype?.codigo, cargo: admin?.cargo, especialidad: teacher?.especialidad, areaAcademica: teacher?.area_academica, ocupacion: parent?.ocupacion, creadoEn: row.created_at, actualizadoEn: row.updated_at, nombreCompleto: `${row.apellidos}, ${row.nombres}` } as PersonaResponse; }

  private async fetchAudits(filters: any): Promise<AuditoriaResponse[]> { let query: any = supabase.from('auditoria').select('*').order('created_at', { ascending: false }); if (filters.usuario) query = query.ilike('usuario_responsable', `%${filters.usuario}%`); if (filters.accion) query = query.eq('accion', filters.accion); if (filters.entidad) query = query.eq('entidad', filters.entidad); if (filters.fechaInicio) query = query.gte('created_at', filters.fechaInicio); if (filters.fechaFin) query = query.lte('created_at', `${filters.fechaFin}T23:59:59`); const rows = dataOf(await query as DbResult<any[]>); return rows.map((row: any) => ({ id: row.id, creadoEn: dateText(row.created_at), accion: row.accion, entidad: row.entidad, entidadId: row.entidad_id, usuarioResponsable: row.usuario_responsable, detalle: typeof row.detalle === 'string' ? row.detalle : JSON.stringify(row.detalle) })); }
  private async fetchSupervision(): Promise<TeacherProgress[]> { const rows = dataOf(await supabase.from('asignaciones_docente').select('estado,docentes(codigo,area_academica,personas(nombres,apellidos)),cursos(materias(nombre),grados(nombre,paralelo)),periodos(nombre)').order('created_at', { ascending: false }) as DbResult<any[]>); return rows.map((row) => { const teacher = embedded<any>(row.docentes); const person = embedded<any>(teacher?.personas); const course = embedded<any>(row.cursos); const subject = embedded<any>(course?.materias); const grade = embedded<any>(course?.grados); const period = embedded<any>(row.periodos); return { docente: `${person?.apellidos ?? ''}, ${person?.nombres ?? ''}`, codigo: teacher?.codigo ?? '', area: teacher?.area_academica ?? '', curso: subject?.nombre ?? '', grado: `${grade?.nombre ?? ''} ${grade?.paralelo ?? ''}`, periodo: period?.nombre ?? '', avance: 0, estado: row.estado === 'CERRADA' ? 'Completo' : 'En proceso' } as TeacherProgress; }); }

  private async fetchTeacherCourses(): Promise<CourseAssignment[]> { const rows = dataOf(await supabase.from('asignaciones_docente').select('*,cursos!inner(grado_id,materias(nombre),grados(nombre,paralelo)),periodos!inner(nombre,gestion_id)').eq('estado', 'ACTIVA').order('created_at') as DbResult<any[]>); return Promise.all(rows.map(async (row) => { const course = embedded<any>(row.cursos)!; const subject = embedded<any>(course.materias); const grade = embedded<any>(course.grados); const period = embedded<any>(row.periodos); const enrollment = await supabase.from('matriculas').select('*', { count: 'exact', head: true }).eq('grado_id', course.grado_id).eq('gestion_id', period.gestion_id).eq('estado', 'ACTIVA'); const notes = await supabase.from('notas').select('*', { count: 'exact', head: true }).eq('asignacion_docente_id', row.id).eq('tipo', 'PROMEDIO_FINAL'); const students = enrollment.count ?? 0; const evaluated = notes.count ?? 0; return { assignmentId: row.id, codigo: row.id.slice(0, 8).toUpperCase(), curso: subject?.nombre ?? '', grado: grade?.nombre ?? '', seccion: grade?.paralelo ?? '', periodo: period?.nombre ?? '', estudiantes: students, evaluaciones: evaluated, avance: students ? Math.min(100, Math.round((evaluated / students) * 100)) : 0, estado: row.estado } as CourseAssignment; })); }

  private async fetchReports(studentIds: EntityId[]): Promise<Map<EntityId, StudentCourseReport[]>> { const result = new Map<EntityId, StudentCourseReport[]>(); if (!studentIds.length) return result; const notes = dataOf(await supabase.from('notas').select('*,asignaciones_docente!inner(cursos!inner(materias(nombre)),periodos(nombre))').in('estudiante_id', studentIds).eq('publicado', true) as DbResult<any[]>); const groups = new Map<string, any[]>(); for (const note of notes) { const key = `${note.estudiante_id}|${note.asignacion_docente_id}`; groups.set(key, [...(groups.get(key) ?? []), note]); } for (const [key, rows] of groups) { const first = rows[0]; const assignment = embedded<any>(first.asignaciones_docente); const course = embedded<any>(assignment?.cursos); const subject = embedded<any>(course?.materias); const period = embedded<any>(assignment?.periodos); const find = (type: string) => Number(rows.find((item) => item.tipo === type)?.valor ?? 0); const report: StudentCourseReport = { curso: subject?.nombre ?? '', periodo: period?.nombre ?? '', practica: find('PRACTICA'), examen: find('EXAMEN'), tarea: find('TAREA'), promedio: find('PROMEDIO_FINAL'), estado: 'Publicado' }; const studentId = key.split('|')[0]; result.set(studentId, [...(result.get(studentId) ?? []), report]); } return result; }

  private async fetchAssignmentByKeys(docenteId: EntityId, cursoId: EntityId, periodoId: EntityId): Promise<Academico.AsignacionDocenteResponse> { const row = dataOf(await supabase.from('asignaciones_docente').select('*,docentes(codigo,personas(nombres,apellidos)),cursos(materias(nombre),grados(nombre,paralelo)),periodos(nombre)').eq('docente_id', docenteId).eq('curso_id', cursoId).eq('periodo_id', periodoId).single() as DbResult<any>); return this.toAssignment(row); }
  private toAssignment = (row: any): Academico.AsignacionDocenteResponse => { const teacher = embedded<any>(row.docentes); const person = embedded<any>(teacher?.personas); const course = embedded<any>(row.cursos); const subject = embedded<any>(course?.materias); const grade = embedded<any>(course?.grados); const period = embedded<any>(row.periodos); return { id: row.id, docenteId: row.docente_id, docenteCodigo: teacher?.codigo ?? '', docenteNombre: `${person?.apellidos ?? ''}, ${person?.nombres ?? ''}`, cursoId: row.curso_id, materia: subject?.nombre ?? '', grado: grade?.nombre ?? '', seccion: grade?.paralelo ?? '', periodoAcademicoId: row.periodo_id, periodo: period?.nombre ?? '', fechaAsignacion: row.fecha_asignacion, estado: row.estado }; };
  private toGestion = (row: any): Academico.GestionAcademicaResponse => ({ id: row.id, anio: row.anio, nombre: row.nombre, fechaInicio: row.fecha_inicio ?? '', fechaFin: row.fecha_fin ?? '', activa: row.activa });
  private toPeriodo = (row: any): Academico.PeriodoAcademicoResponse => ({ id: row.id, nombre: row.nombre, orden: row.orden, fechaInicio: row.fecha_inicio ?? '', fechaFin: row.fecha_fin ?? '', cerrado: row.cerrado, gestionAcademicaId: row.gestion_id });
  private periodPayload(req: Academico.PeriodoAcademicoRequest): any { return { gestion_id: req.gestionAcademicaId, nombre: req.nombre, orden: req.orden, fecha_inicio: req.fechaInicio || null, fecha_fin: req.fechaFin || null, cerrado: req.cerrado }; }
  private toLevel = (row: any): Academico.NivelEducativoResponse => ({ id: row.id, nombre: row.nombre, turno: row.turno, descripcion: row.descripcion ?? '', activo: row.activo, gestionAcademicaId: row.gestion_id });
  private levelPayload(req: Academico.NivelEducativoRequest): any { return { gestion_id: req.gestionAcademicaId, nombre: req.nombre, turno: req.turno, descripcion: req.descripcion || null, activo: req.activo }; }
  private toGrade = (row: any): Academico.GradoResponse => ({ id: row.id, nombre: row.nombre, paralelo: row.paralelo, capacidad: row.capacidad, activo: row.activo, nivelEducativoId: row.nivel_id, nivelEducativoNombre: embedded<any>(row.niveles)?.nombre ?? '' });
  private gradePayload(req: Academico.GradoRequest): any { return { nivel_id: req.nivelEducativoId, nombre: req.nombre, paralelo: req.paralelo, capacidad: req.capacidad, activo: req.activo }; }
  private toSubject = (row: any): Academico.MateriaResponse => ({ id: row.id, codigo: row.codigo, nombre: row.nombre, area: row.area ?? '', activa: row.activa });
  private toCourse = (row: any): Academico.CursoResponse => { const grade = embedded<any>(row.grados); const subject = embedded<any>(row.materias); return { id: row.id, gradoId: row.grado_id, gradoNombre: grade?.nombre ?? '', paralelo: grade?.paralelo ?? '', materiaId: row.materia_id, materiaCodigo: subject?.codigo ?? '', materiaNombre: subject?.nombre ?? '', area: subject?.area ?? '', activo: row.activo }; };
  private toInstitution(row: any): InstitutionConfig { return { nombre: row.nombre, ruc: row.ruc ?? '', telefono: row.telefono ?? '', direccion: row.direccion ?? '', correoInstitucional: row.correo_institucional ?? '', sitioWeb: row.sitio_web ?? '', logoUrl: row.logo_url ?? '' }; }
  private toGuardianLink(row: any): EstudianteApoderadoResponse { const parent = embedded<any>(row.padres_familia); const person = embedded<any>(parent?.personas); return { id: row.id, estudianteId: row.estudiante_id, padreFamiliaId: row.padre_familia_id, padreNombreCompleto: `${person?.apellidos ?? ''}, ${person?.nombres ?? ''}`, padreDocumento: person?.numero_documento ?? '', padreTelefono: person?.telefono ?? '', padreCorreo: person?.correo ?? '', parentesco: row.parentesco, principal: row.principal }; }
  private trimesterFrom(value: string): 'I_TRIMESTRE' | 'II_TRIMESTRE' | 'III_TRIMESTRE' { const normalized = value.toUpperCase(); if (normalized.includes('III') || normalized.includes('3')) return 'III_TRIMESTRE'; if (normalized.includes('II') || normalized.includes('2')) return 'II_TRIMESTRE'; return 'I_TRIMESTRE'; }
  private achievement(value: number): string { if (value <= 10) return 'C'; if (value <= 14) return 'B'; if (value <= 19) return 'A'; return 'AD'; }
}
