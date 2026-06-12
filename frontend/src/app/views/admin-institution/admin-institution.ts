import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuditEntry, InstitutionConfig } from '../../core/models';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-admin-institution',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-institution.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminInstitution {
  private readonly portal = inject(PortalService);

  private readonly emptyConfig: InstitutionConfig = {
    nombre: '',
    ruc: '',
    telefono: '',
    direccion: '',
    correoInstitucional: '',
    sitioWeb: '',
    logoUrl: '',
  };

  readonly config = signal<InstitutionConfig>({ ...this.emptyConfig });
  readonly audits = signal<AuditEntry[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly form = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    ruc: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(30), Validators.pattern(/^[0-9+\s()-]*$/)],
    }),
    direccion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    }),
    correoInstitucional: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(150)],
    }),
    sitioWeb: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(150), Validators.pattern(/^https?:\/\/.+/i)],
    }),
    logoUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(250), Validators.pattern(/^https?:\/\/.+/i)],
    }),
  });

  constructor() {
    this.load();
  }

  save(): void {
    this.error.set('');
    this.message.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revise los campos marcados antes de guardar.');
      return;
    }

    this.saving.set(true);
    this.portal.saveAdminInstitution(this.form.getRawValue()).subscribe({
      next: (payload) => {
        this.saving.set(false);
        this.applyPayload(payload);
        this.message.set('La configuracion institucional se guardo correctamente.');
      },
      error: (error) => {
        this.saving.set(false);
        this.error.set(error?.error?.message ?? 'No se pudo guardar la configuracion institucional.');
      },
    });
  }

  reset(): void {
    this.form.reset(this.config());
    this.error.set('');
    this.message.set('');
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');

    this.portal.adminInstitution().subscribe({
      next: (payload) => {
        this.loading.set(false);
        this.applyPayload(payload);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar la configuracion institucional.');
      },
    });
  }

  private applyPayload(payload: { config: InstitutionConfig; audits: AuditEntry[] }): void {
    this.config.set({ ...payload.config });
    this.audits.set(payload.audits);
    this.form.reset(payload.config);
  }
}
