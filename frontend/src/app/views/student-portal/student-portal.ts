import { DecimalPipe, DatePipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Metric, StudentCourseReport, CronogramaResponse, PagoResponse } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-student-portal',
  standalone: true,
  imports: [DecimalPipe, DatePipe, CommonModule],
  templateUrl: './student-portal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentPortal {
  private readonly portal = inject(PortalService);

  readonly metrics = signal<Metric[]>([]);
  readonly reports = signal<StudentCourseReport[]>([]);
  readonly error = signal('');
  
  readonly cronogramas = signal<CronogramaResponse[]>([]);
  readonly pagos = signal<PagoResponse[]>([]);

  constructor() {
    this.portal.studentPortal().subscribe({
      next: async (payload) => {
        this.metrics.set(payload.metrics);
        this.reports.set(payload.reports);
        
        if (payload.estudianteId) {
          const crons = await firstValueFrom(this.portal.getCronogramasPorEstudiante(payload.estudianteId));
          this.cronogramas.set(crons);
          
          const pgs = await firstValueFrom(this.portal.getPagos(payload.estudianteId));
          this.pagos.set(pgs);
        }
      },
      error: () => this.error.set('No se pudo cargar el portal del estudiante.'),
    });
  }

  statusClass(status: string): string {
    return status === 'Publicado' ? 'status-pill is-good' : 'status-pill is-warning';
  }

  descargarRecibo(pago: PagoResponse) {
    if (!pago.reciboGenerado) return;
    const url = this.portal.obtenerPdfUrl(pago.id);
    window.open(url, '_blank');
  }
}
