import { ChangeDetectionStrategy, Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { dateRangeValidator } from '../../core/validators';
import { CommonModule } from '@angular/common';
import { AuditEntry, InstitutionConfig } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import * as Academico from '../../core/academico.models';

type Tab = 'institucion' | 'gestiones' | 'periodos';

@Component({
  selector: 'app-admin-institution',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './admin-institution.html',
  styleUrl: './admin-institution.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminInstitution {
  private readonly portal = inject(PortalService);

  readonly activeTab = signal<Tab>('institucion');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

  // --- INSTITUCION ---
  private readonly emptyConfig: InstitutionConfig = {
    nombre: '', ruc: '', telefono: '', direccion: '', correoInstitucional: '', sitioWeb: '', logoUrl: '',
  };
  readonly config = signal<InstitutionConfig>({ ...this.emptyConfig });
  readonly audits = signal<AuditEntry[]>([]);
  readonly savingConfig = signal(false);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  readonly uploadingLogo = signal(false);

  readonly formConfig = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
    ruc: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(20)] }),
    telefono: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30), Validators.pattern(/^[0-9+\s()-]*$/)] }),
    direccion: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    correoInstitucional: new FormControl('', { nonNullable: true, validators: [Validators.email, Validators.maxLength(150)] }),
    sitioWeb: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(150), Validators.pattern(/^https?:\/\/.+/i)] }),
    logoUrl: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(250)] }),
  });

  // --- GESTIONES ACADEMICAS ---
  readonly gestiones = signal<Academico.GestionAcademicaResponse[]>([]);
  readonly isAddingGestion = signal(false);
  readonly editingGestion = signal<Academico.GestionAcademicaResponse | null>(null);

  readonly formGestion = new FormGroup({
    anio: new FormControl<number | null>(null, [Validators.required, Validators.min(2000)]),
    nombre: new FormControl('', [Validators.required]),
    fechaInicio: new FormControl('', [Validators.required]),
    fechaFin: new FormControl('', [Validators.required]),
    activa: new FormControl(false),
  }, { validators: dateRangeValidator });

  // --- PERIODOS ACADEMICOS ---
  readonly selectedGestionId = signal<number | null>(null);
  readonly periodos = signal<Academico.PeriodoAcademicoResponse[]>([]);
  readonly isAddingPeriodo = signal(false);
  readonly editingPeriodo = signal<Academico.PeriodoAcademicoResponse | null>(null);

  readonly formPeriodo = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    orden: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    fechaInicio: new FormControl('', [Validators.required]),
    fechaFin: new FormControl('', [Validators.required]),
    cerrado: new FormControl(false),
  }, { validators: dateRangeValidator });

  // Modal confirmación cierre
  readonly showCloseConfirmModal = signal(false);
  readonly pendingPeriodoData = signal<any>(null);

  constructor() {
    this.loadConfig();
    this.loadGestiones();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.error.set('');
    this.successMessage.set('');
  }

  // --- LOGIC: INSTITUCION ---
  private loadConfig(): void {
    this.loading.set(true);
    this.portal.adminInstitution().subscribe({
      next: (payload) => {
        this.loading.set(false);
        this.config.set({ ...payload.config });
        this.audits.set(payload.audits || []);
        this.formConfig.reset(payload.config);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar la configuracion institucional.');
      },
    });
  }

  saveConfig(): void {
    this.error.set('');
    this.successMessage.set('');
    if (this.formConfig.invalid) {
      this.formConfig.markAllAsTouched();
      this.error.set('Revise los campos marcados antes de guardar.');
      return;
    }

    this.savingConfig.set(true);
    this.portal.saveAdminInstitution(this.formConfig.getRawValue()).subscribe({
      next: (payload) => {
        this.savingConfig.set(false);
        this.config.set({ ...payload.config });
        this.audits.set(payload.audits || []);
        this.formConfig.reset(payload.config);
        this.successMessage.set('La configuracion institucional se guardo correctamente.');
      },
      error: (err) => {
        this.savingConfig.set(false);
        this.error.set(err?.error?.message ?? 'Error al guardar la configuracion.');
      },
    });
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadingLogo.set(true);
      this.portal.uploadLogo(file).subscribe({
        next: (res) => {
          this.uploadingLogo.set(false);
          this.formConfig.patchValue({ logoUrl: res.logoUrl });
          this.formConfig.markAsDirty();
          this.saveConfig();
        },
        error: (err) => {
          this.uploadingLogo.set(false);
          this.error.set(err?.error?.message ?? 'Error al subir el logo.');
        }
      });
    }
  }

  resetConfig(): void {
    this.formConfig.reset(this.config());
    this.error.set('');
    this.successMessage.set('');
  }

  // --- LOGIC: GESTIONES ACADEMICAS ---
  private loadGestiones(): void {
    this.portal.getGestiones().subscribe({
      next: (res) => this.gestiones.set(res),
      error: () => this.error.set('Error al cargar gestiones académicas')
    });
  }

  openAddGestion(): void {
    this.isAddingGestion.set(true);
    this.editingGestion.set(null);
    this.formGestion.reset({ activa: false });
  }

  openEditGestion(gestion: Academico.GestionAcademicaResponse): void {
    this.isAddingGestion.set(true);
    this.editingGestion.set(gestion);
    this.formGestion.reset({
      anio: gestion.anio,
      nombre: gestion.nombre,
      fechaInicio: gestion.fechaInicio,
      fechaFin: gestion.fechaFin,
      activa: gestion.activa
    });
  }

  cancelAddGestion(): void {
    this.isAddingGestion.set(false);
    this.editingGestion.set(null);
  }

  saveGestion(): void {
    if (this.formGestion.invalid) {
      this.formGestion.markAllAsTouched();
      return;
    }
    
    const req: Academico.GestionAcademicaRequest = {
      anio: this.formGestion.value.anio!,
      nombre: this.formGestion.value.nombre!,
      fechaInicio: this.formGestion.value.fechaInicio!,
      fechaFin: this.formGestion.value.fechaFin!,
      activa: this.formGestion.value.activa ?? false
    };

    const edit = this.editingGestion();
    const obs = edit ? this.portal.updateGestion(edit.id, req) : this.portal.createGestion(req);

    obs.subscribe({
      next: () => {
        this.loadGestiones();
        this.cancelAddGestion();
        this.successMessage.set(edit ? 'Gestión actualizada.' : 'Gestión creada.');
      },
      error: (err) => this.error.set(err?.error?.message ?? 'Error al guardar gestión')
    });
  }

  // --- LOGIC: PERIODOS ACADEMICOS ---
  onGestionSelectedForPeriodos(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const gId = select.value ? Number(select.value) : null;
    this.selectedGestionId.set(gId);
    if (gId) {
      this.loadPeriodos(gId);
    } else {
      this.periodos.set([]);
    }
  }

  private loadPeriodos(gestionId: number): void {
    this.portal.getPeriodos(gestionId).subscribe({
      next: (res) => this.periodos.set(res),
      error: () => this.error.set('Error al cargar periodos')
    });
  }

  openAddPeriodo(): void {
    if (!this.selectedGestionId()) return;
    this.isAddingPeriodo.set(true);
    this.editingPeriodo.set(null);
    this.formPeriodo.reset({ cerrado: false });
  }

  openEditPeriodo(periodo: Academico.PeriodoAcademicoResponse): void {
    this.isAddingPeriodo.set(true);
    this.editingPeriodo.set(periodo);
    this.formPeriodo.reset({
      nombre: periodo.nombre,
      orden: periodo.orden,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      cerrado: periodo.cerrado
    });
  }

  cancelAddPeriodo(): void {
    this.isAddingPeriodo.set(false);
    this.editingPeriodo.set(null);
  }

  savePeriodo(): void {
    const gId = this.selectedGestionId();
    if (this.formPeriodo.invalid || !gId) {
      this.formPeriodo.markAllAsTouched();
      return;
    }

    const edit = this.editingPeriodo();
    
    const req: Academico.PeriodoAcademicoRequest = {
      nombre: this.formPeriodo.value.nombre!,
      orden: this.formPeriodo.value.orden!,
      fechaInicio: this.formPeriodo.value.fechaInicio!,
      fechaFin: this.formPeriodo.value.fechaFin!,
      cerrado: this.formPeriodo.value.cerrado ?? false,
      gestionAcademicaId: gId
    };

    if (this.formPeriodo.value.cerrado && (!edit || !edit.cerrado)) {
      this.pendingPeriodoData.set({ edit, req, gId });
      this.showCloseConfirmModal.set(true);
      return;
    }

    this.executeSavePeriodo(edit, req, gId);
  }

  cancelClosePeriodo(): void {
    this.showCloseConfirmModal.set(false);
    this.pendingPeriodoData.set(null);
  }

  confirmClosePeriodo(): void {
    const data = this.pendingPeriodoData();
    if (!data) return;
    this.showCloseConfirmModal.set(false);
    this.pendingPeriodoData.set(null);
    this.executeSavePeriodo(data.edit, data.req, data.gId);
  }

  private executeSavePeriodo(edit: any, req: Academico.PeriodoAcademicoRequest, gId: number): void {
    const obs = edit ? this.portal.updatePeriodo(edit.id, req) : this.portal.createPeriodo(req);

    obs.subscribe({
      next: () => {
        this.loadPeriodos(gId);
        this.cancelAddPeriodo();
        this.successMessage.set(edit ? 'Periodo actualizado.' : 'Periodo creado.');
      },
      error: (err) => this.error.set(err?.error?.message ?? 'Error al guardar periodo')
    });
  }
}
