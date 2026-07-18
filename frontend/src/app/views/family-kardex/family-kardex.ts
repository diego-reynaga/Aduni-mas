import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FamilyStudent, StudentCourseCompetencyReport } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, staggerRows } from '../../core/animations';

@Component({
  selector: 'app-family-kardex',
  imports: [DecimalPipe],
  templateUrl: './family-kardex.html',
  styleUrl: './family-kardex.css',
  animations: [fadeIn, staggerRows],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyKardex {
  private readonly portal = inject(PortalService);
  private readonly router = inject(Router);

  readonly students = signal<FamilyStudent[]>([]);
  readonly reports = signal<StudentCourseCompetencyReport[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  
  readonly selectedCode = computed(() => this.portal.familySelectedCode());
  readonly selectedStudent = computed<FamilyStudent | null>(
    () => this.students().find((student) => student.codigo === this.selectedCode()) ?? null,
  );

  readonly totalCourses = computed(() => this.reports().length);
  
  readonly overallAverage = computed(() => {
    const list = this.reports();
    if (!list.length) return 0;
    const sum = list.reduce((acc, curr) => acc + (curr.promedioFinal || 0), 0);
    return sum / list.length;
  });

  readonly approvedCourses = computed(() => {
    return this.reports().filter(r => (r.promedioFinal || 0) >= 11).length;
  });

  constructor() {
    if (!this.portal.familySelectedCode()) {
      this.router.navigate(['/familia/selector']);
      return;
    }

    this.portal.familyPortal().subscribe({
      next: (payload) => {
        this.students.set(payload.students);
      },
      error: () => this.error.set('No se pudieron cargar los estudiantes.'),
    });

    effect(() => {
      const codigo = this.selectedCode();
      if (codigo) {
        this.cargarNotasDetalladas(codigo);
      }
    });
  }

  private cargarNotasDetalladas(codigo: string) {
    this.loading.set(true);
    this.portal.familyCompetencyGrades(codigo).subscribe({
      next: (data) => {
        this.reports.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las notas detalladas de este estudiante.');
        this.loading.set(false);
      }
    });
  }
}
