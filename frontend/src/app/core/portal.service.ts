import { inject, Injectable, signal } from '@angular/core';
import { defer, from, map, Observable, of, throwError } from 'rxjs';
import * as Academico from './academico.models';
import { AuthService } from './auth.service';
import {
  AcademicLevel,
  AdminDashboardPayload,
  AdminInstitutionPayload,
  AuditoriaResponse,
  CompetencyConfig,
  CompetencyNumber,
  CourseAssignment,
  EntityId,
  EstudianteApoderadoRequest,
  EstudianteApoderadoResponse,
  FamilyPortalPayload,
  GradeEntry,
  InstitutionConfig,
  MessagePayload,
  PersonaDropdown,
  PersonaRequest,
  PersonaResponse,
  RolRequest,
  RolResponse,
  StudentAdminRequest,
  StudentAdminResponse,
  StudentCourseReport,
  StudentPortalPayload,
  TeacherDashboardPayload,
  TeacherGradesPayload,
  TeacherGradesSaveInput,
  TeacherImportContextPayload,
  TeacherProgress,
  TrimestreImportacion,
  UsuarioRequest,
  UsuarioResponse,
  UserRow,
  ALL_ROLES,
  AuditFilters,
  AuditPageResponse,
  StudentCompetencyDetail,
  StudentCourseCompetencyReport,
  StudentProfileData,
  StudentEnrollment,
  HorarioEntry,
  HorarioRequest,
  GradoRecesoResponse
} from './models';
import { supabase } from './supabase.client';
import { hasInvalidGrade } from './grade-calculation';

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

function isMissingSchemaError(error: { message?: string; details?: string } | null): boolean {
  const text = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
  return text.includes('schema cache')
    || text.includes('does not exist')
    || text.includes('no existe');
}

const COMPETENCY_NUMBERS: CompetencyNumber[] = [1, 2, 3, 4];
const DEFAULT_CAPACITY_NAMES = ['PRACTICA', 'EXAMEN', 'CUADERNO'] as const;
const DEFAULT_COMPETENCY_NAMES: Record<CompetencyNumber, string> = {
  1: 'Resuelve problemas de cantidad',
  2: 'Resuelve problemas de regularidad, equivalencia y cambio',
  3: 'Resuelve problemas de forma, movimiento y localización',
  4: 'Resuelve problemas de gestión de datos e incertidumbre',
};
const EXCEL_CAPACITY_COLUMNS: Record<CompetencyNumber, string[]> = {
  1: ['F', 'G', 'H', 'I', 'J', 'K'],
  2: ['M', 'N', 'O', 'P', 'Q', 'R'],
  3: ['T', 'U', 'V', 'W', 'X', 'Y'],
  4: ['AA', 'AB', 'AC', 'AD', 'AE', 'AF'],
};

function defaultCompetencies(): CompetencyConfig[] {
  return COMPETENCY_NUMBERS.map((numero) => ({
    numero,
    nombre: DEFAULT_COMPETENCY_NAMES[numero],
    capacidades: DEFAULT_CAPACITY_NAMES.map((nombre, index) => ({ numero: index + 1, nombre })),
  }));
}

@Injectable({ providedIn: 'root' })
export class PortalService {
  private readonly auth = inject(AuthService);
  public readonly familySelectedCode = signal<string>('');

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
        audits: audits.data.slice(0, 12).map((item: any) => ({
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
        audits: audits.data.map((item: any) => ({ accion: item.accion, entidad: item.entidad, responsable: item.usuarioResponsable, fecha: item.creadoEn, detalle: item.detalle })),
      };
    });
  }

  getInstitutionConfigBase(): Observable<InstitutionConfig> {
    return this.observe(async () => {
      const result = await supabase.from('configuracion_institucional').select('*').eq('codigo', 'PRINCIPAL').single();
      const row = dataOf(result as DbResult<any>);
      return this.toInstitution(row);
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
      window.dispatchEvent(new CustomEvent('institutionConfigChanged'));
      return { config: this.toInstitution(dataOf(result as DbResult<any>)), audits: [] };
    });
  }

  uploadInstitutionLogo(file: File): Observable<string> {
    return this.observe(async () => {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('institucional')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('institucional')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    });
  }

  cloneGestionStructure(origenId: EntityId, destinoId: EntityId, options: { niveles?: boolean; periodos?: boolean }): Observable<{ message: string }> {
    return this.observe(async () => {
      const origenResult = await supabase.from('gestiones').select('anio').eq('id', origenId).single();
      const destinoResult = await supabase.from('gestiones').select('anio').eq('id', destinoId).single();
      const yearDiff = (destinoResult.data?.anio || 0) - (origenResult.data?.anio || 0);

      if (options.niveles) {
        const nivelesResult = await supabase.from('niveles').select('*').eq('gestion_id', origenId);
        const niveles = dataOf(nivelesResult as DbResult<any[]>);
        
        for (const nivel of niveles) {
          const newNivel = dataOf(await supabase.from('niveles').insert({
            gestion_id: destinoId,
            nombre: nivel.nombre,
            orden: nivel.orden
          }).select().single() as DbResult<any>);
          
          const gradosResult = await supabase.from('grados').select('*').eq('nivel_id', nivel.id);
          const grados = dataOf(gradosResult as DbResult<any[]>);
          
          for (const grado of grados) {
            const newGrado = dataOf(await supabase.from('grados').insert({
              nivel_id: newNivel.id,
              nombre: grado.nombre,
              paralelo: grado.paralelo,
              orden: grado.orden,
              capacidad: grado.capacidad
            }).select().single() as DbResult<any>);
            
            const cursosResult = await supabase.from('cursos').select('*').eq('grado_id', grado.id);
            const cursos = dataOf(cursosResult as DbResult<any[]>);
            
            if (cursos.length > 0) {
              await supabase.from('cursos').insert(
                cursos.map(c => ({
                  grado_id: newGrado.id,
                  materia_id: c.materia_id,
                  area_academica: c.area_academica
                }))
              );
            }
          }
        }
      }

      if (options.periodos) {
        const periodosResult = await supabase.from('periodos').select('*').eq('gestion_id', origenId);
        const periodos = dataOf(periodosResult as DbResult<any[]>);
        
        if (periodos.length > 0) {
          await supabase.from('periodos').insert(
            periodos.map(p => {
              const shiftDate = (dateStr: string) => {
                if (!dateStr) return null;
                const d = new Date(dateStr);
                d.setFullYear(d.getFullYear() + yearDiff);
                return d.toISOString().split('T')[0];
              };
              return {
                gestion_id: destinoId,
                nombre: p.nombre,
                orden: p.orden,
                fecha_inicio: shiftDate(p.fecha_inicio),
                fecha_fin: shiftDate(p.fecha_fin),
                cerrado: false
              };
            })
          );
        }
      }

      return { message: 'Estructura clonada exitosamente.' };
    });
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

  patchGestion(id: EntityId, partial: Partial<Academico.GestionAcademicaRequest>): Observable<Academico.GestionAcademicaResponse> {
    const payload: any = {};
    if (partial.anio !== undefined) payload.anio = partial.anio;
    if (partial.nombre !== undefined) payload.nombre = partial.nombre;
    if (partial.fechaInicio !== undefined) payload.fecha_inicio = partial.fechaInicio;
    if (partial.fechaFin !== undefined) payload.fecha_fin = partial.fechaFin;
    if (partial.activa !== undefined) payload.activa = partial.activa;
    return this.updateOne('gestiones', id, payload, this.toGestion);
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

  patchPeriodo(id: EntityId, partial: Partial<Academico.PeriodoAcademicoRequest>): Observable<Academico.PeriodoAcademicoResponse> {
    const payload: any = {};
    if (partial.nombre !== undefined) payload.nombre = partial.nombre;
    if (partial.orden !== undefined) payload.orden = partial.orden;
    if (partial.fechaInicio !== undefined) payload.fecha_inicio = partial.fechaInicio;
    if (partial.fechaFin !== undefined) payload.fecha_fin = partial.fechaFin;
    if (partial.cerrado !== undefined) payload.cerrado = partial.cerrado;
    if (partial.gestionAcademicaId !== undefined) payload.gestion_id = partial.gestionAcademicaId;
    return this.updateOne('periodos', id, payload, this.toPeriodo);
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
      dataOf(await supabase.from('asignaciones_docente').upsert(
        { docente_id: req.docenteId, curso_id: req.cursoId, periodo_id: req.periodoAcademicoId, estado: req.estado },
        { onConflict: 'docente_id,curso_id,periodo_id' }
      ) as DbResult);
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
      if (!selected) {
        return {
          courses,
          assignmentId: null,
          selectedCourse: null,
          trimestre: 'I_TRIMESTRE',
          competencias: defaultCompetencies(),
          rows: [],
        };
      }
      const details = dataOf(await supabase.from('asignaciones_docente').select('id,cursos!inner(grado_id),periodos!inner(gestion_id,nombre)').eq('id', selected.assignmentId).single() as DbResult<any>);
      const course = embedded<any>(details.cursos)!;
      const period = embedded<any>(details.periodos)!;
      const trimestre = this.trimesterFrom(period.nombre ?? '');
      const enrollments = dataOf(await supabase.from('matriculas').select('estudiantes!inner(id,codigo,personas!inner(nombres,apellidos))').eq('grado_id', course.grado_id).eq('gestion_id', period.gestion_id).eq('estado', 'ACTIVA') as DbResult<any[]>);
      const [storedConfigs, storedDetails] = await Promise.all([
        supabase
          .from('configuracion_competencias_docente')
          .select('numero_competencia,nombre_competencia,nombres_capacidades')
          .eq('asignacion_docente_id', selected.assignmentId)
          .eq('trimestre', trimestre),
        supabase
          .from('calificacion_detalle_trimestre')
          .select('estudiante_id,numero_competencia,numero_capacidad,nombre_competencia,nombre_nota,valor_nota')
          .eq('asignacion_docente_id', selected.assignmentId)
          .eq('trimestre', trimestre),
      ]);
      let configRows: any[] = [];
      if (storedConfigs.error) {
        if (!isMissingSchemaError(storedConfigs.error)) {
          throw new Error(storedConfigs.error.details || storedConfigs.error.message);
        }
      } else {
        configRows = storedConfigs.data ?? [];
      }

      let detailRows: any[] = [];
      if (storedDetails.error && isMissingSchemaError(storedDetails.error)) {
        const legacyDetails = dataOf(await supabase
          .from('calificacion_detalle_trimestre')
          .select('estudiante_id,numero_competencia,columna_excel,nombre_competencia,nombre_nota,valor_nota')
          .eq('asignacion_docente_id', selected.assignmentId)
          .eq('trimestre', trimestre) as DbResult<any[]>);
        detailRows = legacyDetails.map((item) => {
          const competencyNumber = Number(item.numero_competencia) as CompetencyNumber;
          return {
            ...item,
            numero_capacidad: EXCEL_CAPACITY_COLUMNS[competencyNumber]?.indexOf(item.columna_excel) + 1 || 0,
          };
        }).filter((item) => item.numero_capacidad > 0);
      } else {
        detailRows = dataOf(storedDetails as DbResult<any[]>);
      }

      const competencias: CompetencyConfig[] = COMPETENCY_NUMBERS.map((numero) => {
        const stored = configRows.find((item) => Number(item.numero_competencia) === numero);
        const competencyDetails = detailRows.filter((item) => Number(item.numero_competencia) === numero);
        const highestRecordedCapacity = competencyDetails.reduce(
          (highest, item) => Math.max(highest, Number(item.numero_capacidad) || 0),
          0,
        );
        const configuredNames = Array.isArray(stored?.nombres_capacidades)
          ? stored.nombres_capacidades.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 6)
          : [];
        const capacityCount = Math.min(6, Math.max(3, configuredNames.length, highestRecordedCapacity));
        const capacidades = Array.from({ length: capacityCount }, (_, index) => {
          const detailName = competencyDetails.find((item) => Number(item.numero_capacidad) === index + 1)?.nombre_nota;
          return {
            numero: index + 1,
            nombre: configuredNames[index]
              || String(detailName ?? '').trim()
              || DEFAULT_CAPACITY_NAMES[index]
              || `CAPACIDAD ${index + 1}`,
          };
        });
        return {
          numero,
          nombre: String(stored?.nombre_competencia
            || competencyDetails[0]?.nombre_competencia
            || DEFAULT_COMPETENCY_NAMES[numero]).trim(),
          capacidades,
        };
      });

      const gradeMap = new Map(detailRows.map((item) => [
        `${item.estudiante_id}|${item.numero_competencia}|${item.numero_capacidad}`,
        Number(item.valor_nota),
      ]));
      const rows: GradeEntry[] = enrollments.map((item) => {
        const student = embedded<any>(item.estudiantes)!;
        const person = embedded<any>(student.personas)!;
        return {
          estudianteId: student.id,
          codigo: student.codigo,
          estudiante: `${person.apellidos}, ${person.nombres}`,
          competencias: competencias.map((competencia) => ({
            numero: competencia.numero,
            notas: competencia.capacidades.map((capacidad) => (
              gradeMap.get(`${student.id}|${competencia.numero}|${capacidad.numero}`) ?? null
            )),
          })),
        };
      }).sort((a, b) => a.estudiante.localeCompare(b.estudiante, 'es'));
      return {
        courses,
        assignmentId: selected.assignmentId,
        selectedCourse: selected,
        trimestre,
        competencias,
        rows,
      };
    });
  }

  saveTeacherGrades(assignmentId: EntityId, input: TeacherGradesSaveInput): Observable<MessagePayload> {
    return this.observe(async () => {
      if (input.competencias.length !== 4
        || input.competencias.some((item) => item.capacidades.length < 3 || item.capacidades.length > 6)) {
        throw new Error('Cada curso debe conservar 4 competencias y entre 3 y 6 capacidades por competencia.');
      }
      const duplicateOrBlankName = input.competencias.some((item) => {
        const names = item.capacidades.map((capacity) => capacity.nombre.trim().toLocaleUpperCase('es'));
        return names.some((name) => !name) || new Set(names).size !== names.length;
      });
      if (duplicateOrBlankName) {
        throw new Error('Los nombres de capacidades no pueden estar vacíos ni repetidos dentro de una competencia.');
      }
      if (input.estudiantes.some((student) => student.competencias
        .some((competency) => competency.notas.some(hasInvalidGrade)))) {
        throw new Error('Cada nota debe ser un número entre 0 y 20.');
      }

      const result = dataOf(await supabase.rpc('guardar_notas_competencias', {
        p_asignacion_id: assignmentId,
        p_trimestre: input.trimestre,
        p_competencias: input.competencias.map((item) => ({
          numero_competencia: item.numero,
          nombre_competencia: item.nombre,
          nombres_capacidades: item.capacidades.map((capacity) => capacity.nombre.trim()),
        })),
        p_estudiantes: input.estudiantes.map((student) => ({
          estudiante_id: student.estudianteId,
          competencias: student.competencias.map((item) => ({
            numero_competencia: item.numero,
            notas: item.notas,
          })),
        })),
      }) as unknown as DbResult<{ message?: string }>);
      return { message: result?.message || 'Notas y capacidades guardadas correctamente.' };
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
        ], reports: own,
      };
    });
  }

  studentCompetencyGrades(): Observable<StudentCourseCompetencyReport[]> {
    return this.observe(async () => {
      const student = dataOf(await supabase.from('estudiantes').select('id').single() as DbResult<any>);
      const [detailsResult, averagesResult] = await Promise.all([
        supabase
          .from('calificacion_detalle_trimestre')
          .select('*,asignaciones_docente!inner(cursos!inner(materias(nombre)),periodos(nombre))')
          .eq('estudiante_id', student.id),
        supabase
          .from('calificacion_competencia_trimestre')
          .select('*')
          .eq('estudiante_id', student.id)
      ]);

      const details = dataOf(detailsResult as DbResult<any[]>);
      const averages = dataOf(averagesResult as DbResult<any[]>);

      const groups = new Map<string, any[]>();
      for (const d of details) {
        const key = `${d.asignacion_docente_id}|${d.trimestre}`;
        groups.set(key, [...(groups.get(key) ?? []), d]);
      }

      const result: StudentCourseCompetencyReport[] = [];
      for (const [key, rows] of groups) {
        const [assignmentId, trimestre] = key.split('|');
        const first = rows[0];
        const assignment = embedded<any>(first.asignaciones_docente);
        const course = embedded<any>(assignment?.cursos);
        const subject = embedded<any>(course?.materias);
        const period = embedded<any>(assignment?.periodos);

        const compMap = new Map<number, any[]>();
        for (const r of rows) {
          const cn = Number(r.numero_competencia);
          if (!compMap.has(cn)) compMap.set(cn, []);
          compMap.get(cn)!.push(r);
        }

        const competencias: StudentCompetencyDetail[] = [];
        for (const [num, items] of compMap) {
          const capacidades = items.map((i: any) => ({
            numero: Number(i.numero_capacidad),
            nombre: i.nombre_nota,
            nota: i.valor_nota !== null ? Number(i.valor_nota) : null,
          })).sort((a: any, b: any) => a.numero - b.numero);

          const avgRow = averages.find(a => 
            a.asignacion_docente_id === assignmentId && 
            a.trimestre === trimestre && 
            Number(a.numero_competencia) === num
          );

          competencias.push({
            numeroCompetencia: num,
            nombreCompetencia: items[0].nombre_competencia,
            capacidades,
            promedioCompetencia: avgRow && avgRow.promedio_competencia !== null ? Number(avgRow.promedio_competencia) : null,
          });
        }
        
        const validPromedios = competencias.map(c => c.promedioCompetencia).filter(p => p !== null) as number[];
        const promedioFinal = validPromedios.length ? validPromedios.reduce((a,b)=>a+b,0)/validPromedios.length : null;

        result.push({
          curso: subject?.nombre ?? 'Curso',
          periodo: period?.nombre ?? 'Periodo',
          trimestre,
          competencias,
          promedioFinal,
        });
      }
      return result;
    });
  }

  studentProfile(): Observable<StudentProfileData> {
    return this.observe(async () => {
      const student = dataOf(await supabase.from('estudiantes').select('id,codigo,persona_id,personas(*)').single() as DbResult<any>);
      const person = embedded<any>(student.personas);
      return {
        personaId: student.persona_id,
        estudianteId: student.id,
        codigo: student.codigo,
        nombres: person.nombres,
        apellidos: person.apellidos,
        tipoDocumento: person.tipo_documento,
        documentoIdentidad: person.numero_documento,
        fechaNacimiento: person.fecha_nacimiento,
        genero: person.genero,
        direccion: person.direccion,
        telefono: person.telefono,
        correo: person.correo,
      };
    });
  }

  updateStudentProfile(req: Partial<StudentProfileData>): Observable<StudentProfileData> {
    return this.observe(async () => {
      const student = dataOf(await supabase.from('estudiantes').select('persona_id').single() as DbResult<any>);
      dataOf(await supabase.from('personas').update({
        nombres: req.nombres,
        apellidos: req.apellidos,
        telefono: req.telefono || null,
        direccion: req.direccion || null,
        correo: req.correo || null,
      }).eq('id', student.persona_id) as DbResult);
      return await this.studentProfile().toPromise() as StudentProfileData;
    });
  }

  studentEnrollments(): Observable<StudentEnrollment[]> {
    return this.observe(async () => {
      const student = dataOf(await supabase.from('estudiantes').select('id').single() as DbResult<any>);
      const rows = dataOf(await supabase
        .from('matriculas')
        .select('*,grados(nombre,paralelo,niveles(nombre)),gestiones(nombre)')
        .eq('estudiante_id', student.id)
        .order('created_at', { ascending: false }) as DbResult<any[]>);
      return rows.map(row => {
        const grade = embedded<any>(row.grados);
        const level = embedded<any>(grade?.niveles);
        const gestion = embedded<any>(row.gestiones);
        return {
          id: row.id,
          codigoMatricula: row.codigo,
          gestion: gestion?.nombre ?? '',
          nivel: level?.nombre ?? '',
          grado: grade?.nombre ?? '',
          seccion: grade?.paralelo ?? '',
          fechaMatricula: row.fecha_matricula,
          estado: row.estado,
        };
      });
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

  familyCompetencyGrades(codigo: string): Observable<StudentCourseCompetencyReport[]> {
    return this.observe(async () => {
      const student = dataOf(await supabase.from('estudiantes').select('id').eq('codigo', codigo).single() as DbResult<any>);
      const details = dataOf(await supabase
        .from('calificacion_detalle_trimestre')
        .select('*,asignaciones_docente!inner(cursos!inner(materias(nombre)),periodos(nombre))')
        .eq('estudiante_id', student.id) as DbResult<any[]>);
      const averages = dataOf(await supabase
        .from('calificacion_competencia_trimestre')
        .select('*')
        .eq('estudiante_id', student.id) as DbResult<any[]>);

      const groups = new Map<string, any[]>();
      for (const d of details) {
        const key = `${d.asignacion_docente_id}|${d.trimestre}`;
        groups.set(key, [...(groups.get(key) ?? []), d]);
      }

      const result: StudentCourseCompetencyReport[] = [];
      for (const [key, rows] of groups) {
        const [assignmentId, trimestre] = key.split('|');
        const first = rows[0];
        const assignment = embedded<any>(first.asignaciones_docente);
        const course = embedded<any>(assignment?.cursos);
        const subject = embedded<any>(course?.materias);
        const period = embedded<any>(assignment?.periodos);

        const compMap = new Map<number, any[]>();
        for (const r of rows) {
          const cn = Number(r.numero_competencia);
          if (!compMap.has(cn)) compMap.set(cn, []);
          compMap.get(cn)!.push(r);
        }

        const competencias: StudentCompetencyDetail[] = [];
        for (const [num, items] of compMap) {
          const capacidades = items.map((i: any) => ({
            numero: Number(i.numero_capacidad),
            nombre: i.nombre_nota,
            nota: i.valor_nota !== null ? Number(i.valor_nota) : null,
          })).sort((a: any, b: any) => a.numero - b.numero);

          const avgRow = averages.find(a => 
            a.asignacion_docente_id === assignmentId && 
            a.trimestre === trimestre && 
            Number(a.numero_competencia) === num
          );

          competencias.push({
            numeroCompetencia: num,
            nombreCompetencia: items[0].nombre_competencia,
            capacidades,
            promedioCompetencia: avgRow && avgRow.promedio_competencia !== null ? Number(avgRow.promedio_competencia) : null,
          });
        }
        
        const validPromedios = competencias.map(c => c.promedioCompetencia).filter(p => p !== null) as number[];
        const promedioFinal = validPromedios.length ? validPromedios.reduce((a,b)=>a+b,0)/validPromedios.length : null;

        result.push({
          curso: subject?.nombre ?? 'Curso',
          periodo: period?.nombre ?? 'Periodo',
          trimestre,
          competencias,
          promedioFinal,
        });
      }
      return result;
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
    return this.observe(async () => {
      const person = dataOf(await supabase.from('personas').select('correo,numero_documento').eq('id', req.personaId).single() as DbResult<any>);
      const email = String(person.correo ?? '').trim().toLowerCase();
      const password = String(person.numero_documento ?? '').trim();
      if (!email) throw new Error('La persona debe tener un correo registrado.');
      if (!password) throw new Error('La persona debe tener un número de documento para la contraseña inicial.');
      const data = await this.invokeEdge<any>('administrar-usuario', { action: 'crear', personaId: req.personaId, rol: req.roles[0] });
      return { id: data.id, personaId: data.persona_id, username: data.email ?? data.username, activo: data.activo, roles: [data.rol] } as UsuarioResponse;
    });
  }

  updateUser(id: EntityId, req: UsuarioRequest): Observable<UsuarioResponse> {
    const email = req.username.includes('@') ? req.username : `${req.username}@aduni.local`;
    return this.userFunction({ action: 'actualizar', userId: id, email, username: email, password: req.password || undefined, rol: req.roles[0] });
  }

  deleteUser(id: EntityId): Observable<void> { return this.userFunction({ action: 'desactivar', userId: id }).pipe(map(() => undefined)); }
  activateUser(id: EntityId): Observable<void> { return this.userFunction({ action: 'activar', userId: id }).pipe(map(() => undefined)); }

  getRoles(): Observable<RolResponse[]> {
    return this.observe(async () => {
      const { data, error } = await supabase.from('profiles').select('rol');
      if (error) throw error;
      const usedRoles = [...new Set(data?.map(r => r.rol).filter(Boolean))];
      const allRoles = new Set([...usedRoles, ...ALL_ROLES]);
      return Array.from(allRoles).map((nombre) => ({ id: nombre as string, nombre: nombre as string, creadoEn: '-' }));
    });
  }
  createRole(_req: RolRequest): Observable<RolResponse> { return throwError(() => new Error('Los roles son fijos y se administran en el enum app_role de la BD.')); }
  updateRole(_id: EntityId, _req: RolRequest): Observable<RolResponse> { return throwError(() => new Error('Los roles son fijos.')); }
  deleteRole(_id: EntityId): Observable<void> { return throwError(() => new Error('Los roles son fijos y no pueden eliminarse.')); }

  getPersonasDropdown(): Observable<PersonaDropdown[]> {
    return this.getPersonas().pipe(map((rows) => rows.filter((row) => row.activo).map((row) => ({
      id: row.id,
      nombreCompleto: `${row.apellidos}, ${row.nombres}`,
      documentoIdentidad: row.documentoIdentidad,
      correo: row.correo,
    }))));
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

  getAuditorias(filters: AuditFilters): Observable<AuditPageResponse> {
    return this.observe(() => this.fetchAudits(filters));
  }

  getNiveles(): Observable<Academico.NivelEducativoResponse[]> {
    return this.observe(async () => (dataOf(await supabase.from('niveles').select('*').order('nombre') as DbResult<any[]>)).map(this.toLevel));
  }
  createNivel(req: Academico.NivelEducativoRequest): Observable<Academico.NivelEducativoResponse> { return this.insertOne('niveles', this.levelPayload(req), this.toLevel); }
  updateNivel(id: EntityId, req: Academico.NivelEducativoRequest): Observable<Academico.NivelEducativoResponse> { return this.updateOne('niveles', id, this.levelPayload(req), this.toLevel); }
  deleteNivel(id: EntityId): Observable<void> { return this.deleteOne('niveles', id); }

  getGrados(nivelId: EntityId): Observable<Academico.GradoResponse[]> {
    return this.observe(async () => {
      const rows = dataOf(await supabase.from('grados').select('*,niveles(nombre),matriculas(estado)').eq('nivel_id', nivelId).order('nombre') as DbResult<any[]>);
      return rows.map(row => {
        row.inscritos = (row.matriculas || []).filter((m: any) => m.estado === 'ACTIVA').length;
        return this.toGrade(row);
      });
    });
  }
  createGrado(req: Academico.GradoRequest): Observable<Academico.GradoResponse> { return this.insertOne('grados', this.gradePayload(req), this.toGrade); }
  updateGrado(id: EntityId, req: Academico.GradoRequest): Observable<Academico.GradoResponse> { return this.updateOne('grados', id, this.gradePayload(req), this.toGrade); }
  deleteGrado(id: EntityId): Observable<void> { return this.deleteOne('grados', id); }

  buscarEstudiantes(search = ''): Observable<StudentAdminResponse[]> {
    return this.observe(async () => {
      const rows = dataOf(await supabase.from('estudiantes').select('id,codigo,activo,persona_id,personas!inner(*)').order('created_at', { ascending: false }) as DbResult<any[]>);
      const term = search.trim().toLowerCase();
      return rows.map((row) => {
        const p = embedded<any>(row.personas)!;
        return {
          id: row.id,
          personaId: row.persona_id,
          codigoEstudiante: row.codigo,
          activo: row.activo,
          nombres: p.nombres,
          apellidos: p.apellidos,
          tipoDocumento: p.tipo_documento,
          documentoIdentidad: p.numero_documento,
          fechaNacimiento: p.fecha_nacimiento,
          genero: p.genero,
          correo: p.correo,
          telefono: p.telefono,
          direccion: p.direccion,
        } as StudentAdminResponse;
      }).filter((row) => !term || `${row.nombres} ${row.apellidos} ${row.documentoIdentidad} ${row.codigoEstudiante} ${row.correo ?? ''}`.toLowerCase().includes(term));
    });
  }

  crearEstudiante(req: StudentAdminRequest): Observable<StudentAdminResponse> {
    return this.observe(async () => {
      const data = await this.invokeEdge<{ student: StudentAdminResponse }>('administrar-estudiante', {
        action: 'crear',
        person: req,
        student: { codigoEstudiante: req.codigoEstudiante, activo: req.activo ?? true },
      });
      return data.student;
    });
  }

  actualizarEstudiante(id: EntityId, req: StudentAdminRequest): Observable<StudentAdminResponse> {
    return this.observe(async () => {
      const data = await this.invokeEdge<{ student: StudentAdminResponse }>('administrar-estudiante', {
        action: 'actualizar',
        studentId: id,
        person: req,
        student: { codigoEstudiante: req.codigoEstudiante, activo: req.activo ?? true },
      });
      return data.student;
    });
  }
  desactivarEstudiante(id: EntityId): Observable<void> { return this.studentStatus(id, 'desactivar'); }
  activarEstudiante(id: EntityId): Observable<void> { return this.studentStatus(id, 'activar'); }

  listarMatriculas(): Observable<any[]> {
    return this.observe(async () => {
      const rows = dataOf(await supabase.from('matriculas').select('*,estudiantes(codigo,personas(nombres,apellidos)),grados(nombre,paralelo,niveles(nombre)),gestiones(nombre)').order('created_at', { ascending: false }) as DbResult<any[]>);
      return rows.map((row) => { const student = embedded<any>(row.estudiantes); const person = embedded<any>(student?.personas); const grade = embedded<any>(row.grados); const level = embedded<any>(grade?.niveles); return { id: row.id, codigoMatricula: row.codigo, estudianteId: row.estudiante_id, estudianteCodigo: student?.codigo ?? '', estudianteNombre: `${person?.apellidos ?? ''}, ${person?.nombres ?? ''}`, gradoNombre: grade?.nombre ?? '', paralelo: grade?.paralelo ?? '', nivelNombre: level?.nombre ?? '', fechaMatricula: row.fecha_matricula, estado: row.estado }; });
    });
  }

  matricularEstudiante(req: any): Observable<any> {
    return this.observe(async () => {
      const grade = dataOf(await supabase.from('grados').select('capacidad, niveles!inner(gestion_id)').eq('id', req.gradoId).single() as DbResult<any>);
      const level = embedded<any>(grade.niveles)!;
      const capacidad = grade.capacidad || 0;

      const duplicate = dataOf(await supabase.from('matriculas').select('id').eq('estudiante_id', req.estudianteId).eq('gestion_id', level.gestion_id).neq('estado', 'ANULADA').maybeSingle() as DbResult<any>);
      if (duplicate) throw new Error('El estudiante ya tiene una matrícula en esta gestión.');

      if (capacidad > 0) {
        const { count, error } = await supabase.from('matriculas').select('id', { count: 'exact', head: true }).eq('grado_id', req.gradoId).eq('estado', 'ACTIVA');
        if (error) throw error;
        if ((count || 0) >= capacidad) {
          throw new Error(`Este salón ha alcanzado su aforo máximo (${capacidad} alumnos).`);
        }
      }

      return dataOf(await supabase.from('matriculas').insert({ codigo: `MAT-${Date.now()}`.slice(0, 30), estudiante_id: req.estudianteId, grado_id: req.gradoId, gestion_id: level.gestion_id, estado: 'ACTIVA' }).select().single() as DbResult<any>);
    });
  }
  trasladarMatricula(matriculaId: EntityId, nuevoGradoId: EntityId): Observable<void> {
    return this.observe(async () => {
      const grade = dataOf(await supabase.from('grados').select('capacidad').eq('id', nuevoGradoId).single() as DbResult<any>);
      const capacidad = grade.capacidad || 0;

      if (capacidad > 0) {
        const { count, error } = await supabase.from('matriculas').select('id', { count: 'exact', head: true }).eq('grado_id', nuevoGradoId).eq('estado', 'ACTIVA');
        if (error) throw error;
        if ((count || 0) >= capacidad) {
          throw new Error(`Este salón ha alcanzado su aforo máximo (${capacidad} alumnos). No es posible realizar el traslado.`);
        }
      }

      dataOf(await supabase.from('matriculas').update({ grado_id: nuevoGradoId }).eq('id', matriculaId) as DbResult);
    });
  }

  cambiarEstadoMatricula(id: EntityId, estado: string): Observable<void> { return this.observe(async () => { dataOf(await supabase.from('matriculas').update({ estado }).eq('id', id) as DbResult); }); }

  getMaterias(): Observable<Academico.MateriaResponse[]> { return this.observe(async () => (dataOf(await supabase.from('materias').select('*').order('nombre') as DbResult<any[]>)).map(this.toSubject)); }
  createMateria(req: Academico.MateriaRequest): Observable<Academico.MateriaResponse> { return this.insertOne('materias', { codigo: req.codigo, nombre: req.nombre, area: req.area || null, activa: req.activa }, this.toSubject); }
  updateMateria(id: EntityId, req: Academico.MateriaRequest): Observable<Academico.MateriaResponse> { return this.updateOne('materias', id, { codigo: req.codigo, nombre: req.nombre, area: req.area || null, activa: req.activa }, this.toSubject); }
  deleteMateria(id: EntityId): Observable<void> { return this.deleteOne('materias', id); }

  getCursos(gradoId: EntityId): Observable<Academico.CursoResponse[]> {
    return this.observe(async () => (dataOf(await supabase.from('cursos').select('*,grados(nombre,paralelo,niveles(nombre,turno)),materias(codigo,nombre,area)').eq('grado_id', gradoId).order('created_at') as DbResult<any[]>)).map(this.toCourse));
  }
  asignarCursosMasivo(req: Academico.CursoAsignacionMasivaRequest): Observable<void> { return this.observe(async () => { dataOf(await supabase.from('cursos').upsert(req.materiasIds.map((materiaId) => ({ grado_id: req.gradoId, materia_id: materiaId, activo: true })), { onConflict: 'grado_id,materia_id' }) as DbResult); }); }
  removerCurso(id: EntityId): Observable<void> { return this.deleteOne('cursos', id); }
  removerCursosMasivo(gradoId: EntityId, materiasIds: EntityId[]): Observable<void> {
    if (!materiasIds.length) return of(undefined);
    return this.observe(async () => {
      await supabase.from('cursos').delete().eq('grado_id', gradoId).in('materia_id', materiasIds);
    });
  }

  getApoderados(estudianteId: EntityId): Observable<EstudianteApoderadoResponse[]> {
    return this.observe(async () => {
      const rows = dataOf(await supabase.from('estudiante_apoderados').select('*,padres_familia!inner(id,personas!inner(nombres,apellidos,numero_documento,telefono,correo))').eq('estudiante_id', estudianteId).eq('activo', true) as DbResult<any[]>);
      return rows.map((row) => this.toGuardianLink(row));
    });
  }
  asignarApoderado(estudianteId: EntityId, req: EstudianteApoderadoRequest): Observable<EstudianteApoderadoResponse> { return this.observe(async () => { const row = dataOf(await supabase.from('estudiante_apoderados').insert({ estudiante_id: estudianteId, padre_familia_id: req.padreFamiliaId, parentesco: req.parentesco, principal: req.principal }).select('*,padres_familia!inner(id,personas!inner(nombres,apellidos,numero_documento,telefono,correo))').single() as DbResult<any>); return this.toGuardianLink(row); }); }
  actualizarApoderado(_estudianteId: EntityId, id: EntityId, req: EstudianteApoderadoRequest): Observable<EstudianteApoderadoResponse> { return this.observe(async () => { const row = dataOf(await supabase.from('estudiante_apoderados').update({ padre_familia_id: req.padreFamiliaId, parentesco: req.parentesco, principal: req.principal }).eq('id', id).select('*,padres_familia!inner(id,personas!inner(nombres,apellidos,numero_documento,telefono,correo))').single() as DbResult<any>); return this.toGuardianLink(row); }); }
  removerApoderado(_estudianteId: EntityId, id: EntityId): Observable<void> { return this.observe(async () => { dataOf(await supabase.from('estudiante_apoderados').update({ activo: false }).eq('id', id) as DbResult); }); }

  // --- Módulo de Horarios ---
  getGradoReceso(gradoId: EntityId): Observable<GradoRecesoResponse> {
    return this.observe(async () => {
      const row = dataOf(await supabase.from('grados').select('receso_inicio, receso_fin').eq('id', gradoId).single() as DbResult<any>);
      return {
        gradoId,
        recesoInicio: row.receso_inicio ? row.receso_inicio.slice(0, 5) : null,
        recesoFin: row.receso_fin ? row.receso_fin.slice(0, 5) : null
      };
    });
  }

  updateGradoReceso(gradoId: EntityId, recesoInicio: string | null, recesoFin: string | null): Observable<void> {
    return this.observe(async () => {
      dataOf(await supabase.from('grados').update({
        receso_inicio: recesoInicio,
        receso_fin: recesoFin
      }).eq('id', gradoId) as DbResult);
    });
  }
  getHorariosPorGrado(gradoId: EntityId): Observable<HorarioEntry[]> {
    return this.observe(async () => {
      const rows = dataOf(await supabase
        .from('horarios')
        .select('*,cursos(materias(nombre),asignaciones_docente(docentes(personas(nombres,apellidos))))')
        .eq('grado_id', gradoId)
        .order('dia_semana')
        .order('hora_inicio') as DbResult<any[]>);
      const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      return rows.map((row: any) => {
        const course = embedded<any>(row.cursos);
        const subject = embedded<any>(course?.materias);
        
        let docente = '';
        if (course?.asignaciones_docente && course.asignaciones_docente.length > 0) {
          const assignment = course.asignaciones_docente[0];
          const teacher = embedded<any>(assignment?.docentes);
          const person = embedded<any>(teacher?.personas);
          if (person) {
            docente = `${person.nombres} ${person.apellidos}`;
          }
        }

        return {
          id: row.id,
          gradoId: row.grado_id,
          cursoId: row.curso_id,
          diaSemana: row.dia_semana,
          diaNombre: DIAS[row.dia_semana] ?? '',
          horaInicio: row.hora_inicio.slice(0, 5),
          horaFin: row.hora_fin.slice(0, 5),
          curso: subject?.nombre ?? '',
          materia: subject?.nombre ?? '',
          aula: row.aula ?? '',
          docente
        };
      });
    });
  }

  crearHorario(req: HorarioRequest): Observable<HorarioEntry> {
    return this.observe(async () => {
      const row = dataOf(await supabase.from('horarios').insert({
        grado_id: req.gradoId,
        curso_id: req.cursoId,
        dia_semana: req.diaSemana,
        hora_inicio: req.horaInicio,
        hora_fin: req.horaFin,
        aula: req.aula || null,
      }).select('*,cursos(materias(nombre))').single() as DbResult<any>);
      
      const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const course = embedded<any>(row.cursos);
      const subject = embedded<any>(course?.materias);
      
      return {
        id: row.id,
        gradoId: row.grado_id,
        cursoId: row.curso_id,
        diaSemana: row.dia_semana,
        diaNombre: DIAS[row.dia_semana] ?? '',
        horaInicio: row.hora_inicio.slice(0, 5),
        horaFin: row.hora_fin.slice(0, 5),
        curso: subject?.nombre ?? '',
        materia: subject?.nombre ?? '',
        aula: row.aula ?? '',
      };
    });
  }

  actualizarHorario(id: EntityId, req: Partial<HorarioRequest>): Observable<HorarioEntry> {
    return this.observe(async () => {
      const payload: any = {};
      if (req.diaSemana !== undefined) payload.dia_semana = req.diaSemana;
      if (req.horaInicio !== undefined) payload.hora_inicio = req.horaInicio;
      if (req.horaFin !== undefined) payload.hora_fin = req.horaFin;
      if (req.aula !== undefined) payload.aula = req.aula || null;

      const row = dataOf(await supabase.from('horarios').update(payload).eq('id', id).select('*,cursos(materias(nombre))').single() as DbResult<any>);
      
      const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const course = embedded<any>(row.cursos);
      const subject = embedded<any>(course?.materias);
      
      return {
        id: row.id,
        gradoId: row.grado_id,
        cursoId: row.curso_id,
        diaSemana: row.dia_semana,
        diaNombre: DIAS[row.dia_semana] ?? '',
        horaInicio: row.hora_inicio.slice(0, 5),
        horaFin: row.hora_fin.slice(0, 5),
        curso: subject?.nombre ?? '',
        materia: subject?.nombre ?? '',
        aula: row.aula ?? '',
      };
    });
  }

  eliminarHorario(id: EntityId): Observable<void> {
    return this.observe(async () => {
      dataOf(await supabase.from('horarios').delete().eq('id', id) as DbResult);
    });
  }

  getMiReceso(): Observable<GradoRecesoResponse> {
    return this.observe(async () => {
      const student = dataOf(await supabase.from('estudiantes').select('id').single() as DbResult<any>);
      const matricula = dataOf(await supabase
        .from('matriculas')
        .select('grado_id')
        .eq('estudiante_id', student.id)
        .eq('estado', 'ACTIVA')
        .limit(1)
        .single() as DbResult<any>);
      const row = dataOf(await supabase.from('grados').select('receso_inicio, receso_fin').eq('id', matricula.grado_id).single() as DbResult<any>);
      return {
        gradoId: matricula.grado_id,
        recesoInicio: row.receso_inicio ? row.receso_inicio.slice(0, 5) : null,
        recesoFin: row.receso_fin ? row.receso_fin.slice(0, 5) : null
      };
    });
  }

  getMiHorario(): Observable<HorarioEntry[]> {
    return this.observe(async () => {
      const student = dataOf(await supabase.from('estudiantes').select('id').single() as DbResult<any>);
      const matricula = dataOf(await supabase
        .from('matriculas')
        .select('grado_id')
        .eq('estudiante_id', student.id)
        .eq('estado', 'ACTIVA')
        .limit(1)
        .single() as DbResult<any>);
      const rows = dataOf(await supabase
        .from('horarios')
        .select('*,cursos(materias(nombre),asignaciones_docente(docentes(personas(nombres,apellidos))))')
        .eq('grado_id', matricula.grado_id)
        .order('dia_semana')
        .order('hora_inicio') as DbResult<any[]>);
      const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      return rows.map((row: any) => {
        const course = embedded<any>(row.cursos);
        const subject = embedded<any>(course?.materias);

        let docente = '';
        if (course?.asignaciones_docente && course.asignaciones_docente.length > 0) {
          const assignment = course.asignaciones_docente[0];
          const teacher = embedded<any>(assignment?.docentes);
          const person = embedded<any>(teacher?.personas);
          if (person) {
            docente = `${person.nombres} ${person.apellidos}`;
          }
        }

        return {
          id: row.id,
          gradoId: row.grado_id,
          cursoId: row.curso_id,
          diaSemana: row.dia_semana,
          diaNombre: DIAS[row.dia_semana] ?? '',
          horaInicio: row.hora_inicio.slice(0, 5),
          horaFin: row.hora_fin.slice(0, 5),
          curso: subject?.nombre ?? '',
          materia: subject?.nombre ?? '',
          aula: row.aula ?? '',
          docente
        };
      });
    });
  }

  getRecesoEstudiante(codigo: string): Observable<GradoRecesoResponse> {
    return this.observe(async () => {
      const student = dataOf(await supabase.from('estudiantes').select('id').eq('codigo', codigo).single() as DbResult<any>);
      const matricula = dataOf(await supabase
        .from('matriculas')
        .select('grado_id')
        .eq('estudiante_id', student.id)
        .eq('estado', 'ACTIVA')
        .limit(1)
        .single() as DbResult<any>);
      const row = dataOf(await supabase.from('grados').select('receso_inicio, receso_fin').eq('id', matricula.grado_id).single() as DbResult<any>);
      return {
        gradoId: matricula.grado_id,
        recesoInicio: row.receso_inicio ? row.receso_inicio.slice(0, 5) : null,
        recesoFin: row.receso_fin ? row.receso_fin.slice(0, 5) : null
      };
    });
  }

  getHorarioEstudiante(codigo: string): Observable<HorarioEntry[]> {
    return this.observe(async () => {
      const student = dataOf(await supabase.from('estudiantes').select('id').eq('codigo', codigo).single() as DbResult<any>);
      const matricula = dataOf(await supabase
        .from('matriculas')
        .select('grado_id')
        .eq('estudiante_id', student.id)
        .eq('estado', 'ACTIVA')
        .limit(1)
        .single() as DbResult<any>);
      const rows = dataOf(await supabase
        .from('horarios')
        .select('*,cursos(materias(nombre),asignaciones_docente(docentes(personas(nombres,apellidos))))')
        .eq('grado_id', matricula.grado_id)
        .order('dia_semana')
        .order('hora_inicio') as DbResult<any[]>);
      const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      return rows.map((row: any) => {
        const course = embedded<any>(row.cursos);
        const subject = embedded<any>(course?.materias);

        let docente = '';
        if (course?.asignaciones_docente && course.asignaciones_docente.length > 0) {
          const assignment = course.asignaciones_docente[0];
          const teacher = embedded<any>(assignment?.docentes);
          const person = embedded<any>(teacher?.personas);
          if (person) {
            docente = `${person.nombres} ${person.apellidos}`;
          }
        }

        return {
          id: row.id,
          gradoId: row.grado_id,
          cursoId: row.curso_id,
          diaSemana: row.dia_semana,
          diaNombre: DIAS[row.dia_semana] ?? '',
          horaInicio: row.hora_inicio.slice(0, 5),
          horaFin: row.hora_fin.slice(0, 5),
          curso: subject?.nombre ?? '',
          materia: subject?.nombre ?? '',
          aula: row.aula ?? '',
          docente
        };
      });
    });
  }

  private observe<T>(factory: () => Promise<T>): Observable<T> { return defer(() => from(factory())); }
  private insertOne<T>(table: string, payload: any, mapper: (row: any) => T): Observable<T> { return this.observe(async () => mapper(dataOf(await supabase.from(table).insert(payload).select().single() as DbResult<any>))); }
  private updateOne<T>(table: string, id: EntityId, payload: any, mapper: (row: any) => T): Observable<T> { return this.observe(async () => mapper(dataOf(await supabase.from(table).update(payload).eq('id', id).select().single() as DbResult<any>))); }
  private deleteOne(table: string, id: EntityId): Observable<void> { return this.observe(async () => { dataOf(await supabase.from(table).delete().eq('id', id) as DbResult); }); }

  private userFunction(body: Record<string, unknown>): Observable<any> {
    return this.observe(async () => { const data = await this.invokeEdge<any>('administrar-usuario', body); return { id: data.id, personaId: data.persona_id, username: data.email ?? data.username, activo: data.activo, roles: [data.rol] }; });
  }

  private studentStatus(id: EntityId, action: 'activar' | 'desactivar'): Observable<void> {
    return this.observe(async () => { await this.invokeEdge('administrar-estudiante', { action, studentId: id }); });
  }

  private async invokeEdge<T>(name: string, body: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) {
      const context = (error as { context?: Response }).context;
      if (context) {
        let payload: { message?: string } | null = null;
        try {
          payload = await context.clone().json() as { message?: string };
        } catch { /* The gateway may return an empty or non-JSON error body. */ }
        if (payload?.message) throw new Error(payload.message);
      }
      throw new Error(error.message || 'La operación remota no pudo completarse.');
    }
    if (data?.message && !data?.id && !data?.student && !data?.persona_id) throw new Error(data.message);
    return data as T;
  }

  private async fetchPerson(id: EntityId): Promise<PersonaResponse> { const row = dataOf(await supabase.from('personas').select('*,docentes(*),estudiantes(*),padres_familia(*),administrativos(*)').eq('id', id).single() as DbResult<any>); return this.toPerson(row); }
  private async savePersonSubtype(personId: EntityId, req: PersonaRequest): Promise<void> {
    const code = (req.codigo || `${req.tipoPersona.slice(0, 3)}-${req.documentoIdentidad}`).slice(0, 30);
    if (req.tipoPersona === 'DOCENTE') dataOf(await supabase.from('docentes').upsert({ persona_id: personId, codigo: code, especialidad: req.especialidad || null, area_academica: req.areaAcademica || null, activo: true }, { onConflict: 'persona_id' }) as DbResult);
    if (req.tipoPersona === 'ESTUDIANTE') dataOf(await supabase.from('estudiantes').upsert({ persona_id: personId, codigo: code, activo: true }, { onConflict: 'persona_id' }) as DbResult);
    if (req.tipoPersona === 'PADRE_FAMILIA') dataOf(await supabase.from('padres_familia').upsert({ persona_id: personId, ocupacion: req.ocupacion || null, activo: true }, { onConflict: 'persona_id' }) as DbResult);
    if (req.tipoPersona === 'ADMINISTRATIVO') dataOf(await supabase.from('administrativos').upsert({ persona_id: personId, codigo: code, cargo: req.cargo || 'Administrativo', activo: true }, { onConflict: 'persona_id' }) as DbResult);
  }
  private personPayload(req: PersonaRequest): any {
    return {
      nombres: req.nombres.trim(),
      apellidos: req.apellidos.trim(),
      tipo_documento: req.tipoDocumento || 'DNI',
      numero_documento: req.documentoIdentidad.trim(),
      fecha_nacimiento: req.fechaNacimiento || null,
      genero: req.genero || null,
      direccion: req.direccion || null,
      telefono: req.telefono || null,
      correo: req.correo || null,
      activo: req.activo ?? true,
    };
  }
  private toPerson(row: any): PersonaResponse {
    const teacher = embedded<any>(row.docentes);
    const student = embedded<any>(row.estudiantes);
    const parent = embedded<any>(row.padres_familia);
    const admin = embedded<any>(row.administrativos);
    const subtype = teacher ?? student ?? parent ?? admin;
    const type = teacher ? 'DOCENTE' : student ? 'ESTUDIANTE' : parent ? 'PADRE_FAMILIA' : admin ? 'ADMINISTRATIVO' : 'PERSONA';
    return {
      id: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      documentoIdentidad: row.numero_documento,
      tipoDocumento: row.tipo_documento,
      fechaNacimiento: row.fecha_nacimiento,
      genero: row.genero,
      direccion: row.direccion,
      telefono: row.telefono,
      correo: row.correo,
      activo: row.activo,
      tipoPersona: type,
      subtypeId: subtype?.id,
      codigo: subtype?.codigo,
      cargo: admin?.cargo,
      especialidad: teacher?.especialidad,
      areaAcademica: teacher?.area_academica,
      ocupacion: parent?.ocupacion,
      creadoEn: row.created_at,
      actualizadoEn: row.updated_at,
      nombreCompleto: `${row.apellidos}, ${row.nombres}`,
    } as PersonaResponse;
  }

  private async fetchAudits(filters: AuditFilters): Promise<AuditPageResponse> {
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    let countQuery: any = supabase.from('auditoria').select('*', { count: 'exact', head: true });
    let dataQuery: any = supabase.from('auditoria').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (filters.usuario) {
      countQuery = countQuery.ilike('usuario_responsable', `%${filters.usuario}%`);
      dataQuery = dataQuery.ilike('usuario_responsable', `%${filters.usuario}%`);
    }
    if (filters.accion) {
      countQuery = countQuery.eq('accion', filters.accion);
      dataQuery = dataQuery.eq('accion', filters.accion);
    }
    if (filters.entidad) {
      countQuery = countQuery.eq('entidad', filters.entidad);
      dataQuery = dataQuery.eq('entidad', filters.entidad);
    }
    if (filters.fechaInicio) {
      countQuery = countQuery.gte('created_at', filters.fechaInicio);
      dataQuery = dataQuery.gte('created_at', filters.fechaInicio);
    }
    if (filters.fechaFin) {
      countQuery = countQuery.lte('created_at', `${filters.fechaFin}T23:59:59`);
      dataQuery = dataQuery.lte('created_at', `${filters.fechaFin}T23:59:59`);
    }

    const countRes = await countQuery;
    if (countRes.error) throw new Error(countRes.error.details || countRes.error.message);
    const count = countRes.count;
    const rows = dataOf(await dataQuery as DbResult<any[]>);

    const data: AuditoriaResponse[] = rows.map((row: any) => ({
      id: row.id,
      creadoEn: row.created_at,
      accion: row.accion,
      entidad: row.entidad,
      entidadId: row.entidad_id,
      usuarioResponsable: row.usuario_responsable,
      detalle: typeof row.detalle === 'string' ? row.detalle : JSON.stringify(row.detalle)
    }));

    const total = count ?? 0;
    return {
      data,
      meta: { total, limit, offset, pages: Math.ceil(total / limit) }
    };
  }
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
  private toGrade = (row: any): Academico.GradoResponse => ({ id: row.id, nombre: row.nombre, paralelo: row.paralelo, capacidad: row.capacidad, activo: row.activo, nivelEducativoId: row.nivel_id, nivelEducativoNombre: embedded<any>(row.niveles)?.nombre ?? '', inscritos: row.inscritos || 0 });
  private gradePayload(req: Academico.GradoRequest): any { return { nivel_id: req.nivelEducativoId, nombre: req.nombre, paralelo: req.paralelo, capacidad: req.capacidad, activo: req.activo }; }
  private toSubject = (row: any): Academico.MateriaResponse => ({ id: row.id, codigo: row.codigo, nombre: row.nombre, area: row.area ?? '', activa: row.activa });
  private toCourse = (row: any): Academico.CursoResponse => { const grade = embedded<any>(row.grados); const level = embedded<any>(grade?.niveles); const subject = embedded<any>(row.materias); return { id: row.id, gradoId: row.grado_id, gradoNombre: grade?.nombre ?? '', paralelo: grade?.paralelo ?? '', nivelNombre: level?.nombre ?? '', nivelTurno: level?.turno ?? '', materiaId: row.materia_id, materiaCodigo: subject?.codigo ?? '', materiaNombre: subject?.nombre ?? '', area: subject?.area ?? '', activo: row.activo }; };
  private toInstitution(row: any): InstitutionConfig { return { nombre: row.nombre, ruc: row.ruc ?? '', telefono: row.telefono ?? '', direccion: row.direccion ?? '', correoInstitucional: row.correo_institucional ?? '', sitioWeb: row.sitio_web ?? '', logoUrl: row.logo_url ?? '' }; }
  private toGuardianLink(row: any): EstudianteApoderadoResponse { const parent = embedded<any>(row.padres_familia); const person = embedded<any>(parent?.personas); return { id: row.id, estudianteId: row.estudiante_id, padreFamiliaId: row.padre_familia_id, padreNombreCompleto: `${person?.apellidos ?? ''}, ${person?.nombres ?? ''}`, padreDocumento: person?.numero_documento ?? '', padreTelefono: person?.telefono ?? '', padreCorreo: person?.correo ?? '', parentesco: row.parentesco, principal: row.principal }; }
  private trimesterFrom(value: string): 'I_TRIMESTRE' | 'II_TRIMESTRE' | 'III_TRIMESTRE' { const normalized = value.toUpperCase(); if (normalized.includes('III') || normalized.includes('3')) return 'III_TRIMESTRE'; if (normalized.includes('II') || normalized.includes('2')) return 'II_TRIMESTRE'; return 'I_TRIMESTRE'; }
}
