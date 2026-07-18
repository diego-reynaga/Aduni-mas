import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FamilyStudent } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn } from '../../core/animations';

@Component({
  selector: 'app-family-selector',
  templateUrl: './family-selector.html',
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilySelector {
  private readonly portal = inject(PortalService);
  private readonly router = inject(Router);

  readonly students = signal<FamilyStudent[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    // Limpiar selección actual al entrar al selector
    this.portal.familySelectedCode.set('');

    this.portal.familyPortal().subscribe({
      next: (payload) => {
        this.students.set(payload.students);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de estudiantes asociados.');
        this.loading.set(false);
      }
    });
  }

  selectStudent(codigo: string) {
    this.portal.familySelectedCode.set(codigo);
    this.router.navigate(['/familia/resumen']);
  }
}
