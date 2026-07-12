import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EstudianteApoderadoResponse } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, staggerRows } from '../../core/animations';

@Component({
  selector: 'app-student-guardians',
  templateUrl: './student-guardians.html',
  animations: [fadeIn, staggerRows],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentGuardians {
  private readonly portal = inject(PortalService);

  readonly guardians = signal<EstudianteApoderadoResponse[]>([]);
  readonly error = signal('');

  constructor() {
    this.portal.studentProfile().subscribe({
      next: (profile) => {
        if (profile.estudianteId) {
          this.portal.getApoderados(profile.estudianteId).subscribe({
            next: (data) => this.guardians.set(data),
            error: () => this.error.set('No se pudieron cargar los apoderados.'),
          });
        }
      },
      error: () => this.error.set('No se pudo identificar al estudiante actual.'),
    });
  }
}
