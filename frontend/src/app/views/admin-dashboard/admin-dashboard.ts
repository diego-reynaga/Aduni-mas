import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuditEntry, Metric, TeacherProgress } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, staggerList } from '../../core/animations';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.html',
  animations: [fadeIn, staggerList],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly portal = inject(PortalService);

  readonly metrics = signal<Metric[]>([]);
  readonly progress = signal<TeacherProgress[]>([]);
  readonly audits = signal<AuditEntry[]>([]);
  readonly error = signal('');

  constructor() {
    this.portal.adminDashboard().subscribe({
      next: (payload) => {
        this.metrics.set(payload.metrics);
        this.progress.set(payload.progress);
        this.audits.set(payload.audits);
      },
      error: () => {
        this.error.set('No se pudo cargar el panel administrativo desde el backend.');
      },
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
}
