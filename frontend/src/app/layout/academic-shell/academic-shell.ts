import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ROLE_HOME, ROLE_LABELS, RoleName } from '../../core/models';

interface NavItem {
  label: string;
  route: string;
  eyebrow: string;
}

const NAV_BY_ROLE: Record<RoleName, NavItem[]> = {
  ADMINISTRADOR: [
    { label: 'Resumen institucional', route: '/admin', eyebrow: 'Panel' },
    { label: 'Personas y usuarios', route: '/admin/usuarios', eyebrow: 'Accesos' },
    { label: 'Personal y Familia', route: '/admin/personal', eyebrow: 'Recursos Humanos' },
    { label: 'Gestion academica', route: '/admin/academico', eyebrow: 'Estructura' },
    { label: 'Matriculas y Alumnos', route: '/admin/alumnos', eyebrow: 'Gestion' },
    { label: 'Asistencia Diaria', route: '/admin/asistencias', eyebrow: 'Gestion' },
    { label: 'Pagos y Cuotas', route: '/admin/pagos', eyebrow: 'Finanzas' },
    { label: 'Supervision docente', route: '/admin/supervision', eyebrow: 'Notas' },
    { label: 'Configuracion', route: '/admin/configuracion', eyebrow: 'Institucion' },
  ],
  DOCENTE: [
    { label: 'Carga docente', route: '/docente', eyebrow: 'Cursos' },
    { label: 'Acta de notas', route: '/docente/notas', eyebrow: 'Registro' },
    { label: 'Importacion Excel', route: '/docente/importar', eyebrow: 'Carga' },
  ],
  ESTUDIANTE: [
    { label: 'Consulta academica', route: '/estudiante', eyebrow: 'Lectura' },
  ],
  PADRE_FAMILIA: [
    { label: 'Seguimiento familiar', route: '/familia', eyebrow: 'Lectura' },
  ],
};

@Component({
  selector: 'app-academic-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './academic-shell.html',
  styleUrl: './academic-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly session = this.auth.session;
  readonly activeRole = this.auth.activeRole;
  readonly roleLabels = ROLE_LABELS;
  readonly availableRoles = computed(() => this.auth.availableRoles());
  readonly navItems = computed(() => NAV_BY_ROLE[this.activeRole() ?? 'ADMINISTRADOR']);

  readonly roleTitle = computed(() => {
    const role = this.activeRole();
    return role ? ROLE_LABELS[role] : 'Usuario institucional';
  });

  homeRoute(): string {
    return ROLE_HOME[this.activeRole() ?? 'ADMINISTRADOR'];
  }

  initials(): string {
    const username = this.session()?.username ?? 'AD';
    return username
      .split(/[.\s_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  switchRole(role: RoleName): void {
    this.auth.switchRole(role);
    void this.router.navigate([ROLE_HOME[role]]);
  }

  logout(): void {
    this.auth.logout();
  }
}
