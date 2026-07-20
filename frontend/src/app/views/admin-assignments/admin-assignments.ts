import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PortalService } from '../../core/portal.service';
import * as Academico from '../../core/academico.models';
import { EntityId, PersonaResponse } from '../../core/models';
import { fadeIn, slideInRight, staggerList } from '../../core/animations';
import { Observable, switchMap, of } from 'rxjs';
import { ConfirmationService } from '../../core/confirmation.service';

export interface AulaGroup {
  nombreAula: string;
  materias: Academico.CursoResponse[];
}

export interface LevelGroup {
  nivelNombre: string;
  nivelTurno: string;
  aulas: AulaGroup[];
}

@Component({
  selector: 'app-admin-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-assignments.html',
  styleUrl: './admin-assignments.css',
  animations: [fadeIn, slideInRight, staggerList],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAssignments {
  private readonly portal = inject(PortalService);
  private readonly confirmation = inject(ConfirmationService);

  readonly gestiones = signal<Academico.GestionAcademicaResponse[]>([]);
  readonly periodos = signal<Academico.PeriodoAcademicoResponse[]>([]);
  readonly docentes = signal<PersonaResponse[]>([]);
  readonly cursos = signal<Academico.CursoResponse[]>([]);
  readonly asignaciones = signal<Academico.AsignacionDocenteResponse[]>([]);
  
  readonly selectedGestionId = signal<EntityId | null>(null);
  readonly selectedPeriodoId = signal<EntityId | null>(null);
  
  readonly error = signal('');
  readonly success = signal('');

  // Drawer state
  readonly isDrawerOpen = signal(false);
  readonly selectedCursoForDrawer = signal<Academico.CursoResponse | null>(null);

  // Grouping Aulas by Nivel
  readonly niveles = computed<LevelGroup[]>(() => {
    const list = this.cursos();
    const mapNivel = new Map<string, Academico.CursoResponse[]>();
    
    for (const curso of list) {
      if (!curso.activo) continue;
      const nivel = curso.nivelNombre || 'Sin Nivel';
      const turno = curso.nivelTurno || 'MAÑANA';
      const group = mapNivel.get(`${nivel}|${turno}`) || [];
      group.push(curso);
      mapNivel.set(`${nivel}|${turno}`, group);
    }

    return Array.from(mapNivel.entries()).map(([key, cursosDelNivel]) => {
      const [nivelNombre, nivelTurno] = key.split('|');
      const mapAula = new Map<string, Academico.CursoResponse[]>();
      for (const curso of cursosDelNivel) {
        const aula = `${curso.gradoNombre} ${curso.paralelo}`;
        const group = mapAula.get(aula) || [];
        group.push(curso);
        mapAula.set(aula, group);
      }
      const aulas = Array.from(mapAula.entries()).map(([nombreAula, materias]) => ({
        nombreAula,
        materias: materias.sort((a, b) => a.materiaNombre.localeCompare(b.materiaNombre))
      })).sort((a, b) => a.nombreAula.localeCompare(b.nombreAula));

      return { nivelNombre, nivelTurno, aulas };
    }).sort((a, b) => a.nivelNombre.localeCompare(b.nivelNombre));
  });

  // Map of cursoId -> asignacion for quick lookup in UI
  readonly asignacionesActivas = computed(() => {
    const list = this.asignaciones();
    const periodoId = this.selectedPeriodoId();
    const map = new Map<EntityId, Academico.AsignacionDocenteResponse>();
    for (const a of list) {
      if (a.estado === 'ACTIVA' && a.periodoAcademicoId === periodoId) {
        map.set(a.cursoId, a);
      }
    }
    return map;
  });

  // Teacher Load Count
  readonly teacherLoad = computed(() => {
    const list = this.asignaciones();
    const periodoId = this.selectedPeriodoId();
    const counts = new Map<EntityId, number>();
    for (const a of list) {
      if (a.estado === 'ACTIVA' && a.periodoAcademicoId === periodoId) {
        counts.set(a.docenteId, (counts.get(a.docenteId) || 0) + 1);
      }
    }
    return counts;
  });

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    this.loadGestiones();
    this.portal.getPersonas().subscribe({
      next: rows => this.docentes.set(rows.filter(
        (row) => row.tipoPersona === 'DOCENTE' && Boolean(row.subtypeId),
      )),
      error: () => this.error.set('No se pudo cargar el directorio de docentes.'),
    });
    this.loadAsignaciones();
    this.loadCursos();
  }

  loadGestiones(): void {
    this.portal.getGestiones().subscribe({
      next: rows => {
        this.gestiones.set(rows);
        const newestActive = [...rows].filter(row => row.activa).sort((a, b) => b.anio - a.anio)[0];
        const current = this.selectedGestionId() ?? newestActive?.id ?? rows[0]?.id ?? null;
        this.selectedGestionId.set(current);
        if (current) this.loadPeriodos(current);
      },
      error: () => this.error.set('No se pudieron cargar las gestiones académicas.'),
    });
  }

  selectGestion(event: Event): void {
    const id = (event.target as HTMLSelectElement).value || null;
    this.selectedGestionId.set(id);
    this.periodos.set([]);
    this.selectedPeriodoId.set(null);
    if (id) this.loadPeriodos(id);
  }

  loadPeriodos(gestionId: EntityId): void {
    this.portal.getPeriodos(gestionId).subscribe({
      next: rows => {
        this.periodos.set(rows);
        const currentPeriodo = rows.some((row) => row.id === this.selectedPeriodoId())
          ? this.selectedPeriodoId()
          : rows[0]?.id ?? null;
        this.selectedPeriodoId.set(currentPeriodo);
      },
      error: () => this.error.set('No se pudieron cargar los periodos.'),
    });
  }

  selectPeriodo(event: Event): void {
    const id = (event.target as HTMLSelectElement).value || null;
    this.selectedPeriodoId.set(id);
  }

  loadAsignaciones(): void {
    this.portal.getAsignacionesDocentes().subscribe({
      next: rows => this.asignaciones.set(rows),
      error: () => this.error.set('No se pudieron cargar las asignaciones docentes.'),
    });
  }

  openDrawer(curso: Academico.CursoResponse): void {
    if (!this.selectedPeriodoId()) {
      this.showError('Debe seleccionar un periodo académico primero.');
      return;
    }
    this.selectedCursoForDrawer.set(curso);
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.selectedCursoForDrawer.set(null);
  }

  assignTeacher(docente: PersonaResponse): void {
    const curso = this.selectedCursoForDrawer();
    const periodoId = this.selectedPeriodoId();
    if (!curso || !periodoId) return;

    const request: Academico.AsignacionDocenteRequest = {
      docenteId: docente.subtypeId!,
      cursoId: curso.id,
      periodoAcademicoId: periodoId,
      estado: 'ACTIVA'
    };

    const existing = this.asignacionesActivas().get(curso.id);
    
    let action: Observable<any>;

    if (existing && existing.docenteId !== docente.subtypeId) {
      // Si existia otro profesor activo para esta materia, lo cerramos y luego insertamos el nuevo (usando upsert)
      action = this.portal.closeAsignacionDocente(existing.id).pipe(
        switchMap(() => this.portal.createAsignacionDocente(request))
      );
    } else {
      // Si no existía o es el mismo, solo hacemos el upsert (createAsignacionDocente ahora usa upsert)
      action = this.portal.createAsignacionDocente(request);
    }

    action.subscribe({
      next: () => {
        this.success.set('Profesor asignado correctamente.');
        setTimeout(() => this.success.set(''), 3000);
        this.closeDrawer();
        this.loadAsignaciones(); // Refrescar asignaciones para actualizar UI
      },
      error: err => this.showError(err),
    });
  }

  async removeAsignacion(curso: Academico.CursoResponse, event: Event): Promise<void> {
    event.stopPropagation();
    const existing = this.asignacionesActivas().get(curso.id);
    if (!existing) return;
    
    if (!await this.confirmation.confirm({ title: 'Eliminar asignación', message: `Se retirará la asignación de ${existing.docenteNombre}.`, confirmLabel: 'Eliminar', tone: 'danger' })) return;
    this.portal.closeAsignacionDocente(existing.id).subscribe({
      next: () => {
        this.success.set('Asignación eliminada.');
        setTimeout(() => this.success.set(''), 3000);
        this.loadAsignaciones();
      },
      error: err => this.showError(err)
    });
  }

  private loadCursos(): void {
    this.cursos.set([]);
    this.portal.getNiveles().subscribe({
      next: levels => levels.forEach(level => this.portal.getGrados(level.id).subscribe({
        next: grades => grades.forEach(grade => this.portal.getCursos(grade.id).subscribe({
          next: courses => this.cursos.update(current => {
            const map = new Map([...current, ...courses].map(course => [course.id, course]));
            return [...map.values()];
          }),
        })),
      })),
      error: () => this.error.set('No se pudo cargar la oferta de cursos.'),
    });
  }

  private showError(err: any): void {
    this.error.set(err?.message || err?.error?.message || (typeof err?.error === 'string' ? err.error : 'La operación no pudo completarse.'));
    setTimeout(() => this.error.set(''), 5000);
  }
}
