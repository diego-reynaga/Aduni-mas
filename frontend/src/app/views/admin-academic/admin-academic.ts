import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AcademicLevel } from '../../core/models';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-admin-academic',
  templateUrl: './admin-academic.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAcademic {
  private readonly portal = inject(PortalService);
  readonly levels = signal<AcademicLevel[]>([]);
  readonly error = signal('');

  constructor() {
    this.portal.adminAcademicLevels().subscribe({
      next: (levels) => this.levels.set(levels),
      error: () => this.error.set('No se pudo cargar la estructura academica desde la base de datos.'),
    });
  }
}
