import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { dateRangeValidator } from '../../core/validators';
import { CommonModule } from '@angular/common';
import { AuditEntry, EntityId, InstitutionConfig } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import * as Academico from '../../core/academico.models';
import { fadeIn } from '../../core/animations';

type Tab = 'institucion';

@Component({
  selector: 'app-admin-institution',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './admin-institution.html',
  styleUrl: './admin-institution.css',
  animations: [fadeIn],
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

  readonly formConfig = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
    ruc: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(20)] }),
    telefono: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30), Validators.pattern(/^[0-9+\s()-]*$/)] }),
    direccion: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    correoInstitucional: new FormControl('', { nonNullable: true, validators: [Validators.email, Validators.maxLength(150)] }),
    sitioWeb: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(150), Validators.pattern(/^https?:\/\/.+/i)] }),
    logoUrl: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500), Validators.pattern(/^https?:\/\/.+/i)] }),
  });

  constructor() {
    this.loadConfig();
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
        this.error.set(err?.message || err?.error?.message || 'Error al guardar la configuración.');
      },
    });
  }

  resetConfig(): void {
    this.formConfig.reset(this.config());
    this.error.set('');
    this.successMessage.set('');
  }

}
