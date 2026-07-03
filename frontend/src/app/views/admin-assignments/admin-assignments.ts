import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PortalService } from '../../core/portal.service';
import * as Academico from '../../core/academico.models';
import { PersonaResponse } from '../../core/models';

@Component({
  selector: 'app-admin-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-assignments.html',
  styleUrl: './admin-assignments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAssignments {
  private readonly portal = inject(PortalService);

  readonly gestiones = signal<Academico.GestionAcademicaResponse[]>([]);
  readonly periodos = signal<Academico.PeriodoAcademicoResponse[]>([]);
  readonly docentes = signal<PersonaResponse[]>([]);
  readonly cursos = signal<Academico.CursoResponse[]>([]);
  readonly asignaciones = signal<Academico.AsignacionDocenteResponse[]>([]);
  readonly selectedGestionId = signal<number | null>(null);
  readonly editingGestionId = signal<number | null>(null);
  readonly editingPeriodoId = signal<number | null>(null);
  readonly editingAsignacionId = signal<number | null>(null);
  readonly error = signal('');
  readonly success = signal('');

  readonly gestionForm = new FormGroup({
    anio: new FormControl(new Date().getFullYear(), { nonNullable: true, validators: [Validators.required] }),
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaInicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaFin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    activa: new FormControl(true, { nonNullable: true }),
  });

  readonly periodoForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    orden: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(3)] }),
    fechaInicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaFin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cerrado: new FormControl(false, { nonNullable: true }),
  });

  readonly asignacionForm = new FormGroup({
    docenteId: new FormControl<number | null>(null, Validators.required),
    cursoId: new FormControl<number | null>(null, Validators.required),
    periodoAcademicoId: new FormControl<number | null>(null, Validators.required),
    estado: new FormControl<'ACTIVA' | 'CERRADA'>('ACTIVA', { nonNullable: true }),
  });

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    this.loadGestiones();
    this.portal.getPersonas().subscribe({
      next: rows => this.docentes.set(rows.filter(row => row.tipoPersona === 'DOCENTE')),
      error: () => this.error.set('No se pudo cargar el directorio de docentes.'),
    });
    this.portal.getAsignacionesDocentes().subscribe({
      next: rows => this.asignaciones.set(rows),
      error: () => this.error.set('No se pudieron cargar las asignaciones docentes.'),
    });
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
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.selectedGestionId.set(id);
    this.periodos.set([]);
    if (id) this.loadPeriodos(id);
  }

  loadPeriodos(gestionId: number): void {
    this.portal.getPeriodos(gestionId).subscribe({
      next: rows => this.periodos.set(rows),
      error: () => this.error.set('No se pudieron cargar los periodos.'),
    });
  }

  saveGestion(): void {
    if (this.gestionForm.invalid) return;
    const id = this.editingGestionId();
    const action = id
      ? this.portal.updateGestion(id, this.gestionForm.getRawValue())
      : this.portal.createGestion(this.gestionForm.getRawValue());
    action.subscribe({
      next: () => { this.success.set(id ? 'Gestión actualizada.' : 'Gestión creada.'); this.cancelGestion(); this.loadGestiones(); },
      error: err => this.error.set(err?.error?.message ?? 'No se pudo guardar la gestión.'),
    });
  }

  editGestion(row: Academico.GestionAcademicaResponse): void {
    this.editingGestionId.set(row.id);
    this.gestionForm.setValue({ anio: row.anio, nombre: row.nombre, fechaInicio: row.fechaInicio, fechaFin: row.fechaFin, activa: row.activa });
  }

  cancelGestion(): void {
    this.editingGestionId.set(null);
    this.gestionForm.reset({ anio: new Date().getFullYear(), nombre: '', fechaInicio: '', fechaFin: '', activa: true });
  }

  closeGestion(row: Academico.GestionAcademicaResponse): void {
    if (!confirm(`¿Desactivar la gestión ${row.nombre}?`)) return;
    this.portal.deleteGestion(row.id).subscribe({ next: () => this.loadGestiones(), error: err => this.showError(err) });
  }

  savePeriodo(): void {
    const gestionId = this.selectedGestionId();
    if (!gestionId || this.periodoForm.invalid) return;
    const request: Academico.PeriodoAcademicoRequest = { ...this.periodoForm.getRawValue(), gestionAcademicaId: gestionId };
    const id = this.editingPeriodoId();
    const action = id ? this.portal.updatePeriodo(id, request) : this.portal.createPeriodo(request);
    action.subscribe({
      next: () => { this.success.set(id ? 'Periodo actualizado.' : 'Periodo creado.'); this.cancelPeriodo(); this.loadPeriodos(gestionId); },
      error: err => this.showError(err),
    });
  }

  editPeriodo(row: Academico.PeriodoAcademicoResponse): void {
    this.editingPeriodoId.set(row.id);
    this.periodoForm.setValue({ nombre: row.nombre, orden: row.orden, fechaInicio: row.fechaInicio, fechaFin: row.fechaFin, cerrado: row.cerrado });
  }

  cancelPeriodo(): void {
    this.editingPeriodoId.set(null);
    this.periodoForm.reset({ nombre: '', orden: 1, fechaInicio: '', fechaFin: '', cerrado: false });
  }

  closePeriodo(row: Academico.PeriodoAcademicoResponse): void {
    if (!confirm(`¿Cerrar el periodo ${row.nombre}?`)) return;
    this.portal.deletePeriodo(row.id).subscribe({ next: () => this.loadPeriodos(row.gestionAcademicaId), error: err => this.showError(err) });
  }

  saveAsignacion(): void {
    if (this.asignacionForm.invalid) return;
    const request = this.asignacionForm.getRawValue() as Academico.AsignacionDocenteRequest;
    const id = this.editingAsignacionId();
    const action = id ? this.portal.updateAsignacionDocente(id, request) : this.portal.createAsignacionDocente(request);
    action.subscribe({
      next: () => { this.success.set(id ? 'Asignación actualizada.' : 'Docente asignado correctamente.'); this.cancelAsignacion(); this.loadAll(); },
      error: err => this.showError(err),
    });
  }

  editAsignacion(row: Academico.AsignacionDocenteResponse): void {
    this.editingAsignacionId.set(row.id);
    this.asignacionForm.setValue({ docenteId: row.docenteId, cursoId: row.cursoId, periodoAcademicoId: row.periodoAcademicoId, estado: row.estado });
  }

  cancelAsignacion(): void {
    this.editingAsignacionId.set(null);
    this.asignacionForm.reset({ docenteId: null, cursoId: null, periodoAcademicoId: null, estado: 'ACTIVA' });
  }

  closeAsignacion(row: Academico.AsignacionDocenteResponse): void {
    if (!confirm(`¿Cerrar la asignación de ${row.docenteNombre}?`)) return;
    this.portal.closeAsignacionDocente(row.id).subscribe({ next: () => this.loadAll(), error: err => this.showError(err) });
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
    this.error.set(err?.error?.message ?? (typeof err?.error === 'string' ? err.error : 'La operación no pudo completarse.'));
  }
}
