import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuditEntry, InstitutionConfig } from '../../core/models';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-admin-institution',
  templateUrl: './admin-institution.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminInstitution {
  private readonly portal = inject(PortalService);

  readonly config = signal<InstitutionConfig>({
    nombre: '',
    ruc: '',
    telefono: '',
    direccion: '',
    correoInstitucional: '',
    sitioWeb: '',
    logoUrl: '',
  });
  readonly audits = signal<AuditEntry[]>([]);
  readonly error = signal('');

  constructor() {
    this.portal.adminInstitution().subscribe({
      next: (payload) => {
        this.config.set(payload.config);
        this.audits.set(payload.audits);
      },
      error: () => this.error.set('No se pudo cargar la configuracion institucional.'),
    });
  }
}
