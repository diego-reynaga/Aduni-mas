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
import { excelAchievement, excelAverage, hasInvalidGrade } from '../../core/grade-calculation';
import { PortalService } from '../../core/portal.service';

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
  private previouslyFocusedElement: HTMLElement | null = null;

  readonly assignmentId = signal<EntityId | null>(null);
  readonly courses = signal<CourseAssignment[]>([]);
  readonly selectedCourse = signal<CourseAssignment | null>(null);
  readonly trimestre = signal<TrimestreImportacion>('I_TRIMESTRE');
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
  readonly editingCompetency = signal<CompetencyNumber | null>(null);
  readonly competencyNameDraft = signal('');
  readonly competencyNameError = signal('');

  readonly activeCompetency = computed(() => this.competencias().find(
    (item) => item.numero === this.selectedCompetencyNumber(),
  ) ?? null);

  readonly evaluatedStudents = computed(() => this.rows().filter(
    (row) => this.competencyAverage(row) !== null,
  ).length);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const rawId = params.get('assignmentId');
      this.loadGrades(rawId ?? undefined);
    });
  }

  selectCompetency(value: CompetencyNumber): void {
    this.selectedCompetencyNumber.set(Number(value) as CompetencyNumber);
    this.error.set('');
    this.message.set('');
  }

  switchCourse(value: EntityId | null): void {
    if (!value || value === this.assignmentId()) return;
    if (this.dirty() && !window.confirm('Tiene cambios sin guardar. ¿Desea cambiar de curso y descartarlos?')) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { assignmentId: value },
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

  achievement(value: number | null): string {
    return value === null ? '' : excelAchievement(value);
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

  removeCapacity(competencia: CompetencyNumber, capacidad: number): void {
    const config = this.competencias().find((item) => item.numero === competencia);
    if (!config || config.capacidades.length <= 3) return;
    const selected = config.capacidades.find((item) => item.numero === capacidad);
    if (!selected || !window.confirm(`¿Eliminar la capacidad “${selected.nombre}”? Sus notas se quitarán al guardar.`)) return;

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

  openCompetencyEditor(competencia: CompetencyNumber, event?: Event): void {
    const config = this.competencias().find((item) => item.numero === competencia);
    if (!config) return;
    this.previouslyFocusedElement = event?.currentTarget as HTMLElement | null;
    this.competencyNameDraft.set(config.nombre);
    this.competencyNameError.set('');
    this.editingCompetency.set(competencia);
    queueMicrotask(() => this.document.getElementById('competency-name-input')?.focus());
  }

  saveCompetencyName(): void {
    const competencyNumber = this.editingCompetency();
    if (!competencyNumber) return;
    const name = this.competencyNameDraft().trim().replace(/\s+/g, ' ');
    if (!name) {
      this.competencyNameError.set('Ingrese un nombre para la competencia.');
      return;
    }
    if (name.length > 255) {
      this.competencyNameError.set('Use como máximo 255 caracteres.');
      return;
    }
    this.competencias.update((items) => items.map((item) => item.numero === competencyNumber
      ? { ...item, nombre: name }
      : item));
    this.markDirty();
    this.closeCompetencyEditor();
  }

  closeCompetencyEditor(): void {
    if (!this.editingCompetency()) return;
    this.editingCompetency.set(null);
    this.competencyNameDraft.set('');
    this.competencyNameError.set('');
    const target = this.previouslyFocusedElement;
    this.previouslyFocusedElement = null;
    queueMicrotask(() => target?.focus());
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
    this.closeCompetencyEditor();
  }

  @HostListener('window:beforeunload', ['$event'])
  preventAccidentalExit(event: BeforeUnloadEvent): void {
    if (!this.dirty()) return;
    event.preventDefault();
  }

  private loadGrades(assignmentId?: EntityId): void {
    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    this.dirty.set(false);

    this.portal.teacherGrades(assignmentId).subscribe({
      next: (payload) => {
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
