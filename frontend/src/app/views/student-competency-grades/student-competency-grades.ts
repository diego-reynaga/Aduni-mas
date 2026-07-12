import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { StudentCourseCompetencyReport } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, staggerRows } from '../../core/animations';

@Component({
  selector: 'app-student-competency-grades',
  imports: [DecimalPipe],
  templateUrl: './student-competency-grades.html',
  animations: [fadeIn, staggerRows],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentCompetencyGrades {
  private readonly portal = inject(PortalService);

  readonly reports = signal<StudentCourseCompetencyReport[]>([]);
  readonly error = signal('');

  constructor() {
    this.portal.studentCompetencyGrades().subscribe({
      next: (data) => this.reports.set(data),
      error: () => this.error.set('No se pudo cargar el reporte de competencias.'),
    });
  }
}
