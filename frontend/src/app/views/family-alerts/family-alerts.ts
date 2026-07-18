import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FamilyAlert, FamilyStudent } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn } from '../../core/animations';

@Component({
  selector: 'app-family-alerts',
  templateUrl: './family-alerts.html',
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyAlerts {
  private readonly portal = inject(PortalService);
  private readonly router = inject(Router);

  readonly students = signal<FamilyStudent[]>([]);
  readonly alerts = signal<FamilyAlert[]>([]);
  readonly error = signal('');
  
  readonly selectedCode = computed(() => this.portal.familySelectedCode());
  readonly selectedStudent = computed<FamilyStudent | null>(
    () => this.students().find((student) => student.codigo === this.selectedCode()) ?? null,
  );

  constructor() {
    if (!this.portal.familySelectedCode()) {
      this.router.navigate(['/familia/selector']);
      return;
    }

    this.portal.familyPortal().subscribe({
      next: (payload) => {
        this.students.set(payload.students);
        this.alerts.set(payload.alerts);
      },
      error: () => this.error.set('No se pudieron cargar las alertas familiares.'),
    });
  }
}
