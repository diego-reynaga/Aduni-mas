import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TeacherProgress } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn } from '../../core/animations';

@Component({
  selector: 'app-admin-supervision',
  templateUrl: './admin-supervision.html',
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSupervision {
  private readonly portal = inject(PortalService);
  readonly progress = signal<TeacherProgress[]>([]);
  readonly error = signal('');

  constructor() {
    this.portal.adminSupervision().subscribe({
      next: (progress) => this.progress.set(progress),
      error: () => this.error.set('No se pudo cargar el monitoreo de supervision.'),
    });
  }

  statusClass(status: string): string {
    if (status === 'Completo') {
      return 'status-pill is-good';
    }

    if (status === 'En proceso') {
      return 'status-pill is-warning';
    }

    return 'status-pill is-danger';
  }

  exportReport(): void {
    const rows = this.progress();
    const header = ['Docente', 'Codigo', 'Area', 'Curso', 'Grado', 'Periodo', 'Avance', 'Estado'];
    const body = rows.map((row) => [
      row.docente,
      row.codigo,
      row.area,
      row.curso,
      row.grado,
      row.periodo,
      `${row.avance}%`,
      row.estado,
    ]);
    const csv = [header, ...body]
      .map((columns) => columns.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-avance-docente.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
