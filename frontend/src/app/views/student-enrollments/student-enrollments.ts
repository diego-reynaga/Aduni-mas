import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { StudentEnrollment } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, staggerRows } from '../../core/animations';

@Component({
  selector: 'app-student-enrollments',
  imports: [DatePipe],
  templateUrl: './student-enrollments.html',
  animations: [fadeIn, staggerRows],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentEnrollments {
  private readonly portal = inject(PortalService);

  readonly enrollments = signal<StudentEnrollment[]>([]);
  readonly error = signal('');

  constructor() {
    this.portal.studentEnrollments().subscribe({
      next: (data) => this.enrollments.set(data),
      error: () => this.error.set('No se pudo cargar el historial de matrículas.'),
    });
  }
}
