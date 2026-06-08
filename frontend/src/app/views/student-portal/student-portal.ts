import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Metric, StudentCourseReport } from '../../core/models';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-student-portal',
  imports: [DecimalPipe],
  templateUrl: './student-portal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentPortal {
  private readonly portal = inject(PortalService);

  readonly metrics = signal<Metric[]>([]);
  readonly reports = signal<StudentCourseReport[]>([]);
  readonly error = signal('');

  constructor() {
    this.portal.studentPortal().subscribe({
      next: (payload) => {
        this.metrics.set(payload.metrics);
        this.reports.set(payload.reports);
      },
      error: () => this.error.set('No se pudo cargar el portal del estudiante.'),
    });
  }

  statusClass(status: string): string {
    return status === 'Publicado' ? 'status-pill is-good' : 'status-pill is-warning';
  }
}
