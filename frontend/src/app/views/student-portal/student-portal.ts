import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Metric, StudentCourseCompetencyReport } from '../../core/models';
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
  selector: 'app-student-portal',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './student-portal.html',
  styleUrl: './student-portal.css',
  animations: [fadeIn, staggerRows],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentPortal {
  private readonly portal = inject(PortalService);

  readonly loading = signal(true);
  readonly metrics = signal<Metric[]>([]);
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
    return (this.reports() || []).filter(r => normalizeTrimestreKey(r.trimestre) === sel);
  });

  readonly selectedTrimestreLabel = computed(() => {
    const found = this.trimestres.find(t => t.value === this.selectedTrimestre());
    return found ? found.label : 'I TRIMESTRE';
  });

  constructor() {
    this.loading.set(true);

    this.portal.studentPortal().subscribe({
      next: (payload) => {
        if (payload?.metrics) {
          this.metrics.set(payload.metrics);
        }
      },
      error: (err) => console.error('Error fetching student metrics:', err),
    });

    this.portal.studentCompetencyGrades().subscribe({
      next: (compReports) => {
        this.reports.set(compReports || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching student competency grades:', err);
        this.error.set('No se pudieron cargar las calificaciones por competencia.');
        this.loading.set(false);
      },
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
