import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PortalService } from '../../core/portal.service';
import { ROLE_HOME, ROLE_LABELS, RoleName, InstitutionConfig } from '../../core/models';
import { expandCollapse, routeAnimations, staggerNav } from '../../core/animations';

interface NavItem {
  label: string;
  route: string;
  eyebrow: string;
  icon?: string;
  queryParams?: Record<string, string>;
}

interface NavGroup {
  module: string;
  items: NavItem[];
}

const NAV_BY_ROLE: Record<RoleName, NavItem[]> = {
  ADMINISTRADOR: [
    // 1. Panel Principal
    { label: 'Resumen institucional', route: '/admin', eyebrow: 'Panel Principal' },

    // 2. Comunidad
    { label: 'Directorio de Alumnos', route: '/admin/alumnos/directorio', eyebrow: 'Comunidad' },
    { label: 'Proceso de Matrículas', route: '/admin/alumnos/matriculas', eyebrow: 'Comunidad' },
    { label: 'Personal y Docentes', route: '/admin/personal/general', eyebrow: 'Comunidad' },
    { label: 'Vínculos Familiares', route: '/admin/familias', eyebrow: 'Comunidad' },
    { label: 'Cuentas de Usuarios', route: '/admin/usuarios', eyebrow: 'Comunidad' },

    // 3. Planificación Académica
    { label: 'Resumen Académico', route: '/admin/academico/resumen', eyebrow: 'Planificación Académica' },
    { label: 'Niveles Educativos', route: '/admin/academico/niveles', eyebrow: 'Planificación Académica' },
    { label: 'Grados y Salones', route: '/admin/academico/grados', eyebrow: 'Planificación Académica' },
    { label: 'Materias y Cursos', route: '/admin/academico/materias', eyebrow: 'Planificación Académica' },
    { label: 'Gestiones y Periodos', route: '/admin/periodos', eyebrow: 'Planificación Académica' },
    { label: 'Asignaciones Docentes', route: '/admin/asignaciones', eyebrow: 'Planificación Académica' },

    // 4. Calificaciones
    { label: 'Supervisión Docente', route: '/admin/supervision', eyebrow: 'Calificaciones' },
    { label: 'Importación Masiva Excel', route: '/admin/importaciones-notas', eyebrow: 'Calificaciones' },

    // 5. Ajustes del Sistema
    { label: 'Configuración Institucional', route: '/admin/configuracion', eyebrow: 'Ajustes del Sistema' },
    { label: 'Historial de Auditoría', route: '/admin/auditorias', eyebrow: 'Ajustes del Sistema' },
  ],
  DOCENTE: [
    { label: 'Carga docente', route: '/docente', eyebrow: 'Portal Docente' },
    { label: 'Acta de notas', route: '/docente/notas', eyebrow: 'Portal Docente' },
    { label: 'Importación Excel', route: '/docente/importar-notas', eyebrow: 'Portal Docente' },
  ],
  ESTUDIANTE: [
    { label: 'Dashboard', route: '/estudiante', eyebrow: 'Portal Estudiante' },
    { label: 'Notas por Competencia', route: '/estudiante/notas-competencia', eyebrow: 'Portal Estudiante' },
    { label: 'Mis Apoderados', route: '/estudiante/apoderados', eyebrow: 'Portal Estudiante' },
    { label: 'Mis Matrículas', route: '/estudiante/matriculas', eyebrow: 'Portal Estudiante' },
  ],
  PADRE_FAMILIA: [
    { label: 'Cambiar Estudiante', route: '/familia/selector', eyebrow: 'Portal Familia', icon: 'users' },
    { label: 'Resumen del Estudiante', route: '/familia/resumen', eyebrow: 'Portal Familia' },
    { label: 'Alertas Académicas', route: '/familia/alertas', eyebrow: 'Portal Familia' },
    { label: 'Notas', route: '/familia/notas', eyebrow: 'Portal Familia' },
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
export class AcademicShell implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly portal = inject(PortalService);

  prepareRoute(outlet: RouterOutlet): string {
    return outlet?.isActivated ? outlet.activatedRoute?.snapshot?.url?.join('/') ?? '' : '';
  }

  readonly session = this.auth.session;
  readonly activeRole = this.auth.activeRole;
  readonly roleLabels = ROLE_LABELS;
  readonly availableRoles = computed(() => this.auth.availableRoles());
  readonly navItems = computed(() => {
    const role = this.activeRole();
    return role ? NAV_BY_ROLE[role] : [];
  });

  // Reactive state for current period
  readonly activeGestionName = signal('Cargando...');
  readonly activePeriodName = signal('...');

  // Institutional config
  readonly institutionConfig = signal<InstitutionConfig | null>(null);

  ngOnInit() {
    this.loadActivePeriod();
    window.addEventListener('gestionChanged', () => {
      this.loadActivePeriod();
    });
    this.loadInstitutionConfig();
    window.addEventListener('institutionConfigChanged', () => {
      this.loadInstitutionConfig();
    });
  }

  private loadInstitutionConfig() {
    this.portal.getInstitutionConfigBase().subscribe({
      next: (config) => this.institutionConfig.set(config),
      error: () => this.institutionConfig.set(null),
    });
  }

  readonly isSidebarCollapsed = signal(false);

  toggleSidebarCollapse(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  private loadActivePeriod() {
    this.portal.getGestiones().subscribe({
      next: (gestiones) => {
        const activa = gestiones.find(g => g.activa) || gestiones[0];
        if (activa) {
          this.activeGestionName.set(activa.nombre || activa.anio.toString());
          this.portal.getPeriodos(activa.id).subscribe({
            next: (periodos) => {
              const per = periodos.find(p => !p.cerrado) || periodos[0];
              this.activePeriodName.set(per ? per.nombre : 'Sin periodo abierto');
            }
          });
        } else {
          this.activeGestionName.set('Sin Gestión');
          this.activePeriodName.set('-');
        }
      },
      error: () => {
        this.activeGestionName.set('Error');
        this.activePeriodName.set('No se pudo cargar');
      }
    });
  }

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

  readonly expandedModules = signal<Record<string, boolean>>({
    'Panel Principal': true,
    'Comunidad': true,
    'Planificación Académica': true,
    'Calificaciones': true,
    'Ajustes del Sistema': true,
    'Portal Docente': true,
    'Portal Estudiante': true,
    'Portal Familia': true,
  });
  readonly isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleModule(module: string): void {
    if (this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(false);
    }
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

  goToProfile(): void {
    if (this.activeRole() === 'ESTUDIANTE') {
      void this.router.navigate(['/estudiante/perfil']);
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
