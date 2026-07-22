import { DecimalPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CompetencyCapacity,
  CompetencyConfig,
  CompetencyNumber,
  CourseAssignment,
  EntityId,
  GradeEntry,
  TrimestreImportacion,
} from '../../core/models';
import { fadeIn } from '../../core/animations';
import { excelAverage, hasInvalidGrade } from '../../core/grade-calculation';
import { PortalService } from '../../core/portal.service';
import { ConfirmationService } from '../../core/confirmation.service';

type CapacityEditor = {
  competencia: CompetencyNumber;
  capacidad: number;
};

@Component({
  selector: 'app-teacher-grades',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './teacher-grades.html',
  styleUrl: './teacher-grades.css',
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherGrades {
  private readonly portal = inject(PortalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly confirmation = inject(ConfirmationService);
  private previouslyFocusedElement: HTMLElement | null = null;
  private loadRequestId = 0;

  readonly assignmentId = signal<EntityId | null>(null);
  readonly courses = signal<CourseAssignment[]>([]);
  readonly selectedCourse = signal<CourseAssignment | null>(null);
  readonly trimestre = signal<TrimestreImportacion>('I_TRIMESTRE');
  readonly trimestres: ReadonlyArray<{ value: TrimestreImportacion; label: string }> = [
    { value: 'I_TRIMESTRE', label: 'I TRIMESTRE' },
    { value: 'II_TRIMESTRE', label: 'II TRIMESTRE' },
    { value: 'III_TRIMESTRE', label: 'III TRIMESTRE' },
  ];
  readonly competencias = signal<CompetencyConfig[]>([]);
  readonly selectedCompetencyNumber = signal<CompetencyNumber>(1);
  readonly rows = signal<GradeEntry[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly editingCapacity = signal<CapacityEditor | null>(null);
  readonly capacityNameDraft = signal('');
  readonly capacityNameError = signal('');

  readonly activeCompetency = computed(() => this.competencias().find(
    (item) => item.numero === this.selectedCompetencyNumber(),
  ) ?? null);

  readonly evaluatedStudents = computed(() => this.rows().filter(
    (row) => this.competencyAverage(row) !== null,
  ).length);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const rawId = params.get('assignmentId');
      const requestedTrimestre = this.parseTrimestre(params.get('trimestre'));
      this.loadGrades(rawId ?? undefined, requestedTrimestre ?? undefined);
    });
  }

  selectCompetency(value: CompetencyNumber): void {
    this.selectedCompetencyNumber.set(Number(value) as CompetencyNumber);
    this.error.set('');
    this.message.set('');
  }

  async switchCourse(value: EntityId | null): Promise<void> {
    if (!value || value === this.assignmentId()) return;
    if (this.dirty() && !await this.confirmation.confirm({
      title: 'Cambios sin guardar',
      message: 'Al cambiar de curso se descartarán las modificaciones realizadas en el acta actual.',
      confirmLabel: 'Cambiar curso',
      tone: 'danger',
    })) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { assignmentId: value, trimestre: this.trimestre() },
      queryParamsHandling: '',
    });
  }

  async switchTrimestre(value: TrimestreImportacion): Promise<void> {
    if (value === this.trimestre()) return;
    if (this.dirty() && !await this.confirmation.confirm({
      title: 'Cambios sin guardar',
      message: 'Al cambiar de trimestre se descartarán las modificaciones realizadas en el acta actual.',
      confirmLabel: 'Cambiar trimestre',
      tone: 'danger',
    })) return;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { assignmentId: this.assignmentId(), trimestre: value },
      queryParamsHandling: '',
    });
  }

  hasPendingChanges(): boolean {
    return this.dirty();
  }

  capacityGrade(row: GradeEntry, capacityIndex: number): number | null {
    return row.competencias.find((item) => item.numero === this.selectedCompetencyNumber())
      ?.notas[capacityIndex] ?? null;
  }

  updateGrade(row: GradeEntry, capacityIndex: number, rawValue: unknown): void {
    const value = this.normalizeInputValue(rawValue);
    const competencyNumber = this.selectedCompetencyNumber();
    const updatedRows = this.rows().map((item) => {
      if (item.estudianteId !== row.estudianteId) return item;
      return {
        ...item,
        competencias: item.competencias.map((competency) => {
          if (competency.numero !== competencyNumber) return competency;
          const notas = [...competency.notas];
          notas[capacityIndex] = value;
          return { ...competency, notas };
        }),
      };
    });
    this.rows.set(updatedRows);
    this.markDirty();
  }

  competencyAverage(row: GradeEntry, competencyNumber = this.selectedCompetencyNumber()): number | null {
    const config = this.competencias().find((item) => item.numero === competencyNumber);
    const grades = row.competencias.find((item) => item.numero === competencyNumber)?.notas ?? [];
    return excelAverage(grades.slice(0, config?.capacidades.length ?? 0));
  }

  finalAverage(row: GradeEntry): number | null {
    if (row.competencias.some((item) => item.notas.some(hasInvalidGrade))) return null;
    return excelAverage(this.competencias().map((item) => this.competencyAverage(row, item.numero)));
  }

  isGradeInvalid(value: unknown): boolean {
    return hasInvalidGrade(value);
  }

  addCapacity(): void {
    const competency = this.activeCompetency();
    if (!competency || competency.capacidades.length >= 6) return;

    const capacity: CompetencyCapacity = {
      numero: competency.capacidades.length + 1,
      nombre: `CAPACIDAD ${competency.capacidades.length + 1}`,
    };
    this.competencias.update((items) => items.map((item) => item.numero === competency.numero
      ? { ...item, capacidades: [...item.capacidades, capacity] }
      : item));
    this.rows.update((rows) => rows.map((row) => ({
      ...row,
      competencias: row.competencias.map((item) => item.numero === competency.numero
        ? { ...item, notas: [...item.notas, null] }
        : item),
    })));
    this.markDirty();
    this.openCapacityEditor(competency.numero, capacity.numero);
  }

  async removeCapacity(competencia: CompetencyNumber, capacidad: number): Promise<void> {
    const config = this.competencias().find((item) => item.numero === competencia);
    if (!config || config.capacidades.length <= 3) return;
    const selected = config.capacidades.find((item) => item.numero === capacidad);
    if (!selected || !await this.confirmation.confirm({
      title: 'Eliminar capacidad',
      message: `Se eliminará “${selected.nombre}” y sus notas se quitarán al guardar el acta.`,
      confirmLabel: 'Eliminar capacidad',
      tone: 'danger',
    })) return;

    this.competencias.update((items) => items.map((item) => item.numero === competencia
      ? {
        ...item,
        capacidades: item.capacidades
          .filter((capacity) => capacity.numero !== capacidad)
          .map((capacity, index) => ({ ...capacity, numero: index + 1 })),
      }
      : item));
    this.rows.update((rows) => rows.map((row) => ({
      ...row,
      competencias: row.competencias.map((item) => item.numero === competencia
        ? { ...item, notas: item.notas.filter((_, index) => index !== capacidad - 1) }
        : item),
    })));
    this.markDirty();
  }

  openCapacityEditor(competencia: CompetencyNumber, capacidad: number, event?: Event): void {
    const config = this.competencias().find((item) => item.numero === competencia);
    const current = config?.capacidades.find((item) => item.numero === capacidad);
    if (!current) return;

    this.previouslyFocusedElement = event?.currentTarget as HTMLElement | null;
    this.capacityNameDraft.set(current.nombre);
    this.capacityNameError.set('');
    this.editingCapacity.set({ competencia, capacidad });
    queueMicrotask(() => this.document.getElementById('capacity-name-input')?.focus());
  }

  saveCapacityName(): void {
    const editor = this.editingCapacity();
    if (!editor) return;
    const name = this.capacityNameDraft().trim().replace(/\s+/g, ' ');
    const config = this.competencias().find((item) => item.numero === editor.competencia);
    if (!name) {
      this.capacityNameError.set('Ingrese un nombre para la capacidad.');
      return;
    }
    if (name.length > 60) {
      this.capacityNameError.set('Use como máximo 60 caracteres.');
      return;
    }
    const duplicate = config?.capacidades.some((item) => item.numero !== editor.capacidad
      && item.nombre.trim().toLocaleUpperCase('es') === name.toLocaleUpperCase('es'));
    if (duplicate) {
      this.capacityNameError.set('Ya existe una capacidad con ese nombre en esta competencia.');
      return;
    }

    this.competencias.update((items) => items.map((item) => item.numero === editor.competencia
      ? {
        ...item,
        capacidades: item.capacidades.map((capacity) => capacity.numero === editor.capacidad
          ? { ...capacity, nombre: name }
          : capacity),
      }
      : item));
    this.markDirty();
    this.closeCapacityEditor();
  }

  closeCapacityEditor(): void {
    if (!this.editingCapacity()) return;
    this.editingCapacity.set(null);
    this.capacityNameDraft.set('');
    this.capacityNameError.set('');
    const target = this.previouslyFocusedElement;
    this.previouslyFocusedElement = null;
    queueMicrotask(() => target?.focus());
  }

  handleDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const dialog = this.document.querySelector<HTMLElement>('.capacity-dialog');
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  save(): void {
    const assignmentId = this.assignmentId();
    if (!assignmentId) {
      this.error.set('No hay asignación seleccionada para guardar.');
      return;
    }
    if (this.rows().some((row) => row.competencias.some((item) => item.notas.some(hasInvalidGrade)))) {
      this.error.set('Corrija las notas marcadas: solo se permiten números entre 0 y 20.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    this.portal.saveTeacherGrades(assignmentId, {
      trimestre: this.trimestre(),
      competencias: this.competencias().map((item) => ({
        ...item,
        capacidades: item.capacidades.map((capacity) => ({ ...capacity })),
      })),
      estudiantes: this.rows().map((row) => ({
        estudianteId: row.estudianteId,
        competencias: row.competencias.map((item) => ({
          numero: item.numero,
          notas: [...item.notas],
        })),
      })),
    }).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.dirty.set(false);
        this.message.set(response.message);
      },
      error: (error) => {
        this.saving.set(false);
        this.error.set(this.errorMessage(error, 'No se pudo guardar el acta en Supabase.'));
      },
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeCapacityEditor();
  }

  @HostListener('window:beforeunload', ['$event'])
  preventAccidentalExit(event: BeforeUnloadEvent): void {
    if (!this.dirty()) return;
    event.preventDefault();
  }

  private loadGrades(assignmentId?: EntityId, trimestre?: TrimestreImportacion): void {
    const requestId = ++this.loadRequestId;
    if (trimestre) this.trimestre.set(trimestre);
    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    this.dirty.set(false);

    this.portal.teacherGrades(assignmentId, trimestre).subscribe({
      next: (payload) => {
        if (requestId !== this.loadRequestId) return;
        this.loading.set(false);
        this.courses.set(payload.courses);
        this.assignmentId.set(payload.assignmentId);
        this.selectedCourse.set(payload.selectedCourse);
        this.trimestre.set(payload.trimestre);
        this.competencias.set(payload.competencias.map((item) => ({
          ...item,
          capacidades: item.capacidades.map((capacity) => ({ ...capacity })),
        })));
        this.rows.set(payload.rows.map((row) => ({
          ...row,
          competencias: row.competencias.map((item) => ({ ...item, notas: [...item.notas] })),
        })));
        this.selectedCompetencyNumber.set(payload.competencias[0]?.numero ?? 1);
      },
      error: (error) => {
        if (requestId !== this.loadRequestId) return;
        this.loading.set(false);
        this.error.set(this.errorMessage(error, 'No se pudo cargar el acta de notas.'));
        this.assignmentId.set(null);
        this.courses.set([]);
        this.selectedCourse.set(null);
        this.competencias.set([]);
        this.rows.set([]);
      },
    });
  }

  private normalizeInputValue(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    const parsed = Number(String(value).trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  private parseTrimestre(value: string | null): TrimestreImportacion | null {
    return this.trimestres.some((item) => item.value === value)
      ? value as TrimestreImportacion
      : null;
  }

  private markDirty(): void {
    this.dirty.set(true);
    this.error.set('');
    this.message.set('');
  }

  private errorMessage(error: unknown, fallback: string): string {
    const candidate = error as { message?: string; error?: string | { message?: string } };
    if (candidate?.message) return candidate.message;
    if (typeof candidate?.error === 'string') return candidate.error;
    return candidate?.error?.message || fallback;
  }
}
