import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ROLE_LABELS, RoleName } from '../../core/models';
import { UserRow } from '../../core/models';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers {
  private readonly portal = inject(PortalService);

  readonly users = signal<UserRow[]>([]);
  readonly roleLabels = ROLE_LABELS;
  readonly error = signal('');
  readonly totalActive = computed(() => this.users().filter((user) => user.estado === 'Activo').length);
  readonly roleTotals = computed(() => {
    const totals: Record<RoleName, number> = {
      ADMINISTRADOR: 0,
      DOCENTE: 0,
      ESTUDIANTE: 0,
      PADRE_FAMILIA: 0,
    };

    for (const user of this.users()) {
      totals[user.rol] += 1;
    }

    return totals;
  });

  constructor() {
    this.portal.adminUsers().subscribe({
      next: (users) => this.users.set(users),
      error: () => this.error.set('No se pudo cargar el directorio de usuarios.'),
    });
  }

  statusClass(status: string): string {
    if (status === 'Activo') {
      return 'status-pill is-good';
    }

    if (status === 'Pendiente') {
      return 'status-pill is-warning';
    }

    return 'status-pill is-danger';
  }
}
