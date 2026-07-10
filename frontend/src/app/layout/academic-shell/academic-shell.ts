import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ROLE_HOME, ROLE_LABELS, RoleName } from '../../core/models';
import { expandCollapse, routeAnimations, staggerNav } from '../../core/animations';

interface NavItem {
  label: string;
  route: string;
  eyebrow: string;
}

interface NavGroup {
  module: string;
  items: NavItem[];
}

const NAV_BY_ROLE: Record<RoleName, NavItem[]> = {
  ADMINISTRADOR: [
    { label: 'Resumen institucional', route: '/admin', eyebrow: 'Panel Principal' },

    // Módulo Gestión de Alumnos
    { label: 'Matrículas y Alumnos', route: '/admin/alumnos', eyebrow: 'Gestión de Alumnos' },

    // Módulo Personas y usuarios
    { label: 'Cuenta de usuarios', route: '/admin/usuarios', eyebrow: 'Personas y usuarios' },
    { label: 'Roles', route: '/admin/roles', eyebrow: 'Personas y usuarios' },
    { label: 'Auditorias', route: '/admin/auditorias', eyebrow: 'Personas y usuarios' },

    // Módulo Recursos Humanos y Familias
    { label: 'Personal', route: '/admin/personal', eyebrow: 'Recursos Humanos y Familia' },
    { label: 'Vínculos familiares', route: '/admin/familias', eyebrow: 'Recursos Humanos y Familia' },

    // Módulo Académico
    { label: 'Estructura académica', route: '/admin/academico', eyebrow: 'Gestión Académica' },
    { label: 'Gestiones y Periodos', route: '/admin/periodos', eyebrow: 'Gestión Académica' },
    { label: 'Asignaciones Docentes', route: '/admin/asignaciones', eyebrow: 'Gestión Académica' },

    // Módulo Notas
    { label: 'Supervisión docente', route: '/admin/supervision', eyebrow: 'Calificaciones' },
    { label: 'Importaciones Excel', route: '/admin/importaciones-notas', eyebrow: 'Calificaciones' },

    // Módulo Institución
    { label: 'Configuración', route: '/admin/configuracion', eyebrow: 'Institución' },
  ],
  DOCENTE: [
    { label: 'Carga docente', route: '/docente', eyebrow: 'Cursos' },
    { label: 'Acta de notas', route: '/docente/notas', eyebrow: 'Registro' },
    { label: 'Importacion Excel', route: '/docente/importar-notas', eyebrow: 'Carga' },
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
  animations: [routeAnimations, staggerNav, expandCollapse],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  prepareRoute(outlet: RouterOutlet): string {
    return outlet?.isActivated ? outlet.activatedRoute?.snapshot?.url?.join('/') ?? '' : '';
  }

  readonly session = this.auth.session;
  readonly activeRole = this.auth.activeRole;
  readonly roleLabels = ROLE_LABELS;
  readonly availableRoles = computed(() => this.auth.availableRoles());
  readonly navItems = computed(() => NAV_BY_ROLE[this.activeRole() ?? 'ADMINISTRADOR']);

  readonly navGroups = computed<NavGroup[]>(() => {
    const items = this.navItems();
    const map = new Map<string, NavItem[]>();
    for (const item of items) {
      const moduleName = item.eyebrow || 'General';
      if (!map.has(moduleName)) {
        map.set(moduleName, []);
      }
      map.get(moduleName)!.push(item);
    }
    return Array.from(map.entries()).map(([module, subitems]) => ({
      module,
      items: subitems
    }));
  });

  readonly expandedModules = signal<Record<string, boolean>>({});
  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(isOpen => !isOpen);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleModule(module: string): void {
    this.expandedModules.update(state => ({
      ...state,
      [module]: !state[module]
    }));
  }

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
