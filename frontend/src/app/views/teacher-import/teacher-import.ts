import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CourseAssignment, ExcelImportResult, ImportBatch } from '../../core/models';
import { NotasService } from '../../core/notas.service';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-teacher-import',
  templateUrl: './teacher-import.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherImport {
  private readonly notasService = inject(NotasService);
  private readonly portal = inject(PortalService);

  readonly courses = signal<CourseAssignment[]>([]);
  readonly history = signal<ImportBatch[]>([]);
  readonly selectedFileName = signal('');
  readonly selectedFile = signal<File | null>(null);
  readonly selectedAssignmentId = signal<number | null>(null);
  readonly result = signal<ExcelImportResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly selectedCourse = computed(
    () => this.courses().find((course) => course.assignmentId === this.selectedAssignmentId()) ?? null,
  );
  readonly canImport = computed(() => Boolean(this.selectedAssignmentId() && this.selectedFile()));

  constructor() {
    this.loadContext();
  }

  private loadContext(): void {
    this.portal.teacherImportContext().subscribe({
      next: (payload) => {
        this.courses.set(payload.courses);
        this.history.set(payload.history);
        if (!this.selectedAssignmentId()) {
          this.selectedAssignmentId.set(payload.courses[0]?.assignmentId ?? null);
        }
      },
      error: () => {
        this.error.set('No se pudo cargar el contexto de importacion desde el backend.');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.selectedFileName.set(file?.name ?? '');
    this.result.set(null);
    this.error.set('');
  }

  setAssignment(value: string): void {
    this.selectedAssignmentId.set(value ? Number(value) : null);
    this.result.set(null);
    this.error.set('');
  }

  importarExcel(): void {
    if (!this.selectedAssignmentId() || !this.selectedFile()) {
      this.error.set('Seleccione una asignacion y un archivo Excel antes de importar.');
      return;
    }

    this.error.set('');
    this.result.set(null);
    this.loading.set(true);

    this.notasService.importarExcel(this.selectedAssignmentId()!, this.selectedFile()!).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.result.set(result);
        this.loadContext();
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error?.error?.message ?? 'El backend rechazo la importacion del Excel.');
      },
    });
  }

}
