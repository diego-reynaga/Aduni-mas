import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PortalService } from '../../core/portal.service';
import * as Academico from '../../core/academico.models';
import { EntityId } from '../../core/models';
import { fadeIn, expandCollapse, scaleInModal } from '../../core/animations';
import { dateRangeValidator } from '../../core/validators';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { forkJoin } from 'rxjs';

function periodoWithinGestionValidator(gestiones: () => Academico.GestionAcademicaResponse[], selectedGestionId: () => EntityId | null): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('fechaInicio')?.value;
    const end = group.get('fechaFin')?.value;
    const gId = selectedGestionId();
    if (!start || !end || !gId) return null;
    
    const gestion = gestiones().find(g => g.id === gId);
    if (!gestion) return null;
    
    if (new Date(start) < new Date(gestion.fechaInicio) || new Date(end) > new Date(gestion.fechaFin)) {
      return { outOfBounds: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-admin-periods',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-periods.html',
  styleUrl: './admin-periods.css',
  animations: [fadeIn, expandCollapse, scaleInModal],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPeriods {
  private readonly portal = inject(PortalService);

  readonly gestiones = signal<Academico.GestionAcademicaResponse[]>([]);
  readonly periodosPorGestion = signal<Map<EntityId, Academico.PeriodoAcademicoResponse[]>>(new Map());
  readonly expandedGestiones = signal<Set<EntityId>>(new Set());
  
  readonly selectedGestionId = signal<EntityId | null>(null);
  
  readonly isAddingGestion = signal(false);
  readonly isAddingPeriodo = signal(false);
  readonly editingGestionId = signal<EntityId | null>(null);
  readonly editingPeriodoId = signal<EntityId | null>(null);
  readonly error = signal('');
  readonly success = signal('');
  
  // Clonación
  readonly isCloning = signal(false);
  readonly cloneForm = new FormGroup({
    origenId: new FormControl<EntityId | null>(null, Validators.required),
    copyNiveles: new FormControl(true, { nonNullable: true }),
    copyPeriodos: new FormControl(true, { nonNullable: true }),
  });

  readonly gestionForm = new FormGroup({
    anio: new FormControl(new Date().getFullYear(), { nonNullable: true, validators: [Validators.required] }),
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaInicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaFin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    activa: new FormControl(true, { nonNullable: true }),
  }, { validators: dateRangeValidator });

  readonly periodoForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    orden: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(3)] }),
    fechaInicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaFin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cerrado: new FormControl(false, { nonNullable: true }),
  }, { validators: [dateRangeValidator, periodoWithinGestionValidator(() => this.gestiones(), () => this.selectedGestionId())] });

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    this.loadGestiones();
  }

  loadGestiones(): void {
    this.portal.getGestiones().subscribe({
      next: rows => {
        const sortedRows = [...rows].sort((a, b) => a.anio - b.anio);
        this.gestiones.set(sortedRows);
        const newestActive = [...sortedRows].filter(row => row.activa).sort((a, b) => b.anio - a.anio)[0];
        const current = newestActive?.id ?? sortedRows[sortedRows.length - 1]?.id ?? null;
        if (current && !this.expandedGestiones().has(current)) {
          this.toggleGestionExpansion(current);
        }
      },
      error: () => this.error.set('No se pudieron cargar las gestiones académicas.'),
    });
  }

  toggleGestionExpansion(id: EntityId): void {
    const current = new Set(this.expandedGestiones());
    if (current.has(id)) {
      current.delete(id);
      this.expandedGestiones.set(current);
    } else {
      current.add(id);
      this.expandedGestiones.set(current);
      if (!this.periodosPorGestion().has(id)) {
        this.loadPeriodos(id);
      }
    }
  }

  loadPeriodos(gestionId: EntityId): void {
    this.portal.getPeriodos(gestionId).subscribe({
      next: rows => {
        const sortedPeriodos = [...rows].sort((a, b) => a.orden - b.orden);
        const map = new Map(this.periodosPorGestion());
        map.set(gestionId, sortedPeriodos);
        this.periodosPorGestion.set(map);
      },
      error: () => this.error.set('No se pudieron cargar los periodos.'),
    });
  }

  openAddGestion(): void {
    this.editingGestionId.set(null);
    this.gestionForm.reset({ anio: new Date().getFullYear(), nombre: '', fechaInicio: '', fechaFin: '', activa: true });
    this.isAddingGestion.set(true);
  }

  openEditGestion(row: Academico.GestionAcademicaResponse): void {
    this.editingGestionId.set(row.id);
    this.gestionForm.setValue({ anio: row.anio, nombre: row.nombre, fechaInicio: row.fechaInicio, fechaFin: row.fechaFin, activa: row.activa });
  }

  closeGestionModal(): void {
    this.editingGestionId.set(null);
    this.isAddingGestion.set(false);
  }

  saveGestion(): void {
    if (this.gestionForm.invalid) return;
    const id = this.editingGestionId();
    const data = this.gestionForm.getRawValue();
    
    // Auto-desactivar otras si es activa
    if (data.activa) {
        this.gestiones().forEach(g => {
          if (g.id !== id) this.portal.patchGestion(g.id, { activa: false }).subscribe();
        });
    }

    const action = id
      ? this.portal.updateGestion(id, data)
      : this.portal.createGestion(data);
    action.subscribe({
      next: () => { 
        this.showSuccess(id ? 'Gestión actualizada.' : 'Gestión creada.'); 
        this.closeGestionModal(); 
        this.loadGestiones(); 
        window.dispatchEvent(new CustomEvent('gestionChanged'));
      },
      error: err => this.showError(err),
    });
  }

  activarGestion(row: Academico.GestionAcademicaResponse): void {
    if (!confirm(`¿Activar la gestión ${row.nombre}? Esto desactivará cualquier otra gestión activa.`)) return;
    
    // Primero, desactivar todas las demás gestiones
    this.gestiones().forEach(g => {
      if (g.id !== row.id && g.activa) {
        this.portal.patchGestion(g.id, { activa: false }).subscribe();
      }
    });

    // Luego activar esta
    this.portal.patchGestion(row.id, { activa: true }).subscribe({
      next: () => {
        this.loadGestiones();
        this.showSuccess('Gestión activada.');
        window.dispatchEvent(new CustomEvent('gestionChanged'));
      },
      error: err => this.showError(err)
    });
  }

  closeGestion(row: Academico.GestionAcademicaResponse): void {
    if (!confirm(`¿Desactivar la gestión ${row.nombre}?`)) return;
    this.portal.patchGestion(row.id, { activa: false }).subscribe({
      next: () => {
        this.loadGestiones();
        this.showSuccess('Gestión desactivada.');
        window.dispatchEvent(new CustomEvent('gestionChanged'));
      },
      error: err => this.showError(err)
    });
  }

  openAddPeriodo(gestionId: EntityId): void {
    this.selectedGestionId.set(gestionId);
    this.editingPeriodoId.set(null);
    const existing = this.periodosPorGestion().get(gestionId) || [];
    const nextOrder = existing.length + 1;
    this.periodoForm.reset({ nombre: '', orden: nextOrder <= 3 ? nextOrder : 1, fechaInicio: '', fechaFin: '', cerrado: false });
    this.isAddingPeriodo.set(true);
  }

  openEditPeriodo(gestionId: EntityId, row: Academico.PeriodoAcademicoResponse): void {
    this.selectedGestionId.set(gestionId);
    this.editingPeriodoId.set(row.id);
    this.periodoForm.setValue({ nombre: row.nombre, orden: row.orden, fechaInicio: row.fechaInicio, fechaFin: row.fechaFin, cerrado: row.cerrado });
  }

  closePeriodoModal(): void {
    this.editingPeriodoId.set(null);
    this.isAddingPeriodo.set(false);
    this.selectedGestionId.set(null);
  }

  savePeriodo(): void {
    const gestionId = this.selectedGestionId();
    if (!gestionId || this.periodoForm.invalid) return;
    const request: Academico.PeriodoAcademicoRequest = { ...this.periodoForm.getRawValue(), gestionAcademicaId: gestionId };
    const id = this.editingPeriodoId();
    const action = id ? this.portal.updatePeriodo(id, request) : this.portal.createPeriodo(request);
    action.subscribe({
      next: () => { 
        this.showSuccess(id ? 'Periodo actualizado.' : 'Periodo creado.'); 
        this.closePeriodoModal(); 
        this.loadPeriodos(gestionId); 
        window.dispatchEvent(new CustomEvent('gestionChanged'));
      },
      error: err => this.showError(err),
    });
  }

  closePeriodo(row: Academico.PeriodoAcademicoResponse): void {
    if (!confirm(`¿Cerrar el periodo ${row.nombre}?`)) return;
    this.portal.patchPeriodo(row.id, { cerrado: true }).subscribe({
      next: () => {
        if (this.selectedGestionId()) this.loadPeriodos(this.selectedGestionId()!);
        this.showSuccess('Periodo cerrado.');
        window.dispatchEvent(new CustomEvent('gestionChanged'));
      },
      error: err => this.showError(err)
    });
  }

  movePeriodoUp(gestionId: EntityId, index: number): void {
    if (index === 0) return;
    const periodos = this.periodosPorGestion().get(gestionId);
    if (!periodos) return;
    const current = periodos[index];
    const prev = periodos[index - 1];
    this.swapPeriodos(gestionId, current, prev);
  }

  movePeriodoDown(gestionId: EntityId, index: number): void {
    const periodos = this.periodosPorGestion().get(gestionId);
    if (!periodos || index === periodos.length - 1) return;
    const current = periodos[index];
    const next = periodos[index + 1];
    this.swapPeriodos(gestionId, current, next);
  }

  private swapPeriodos(gestionId: EntityId, a: Academico.PeriodoAcademicoResponse, b: Academico.PeriodoAcademicoResponse) {
    const orderA = a.orden;
    const orderB = b.orden;
    forkJoin([
      this.portal.patchPeriodo(a.id, { orden: orderB }),
      this.portal.patchPeriodo(b.id, { orden: orderA })
    ]).subscribe({
      next: () => this.loadPeriodos(gestionId),
      error: err => this.showError(err)
    });
  }

  openClonarModal(gestionId: EntityId): void {
    this.selectedGestionId.set(gestionId);
    this.isCloning.set(true);
    this.cloneForm.reset({ origenId: null, copyNiveles: true, copyPeriodos: true });
  }

  closeClonarModal(): void {
    this.isCloning.set(false);
  }

  executeClone(): void {
    const gestionId = this.selectedGestionId();
    if (this.cloneForm.invalid || !gestionId) return;
    
    const request = this.cloneForm.getRawValue();
    if (!request.origenId) return;

    this.portal.cloneGestionStructure(request.origenId, gestionId, {
      niveles: request.copyNiveles,
      periodos: request.copyPeriodos
    }).subscribe({
      next: (res) => {
        this.showSuccess(res.message);
        this.closeClonarModal();
        this.loadPeriodos(gestionId);
      },
      error: err => this.showError(err)
    });
  }

  private showError(err: any): void {
    this.error.set(err?.message || err?.error?.message || (typeof err?.error === 'string' ? err.error : 'La operación no pudo completarse.'));
    setTimeout(() => this.error.set(''), 5000);
  }

  private showSuccess(msg: string): void {
    this.success.set(msg);
    setTimeout(() => this.success.set(''), 5000);
  }
}
