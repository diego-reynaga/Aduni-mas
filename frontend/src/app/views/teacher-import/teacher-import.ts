import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CourseAssignment,
  ErrorImportacionNotas,
  EstudianteTrimestrePreview,
  ImportacionNotasHistorial,
  RegistroNotasTrimestrePreviewResponse,
  ResultadoImportacionTrimestre,
  TrimestreImportacion,
  EntityId,
} from '../../core/models';
import { NotasService } from '../../core/notas.service';
import { PortalService } from '../../core/portal.service';
import { fadeIn } from '../../core/animations';

@Component({
  selector: 'app-teacher-import',
  imports: [ReactiveFormsModule],
  templateUrl: './teacher-import.html',
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherImport {
  private readonly notasService = inject(NotasService);
  private readonly portal = inject(PortalService);
  private readonly fb = inject(FormBuilder);

  readonly trimestres: Array<{ value: TrimestreImportacion; label: string }> = [
    { value: 'I_TRIMESTRE', label: 'I TRIMESTRE' },
    { value: 'II_TRIMESTRE', label: 'II TRIMESTRE' },
    { value: 'III_TRIMESTRE', label: 'III TRIMESTRE' },
  ];

  readonly form = this.fb.group({
    fileName: [''],
    trimestre: this.fb.control<TrimestreImportacion>('I_TRIMESTRE', { nonNullable: true, validators: [Validators.required] }),
    assignmentId: this.fb.control<EntityId | null>(null, { validators: [Validators.required] }),
  });

  readonly selectedFile = signal<File | null>(null);
  readonly preview = signal<RegistroNotasTrimestrePreviewResponse | null>(null);
  readonly result = signal<ResultadoImportacionTrimestre | null>(null);
  readonly history = signal<ImportacionNotasHistorial[]>([]);
  readonly courses = signal<CourseAssignment[]>([]);
  readonly selectedTrimestre = signal<TrimestreImportacion>('I_TRIMESTRE');
  readonly selectedAssignmentId = signal<EntityId | null>(null);
  readonly expandedRows = signal<Set<number>>(new Set());
  readonly loadingContext = signal(false);
  readonly loadingPreview = signal(false);
  readonly confirming = signal(false);
  readonly loadingHistory = signal(false);
  readonly error = signal('');

  readonly selectedCourse = computed(
    () => this.courses().find((course) => course.assignmentId === this.selectedAssignmentId()) ?? null,
  );

  readonly previewErrors = computed(() => {
    const preview = this.preview();
    if (!preview) {
      return [];
    }
    return [
      ...preview.errores,
      ...preview.estudiantes.flatMap((student) => student.errores),
    ];
  });

  readonly canPreview = computed(() => Boolean(this.selectedFile())
    && Boolean(this.selectedTrimestre())
    && Boolean(this.selectedAssignmentId())
    && !this.loadingPreview());

  readonly canConfirm = computed(() => {
    const preview = this.preview();
    return Boolean(this.selectedFile())
      && Boolean(preview)
      && !preview?.bloqueante
      && !this.confirming();
  });

  constructor() {
    this.loadContext();
    this.loadHistory();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.form.patchValue({ fileName: file?.name ?? '' });
    this.clearPreview();
  }

  onTrimestreChanged(): void {
    this.selectedTrimestre.set(this.form.controls.trimestre.value);
    this.clearPreview();
  }

  onAssignmentChanged(): void {
    const rawValue = this.form.controls.assignmentId.value;
    this.selectedAssignmentId.set(rawValue);
    this.clearPreview();
  }

  clearPreview(): void {
    this.preview.set(null);
    this.result.set(null);
    this.expandedRows.set(new Set());
    this.error.set('');
  }

  previewExcel(): void {
    const file = this.selectedFile();
    const assignmentId = this.selectedAssignmentId();
    if (!file || !assignmentId) {
      this.error.set('Seleccione archivo, trimestre y curso antes de previsualizar.');
      return;
    }

    this.loadingPreview.set(true);
    this.error.set('');
    this.result.set(null);
    this.preview.set(null);

    this.notasService.previewRegistroNotasTrimestre(file, this.selectedTrimestre(), assignmentId).subscribe({
      next: (response) => {
        this.loadingPreview.set(false);
        this.preview.set(response);
        this.expandedRows.set(new Set());
      },
      error: (error) => {
        this.loadingPreview.set(false);
        this.error.set(error?.error?.message ?? 'No se pudo previsualizar el trimestre seleccionado.');
      },
    });
  }

  confirmarImportacion(): void {
    const file = this.selectedFile();
    const assignmentId = this.selectedAssignmentId();
    if (!file || !assignmentId || !this.preview()) {
      this.error.set('Primero previsualice un archivo válido.');
      return;
    }

    this.confirming.set(true);
    this.error.set('');
    this.result.set(null);

    this.notasService.confirmarRegistroNotasTrimestre(file, this.selectedTrimestre(), assignmentId).subscribe({
      next: (response) => {
        this.confirming.set(false);
        this.result.set(response);
        this.loadHistory();
      },
      error: (error) => {
        this.confirming.set(false);
        this.error.set(error?.error?.message ?? 'No se pudo confirmar la importación del trimestre.');
      },
    });
  }

  toggleExpanded(student: EstudianteTrimestrePreview): void {
    const next = new Set(this.expandedRows());
    if (next.has(student.filaExcel)) {
      next.delete(student.filaExcel);
    } else {
      next.add(student.filaExcel);
    }
    this.expandedRows.set(next);
  }

  isExpanded(student: EstudianteTrimestrePreview): boolean {
    return this.expandedRows().has(student.filaExcel);
  }

  downloadErrors(): void {
    const errors = this.previewErrors();
    if (errors.length === 0) {
      return;
    }
    this.downloadErrorCsv(errors, 'errores-preview-importacion-trimestre.csv');
  }

  downloadResultErrors(): void {
    const errors = this.result()?.errores ?? [];
    if (errors.length > 0) {
      this.downloadErrorCsv(errors, `reporte-importacion-${this.result()?.idImportacion ?? 'notas'}.csv`);
    }
  }

  statusClass(status: string): string {
    if (status === 'PROCESADA') {
      return 'status-pill is-good';
    }
    if (status === 'FALLIDA') {
      return 'status-pill is-danger';
    }
    return 'status-pill is-warning';
  }

  rowClass(rowErrors: ErrorImportacionNotas[]): string {
    return rowErrors.length > 0 ? 'preview-row preview-row--error' : 'preview-row';
  }

  private loadContext(): void {
    this.loadingContext.set(true);
    this.portal.teacherImportContext().subscribe({
      next: (payload) => {
        this.loadingContext.set(false);
        this.courses.set(payload.courses);
        if (!this.form.controls.assignmentId.value) {
          const firstAssignmentId = payload.courses[0]?.assignmentId ?? null;
          this.form.patchValue({ assignmentId: firstAssignmentId });
          this.selectedAssignmentId.set(firstAssignmentId);
        }
      },
      error: () => {
        this.loadingContext.set(false);
        this.error.set('No se pudo cargar la lista de asignaciones del docente.');
      },
    });
  }

  private loadHistory(): void {
    this.loadingHistory.set(true);
    this.notasService.listarImportacionesNotas().subscribe({
      next: (history) => {
        this.loadingHistory.set(false);
        this.history.set(history.slice(0, 8));
      },
      error: () => {
        this.loadingHistory.set(false);
      },
    });
  }

  private downloadErrorCsv(errors: ErrorImportacionNotas[], filename: string): void {
    const header = ['Fila', 'Estudiante', 'Campo', 'Descripcion', 'Critico'];
    const body = errors.map((error) => [
      error.filaExcel ?? '',
      error.estudianteTexto ?? '',
      error.campo,
      error.descripcionError,
      error.critico ? 'SI' : 'NO',
    ]);
    const csv = [header, ...body]
      .map((columns) => columns.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
