import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { StudentCourseCompetencyReport } from '../../core/models';
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
  selector: 'app-student-competency-grades',
  imports: [DecimalPipe],
  templateUrl: './student-competency-grades.html',
  styleUrl: './student-competency-grades.css',
  animations: [fadeIn, staggerRows],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentCompetencyGrades {
  private readonly portal = inject(PortalService);

  readonly reports = signal<StudentCourseCompetencyReport[]>([]);
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

  readonly totalCourses = computed(() => this.filteredReports().length);

  readonly approvedCourses = computed(() => {
    return this.filteredReports().filter(r => r.promedioFinal !== null && r.promedioFinal >= 11).length;
  });

  readonly overallAverage = computed(() => {
    const list = this.filteredReports().map(r => r.promedioFinal).filter(p => p !== null) as number[];
    if (!list.length) return 0;
    return list.reduce((a, b) => a + b, 0) / list.length;
  });

  constructor() {
    this.portal.studentCompetencyGrades().subscribe({
      next: (data) => {
        this.reports.set(data);
      },
      error: () => this.error.set('No se pudo cargar el reporte de competencias.'),
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
