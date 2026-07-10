import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntityId, GradeEntry } from '../../core/models';
import { ActivatedRoute } from '@angular/router';
import { PortalService } from '../../core/portal.service';
import { CourseAssignment } from '../../core/models';
import { fadeIn } from '../../core/animations';
import { excelAverage, hasInvalidGrade } from '../../core/grade-calculation';

const GRADE_FIELDS = ['practica', 'examen', 'tarea', 'participacion'] as const;

@Component({
  selector: 'app-teacher-grades',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './teacher-grades.html',
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherGrades {
  private readonly portal = inject(PortalService);
  private readonly route = inject(ActivatedRoute);

  readonly assignmentId = signal<EntityId | null>(null);
  readonly selectedCourse = signal<CourseAssignment | null>(null);
  readonly rows = signal<GradeEntry[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const rawId = params.get('assignmentId');
      this.loadGrades(rawId ?? undefined);
    });
  }

  updateAverage(row: GradeEntry): void {
    const values = this.gradeValues(row);
    row.promedio = values.some(hasInvalidGrade) ? null : excelAverage(values);
    this.rows.update((rows) => [...rows]);
  }

  isGradeInvalid(value: unknown): boolean {
    return hasInvalidGrade(value);
  }

  save(): void {
    if (!this.assignmentId()) {
      this.error.set('No hay asignacion seleccionada para guardar.');
      return;
    }
    if (this.rows().some((row) => this.gradeValues(row).some(hasInvalidGrade))) {
      this.error.set('Corrija las notas marcadas: solo se permiten números entre 0 y 20.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.message.set('');

    this.portal.saveTeacherGrades(
      this.assignmentId()!,
      this.rows().map((row) => ({
        codigo: row.codigo,
        practica: row.practica,
        examen: row.examen,
        tarea: row.tarea,
        participacion: row.participacion,
        observacion: row.observacion || '',
      })),
    ).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.message.set(response.message);
      },
      error: (error) => {
        this.saving.set(false);
        this.error.set(this.errorMessage(error, 'No se pudo guardar el acta en Supabase.'));
      },
    });
  }

  private loadGrades(assignmentId?: EntityId): void {
    this.loading.set(true);
    this.error.set('');
    this.message.set('');

    this.portal.teacherGrades(assignmentId).subscribe({
      next: (payload) => {
        this.loading.set(false);
        this.assignmentId.set(payload.assignmentId);
        this.selectedCourse.set(payload.selectedCourse);
        this.rows.set(payload.rows.map((row) => ({ ...row })));
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(this.errorMessage(error, 'No se pudo cargar el acta de notas.'));
        this.assignmentId.set(null);
        this.selectedCourse.set(null);
        this.rows.set([]);
      },
    });
  }

  private gradeValues(row: GradeEntry): Array<number | null> {
    return GRADE_FIELDS.map((field) => row[field]);
  }

  private errorMessage(error: unknown, fallback: string): string {
    const candidate = error as { message?: string; error?: string | { message?: string } };
    if (candidate?.message) return candidate.message;
    if (typeof candidate?.error === 'string') return candidate.error;
    return candidate?.error?.message || fallback;
  }
}
