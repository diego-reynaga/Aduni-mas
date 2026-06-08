import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseAssignment, Metric } from '../../core/models';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [RouterLink],
  templateUrl: './teacher-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherDashboard {
  private readonly portal = inject(PortalService);

  readonly metrics = signal<Metric[]>([]);
  readonly courses = signal<CourseAssignment[]>([]);
  readonly error = signal('');

  constructor() {
    this.portal.teacherDashboard().subscribe({
      next: (payload) => {
        this.metrics.set(payload.metrics);
        this.courses.set(payload.courses);
      },
      error: () => this.error.set('No se pudo cargar la informacion docente desde el backend.'),
    });
  }
}
