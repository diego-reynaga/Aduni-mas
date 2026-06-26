import { DecimalPipe, DatePipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { FamilyAlert, FamilyStudent, StudentCourseReport, CronogramaResponse, PagoResponse } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-family-portal',
  standalone: true,
  imports: [DecimalPipe, DatePipe, CommonModule],
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

  readonly cronogramas = signal<CronogramaResponse[]>([]);
  readonly pagos = signal<PagoResponse[]>([]);

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

    effect(async () => {
      const selected = this.selectedStudent();
      if (selected?.estudianteId) {
        const crons = await firstValueFrom(this.portal.getCronogramasPorEstudiante(selected.estudianteId));
        this.cronogramas.set(crons);
        
        const pgs = await firstValueFrom(this.portal.getPagos(selected.estudianteId));
        this.pagos.set(pgs);
      } else {
        this.cronogramas.set([]);
        this.pagos.set([]);
      }
    });
  }

  selectStudent(codigo: string): void {
    this.selectedCode.set(codigo);
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
