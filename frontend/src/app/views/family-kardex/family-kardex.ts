import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FamilyStudent, StudentCourseCompetencyReport } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, staggerRows } from '../../core/animations';
import { excelAchievement, getAchievementInfo } from '../../core/grade-calculation';

function normalizeTrimestreKey(val: string | null | undefined): string {
  if (!val) return 'I_TRIMESTRE';
  const clean = val.toString().toUpperCase().trim().replace(/[\s_-]+/g, '');
  if (clean.includes('III') || clean === '3' || clean.includes('TRIMESTRE3')) return 'III_TRIMESTRE';
  if (clean.includes('II') || clean === '2' || clean.includes('TRIMESTRE2')) return 'II_TRIMESTRE';
  if (clean.includes('I') || clean === '1' || clean.includes('TRIMESTRE1')) return 'I_TRIMESTRE';
  return val.replace(/\s+/g, '_');
}

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
  readonly selectedTrimestre = signal<string>('I_TRIMESTRE');

  readonly trimestres = [
    { value: 'I_TRIMESTRE', label: 'I TRIMESTRE' },
    { value: 'II_TRIMESTRE', label: 'II TRIMESTRE' },
    { value: 'III_TRIMESTRE', label: 'III TRIMESTRE' },
  ];

  readonly filteredReports = computed(() => {
    const sel = this.selectedTrimestre();
    return this.reports().filter(r => normalizeTrimestreKey(r.trimestre) === sel);
  });

  readonly selectedTrimestreLabel = computed(() => {
    const found = this.trimestres.find(t => t.value === this.selectedTrimestre());
    return found ? found.label : 'I TRIMESTRE';
  });
  
  readonly selectedCode = computed(() => this.portal.familySelectedCode());
  readonly selectedStudent = computed<FamilyStudent | null>(
    () => this.students().find((student) => student.codigo === this.selectedCode()) ?? null,
  );

  readonly totalCourses = computed(() => this.filteredReports().length);
  
  readonly overallAverage = computed(() => {
    const list = this.filteredReports();
    if (!list.length) return 0;
    const sum = list.reduce((acc, curr) => acc + (curr.promedioFinal || 0), 0);
    return sum / list.length;
  });

  readonly approvedCourses = computed(() => {
    return this.filteredReports().filter(r => (r.promedioFinal || 0) >= 11).length;
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

  getLogro(nota: number | null | undefined): string {
    return excelAchievement(nota);
  }

  getLogroInfo(nota: number | null | undefined) {
    return getAchievementInfo(nota);
  }

  formatPeriodoTrimestre(periodo: string, trimestre: string): string {
    const trimFormatted = (trimestre || '').replace('_', ' ').trim();
    if (!periodo) return trimFormatted;

    const pNormalized = periodo.trim();
    if (pNormalized.toLowerCase() === trimFormatted.toLowerCase() || pNormalized.toLowerCase().includes('trimestre')) {
      return trimFormatted;
    }

    return `${pNormalized} - ${trimFormatted}`;
  }
}
