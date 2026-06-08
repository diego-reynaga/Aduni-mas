import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FamilyAlert, FamilyStudent, StudentCourseReport } from '../../core/models';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-family-portal',
  imports: [DecimalPipe],
  templateUrl: './family-portal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyPortal {
  private readonly portal = inject(PortalService);

  readonly students = signal<FamilyStudent[]>([]);
  readonly reportsByStudent = signal<Record<string, StudentCourseReport[]>>({});
  readonly alerts = signal<FamilyAlert[]>([]);
  readonly selectedCode = signal('');
  readonly error = signal('');
  readonly selectedStudent = computed<FamilyStudent | null>(
    () => this.students().find((student) => student.codigo === this.selectedCode()) ?? this.students()[0] ?? null,
  );
  readonly reports = computed<StudentCourseReport[]>(() => {
    const selected = this.selectedStudent();
    if (!selected) {
      return [];
    }

    return this.reportsByStudent()[selected.codigo] ?? [];
  });

  constructor() {
    this.portal.familyPortal().subscribe({
      next: (payload) => {
        this.students.set(payload.students);
        this.reportsByStudent.set(payload.reportsByStudent);
        this.alerts.set(payload.alerts);
        this.selectedCode.set(payload.students[0]?.codigo ?? '');
      },
      error: () => this.error.set('No se pudo cargar el portal familiar desde el backend.'),
    });
  }

  selectStudent(codigo: string): void {
    this.selectedCode.set(codigo);
  }

  statusClass(status: string): string {
    return status === 'Publicado' ? 'status-pill is-good' : 'status-pill is-warning';
  }
}
