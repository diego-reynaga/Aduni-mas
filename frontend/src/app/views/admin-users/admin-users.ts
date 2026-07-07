import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EntityId, ROLE_LABELS, RoleName, UserRow, PersonaDropdown, RolResponse, ALL_ROLES, UsuarioRequest, AuditoriaResponse } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import {
  fadeIn, staggerRows, slideInRight, slideAlert,
  scaleInModal, tabTransition, counterAnimate, expandCollapse
} from '../../core/animations';


@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
  animations: [fadeIn, staggerRows, slideInRight, slideAlert, scaleInModal, tabTransition, counterAnimate, expandCollapse],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers {
  private readonly portal = inject(PortalService);
  private readonly route = inject(ActivatedRoute);

  readonly users = signal<UserRow[]>([]);
  readonly personas = signal<PersonaDropdown[]>([]);
  readonly rolesList = signal<RolResponse[]>([]);
  readonly roleLabels = ROLE_LABELS;
  readonly allRoles = ALL_ROLES;
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly activeTab = signal<'usuarios' | 'roles' | 'auditoria'>('usuarios');
  readonly searchQuery = signal('');

  // Filtros avanzados de Usuarios
  readonly filterEstado = signal<'TODOS' | 'Activo' | 'Inactivo'>('TODOS');
  readonly filterRol = signal<'TODOS' | RoleName>('TODOS');

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly alertType = signal<'success' | 'error'>('success');
  private readonly searchTimer = signal<ReturnType<typeof setTimeout> | null>(null);

  // Fuerza de contraseña
  readonly passwordStrength = signal(0); // 0=vacío, 1=débil, 2=media, 3=fuerte
  readonly passwordStrengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s === 0) return '';
    if (s === 1) return 'Débil';
    if (s === 2) return 'Media';
    return 'Fuerte';
  });
  readonly passwordStrengthClass = computed(() => {
    const s = this.passwordStrength();
    if (s === 1) return 'strength-weak';
    if (s === 2) return 'strength-medium';
    if (s === 3) return 'strength-strong';
    return '';
  });

  // Roles inmutables del sistema (no se pueden eliminar)
  readonly SYSTEM_ROLES: RoleName[] = ['ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', 'PADRE_FAMILIA'];


  // Auditoria signals
  readonly auditoriasList = signal<AuditoriaResponse[]>([]);
  readonly auditLoading = signal(false);
  readonly auditUserQuery = signal('');
  readonly auditActionFilter = signal('TODAS');
  readonly auditEntityFilter = signal('TODAS');
  readonly auditDateInicio = signal('');
  readonly auditDateFin = signal('');
  readonly showAuditDetailModal = signal(false);
  readonly selectedAudit = signal<AuditoriaResponse | null>(null);

  readonly parsedDetail = computed(() => {
    const audit = this.selectedAudit();
    if (!audit || !audit.detalle) return null;
    try {
      return JSON.parse(audit.detalle);
    } catch (e) {
      return { raw: audit.detalle };
    }
  });


  // Modales Usuario
  readonly showUserModal = signal(false);
  readonly isEditingUser = signal(false);
  readonly editingUserId = signal<EntityId | null>(null);
  // Formulario de Usuario
  readonly selectedRoles = signal<string[]>([]);
  readonly userForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    password: new FormControl('', {
      nonNullable: true,
    }),
    personaId: new FormControl<EntityId | null>(null, {
      validators: [Validators.required],
    }),
    roles: new FormControl<string[]>([], {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

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

  // KPIs para Roles
  readonly totalRoles = computed(() => this.rolesList().length);
  readonly totalSystemRoles = computed(() => this.rolesList().filter(r => this.isSystemRole(r.nombre)).length);
  readonly totalCustomRoles = computed(() => this.rolesList().filter(r => !this.isSystemRole(r.nombre)).length);

  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const estado = this.filterEstado();
    const rol = this.filterRol();

    return this.users().filter((u) => {
      const matchesQuery = !query ||
        u.persona.toLowerCase().includes(query) ||
        u.codigo.toLowerCase().includes(query) ||
        u.correo.toLowerCase().includes(query) ||
        ROLE_LABELS[u.rol]?.toLowerCase().includes(query);

      const matchesEstado = estado === 'TODOS' || u.estado === estado;
      const matchesRol = rol === 'TODOS' || u.rol === rol;

      return matchesQuery && matchesEstado && matchesRol;
    });
  });

  constructor() {
    this.route.data.subscribe(data => {
      const tab = data['tab'] as 'usuarios' | 'roles' | 'auditoria';
      if (tab) {
        this.setTab(tab);
      }
    });
    this.loadData();
  }

  private showAlertMsg(message: string, type: 'success' | 'error'): void {
    this.alertType.set(type);
    if (type === 'success') {
      this.successMessage.set(message);
    } else {
      this.error.set(message);
    }
    setTimeout(() => {
      if (type === 'success') this.successMessage.set('');
      else this.error.set('');
    }, 4000);
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');

    this.portal.adminUsers().subscribe({
      next: (users) => this.users.set(users),
      error: () => this.error.set('No se pudo cargar el directorio de usuarios.'),
    });

    this.portal.getRoles().subscribe({
      next: (roles) => this.rolesList.set(roles),
      error: () => this.error.set('No se pudieron cargar los roles de la base de datos.'),
    });

    this.portal.getPersonasDropdown().subscribe({
      next: (personas) => { this.personas.set(personas); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el listado de personas disponibles.'); this.loading.set(false); },
    });
  }

  onSearchInput(value: string): void {
    const timer = this.searchTimer();
    if (timer) clearTimeout(timer);
    this.searchTimer.set(setTimeout(() => {
      this.searchQuery.set(value);
    }, 300));
  }

  setTab(tab: 'usuarios' | 'roles' | 'auditoria'): void {
    this.activeTab.set(tab);
    this.error.set('');
    this.successMessage.set('');
    if (tab === 'auditoria') {
      this.loadAudits();
    }
  }

  loadAudits(): void {
    this.error.set('');
    this.auditLoading.set(true);
    this.portal.getAuditorias({
      usuario: this.auditUserQuery() || undefined,
      accion: this.auditActionFilter() === 'TODAS' ? undefined : this.auditActionFilter(),
      entidad: this.auditEntityFilter() === 'TODAS' ? undefined : this.auditEntityFilter(),
      fechaInicio: this.auditDateInicio() || undefined,
      fechaFin: this.auditDateFin() || undefined
    }).subscribe({
      next: (data) => { this.auditoriasList.set(data); this.auditLoading.set(false); },
      error: (err) => {
        console.error('Error al cargar auditorías:', err);
        this.error.set('No se pudo cargar el historial de auditorías.');
        this.auditLoading.set(false);
      }
    });
  }

  openAuditDetailModal(audit: AuditoriaResponse): void {
    this.selectedAudit.set(audit);
    this.showAuditDetailModal.set(true);
  }

  getDiffKeys(): string[] {
    const parsed = this.parsedDetail();
    if (!parsed) return [];
    const antes = parsed.antes || {};
    const despues = parsed.despues || {};
    const keys = new Set([...Object.keys(antes), ...Object.keys(despues)]);
    return Array.from(keys);
  }

  getBeforeVal(key: string): string {
    const parsed = this.parsedDetail();
    if (!parsed || !parsed.antes) return '-';
    const val = parsed.antes[key];
    if (val === undefined || val === null) return '-';
    return typeof val === 'object' ? JSON.stringify(val) : String(val);
  }

  getAfterVal(key: string): string {
    const parsed = this.parsedDetail();
    if (!parsed || !parsed.despues) return '-';
    const val = parsed.despues[key];
    if (val === undefined || val === null) return '-';
    return typeof val === 'object' ? JSON.stringify(val) : String(val);
  }

  isKeyChanged(key: string): boolean {
    const antesVal = this.getBeforeVal(key);
    const despuesVal = this.getAfterVal(key);
    return antesVal !== despuesVal;
  }

  statusClass(status: string): string {
    if (status === 'Activo') {
      return 'status-pill-premium is-active';
    }
    return 'status-pill-premium is-inactive';
  }

  getRoleLabel(roleName: string): string {
    const key = roleName.toUpperCase() as RoleName;
    return this.roleLabels[key] || roleName;
  }

  // --- Operaciones de Usuario ---
  openAddUserModal(): void {
    this.error.set('');
    this.isEditingUser.set(false);
    this.editingUserId.set(null);
    this.selectedRoles.set([]);
    this.userForm.reset({
      username: '',
      password: '',
      personaId: null,
      roles: [],
    });
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.updateValueAndValidity();
    this.passwordStrength.set(0);
    this.showUserModal.set(true);
  }

  onPasswordInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (!val) { this.passwordStrength.set(0); return; }
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/\d/.test(val) && /[@$!%*?&]/.test(val)) score++;
    this.passwordStrength.set(score);
  }

  openEditUserModal(userRow: UserRow): void {
    this.error.set('');
    const id = userRow.id;
    if (!id) return;

    this.isEditingUser.set(true);
    this.editingUserId.set(id);
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.updateValueAndValidity();
    this.passwordStrength.set(0);

    this.portal.getUser(id).subscribe({
      next: (user) => {
        this.selectedRoles.set(user.roles);
        this.userForm.reset({
          username: user.username,
          password: '',
          personaId: user.personaId,
          roles: user.roles,
        });
        this.showUserModal.set(true);
      },
      error: () => this.error.set('No se pudieron obtener los detalles de la cuenta de usuario.'),
    });
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles().includes(role);
  }

  onRoleToggle(role: RoleName, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedRoles.set([role]);
    } else {
      this.selectedRoles.set([]);
    }
    this.userForm.controls.roles.setValue(this.selectedRoles());
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formVal = this.userForm.getRawValue();

    this.executeSaveUser(formVal.personaId!, formVal);
  }

  onPersonaSelected(event: Event): void {
    const personaId = (event.target as HTMLSelectElement).value;
    const persona = this.personas().find((item) => item.id === personaId);
    if (!persona) return;
    this.userForm.controls.username.setValue(persona.correo || '');
  }

  private executeSaveUser(personaId: EntityId, formVal: any): void {
    const req: UsuarioRequest = {
      username: formVal.username || '',
      personaId,
      roles: formVal.roles,
      password: formVal.password || undefined,
    };

    const action = this.isEditingUser()
      ? this.portal.updateUser(this.editingUserId()!, req)
      : this.portal.createUser(req);

    action.subscribe({
      next: () => {
        this.saving.set(false);
        this.showAlertMsg(
          this.isEditingUser()
            ? 'Cuenta de usuario actualizada exitosamente.'
            : 'Usuario creado. Credenciales iniciales: correo y DNI.',
          'success'
        );
        this.showUserModal.set(false);
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.showAlertMsg(this.errorMessage(err, 'Hubo un problema al intentar guardar la cuenta.'), 'error');
      },
    });
  }

  private errorMessage(error: unknown, fallback: string): string {
    const candidate = error as { message?: string; error?: string | { message?: string } };
    if (candidate?.message) return candidate.message;
    if (typeof candidate?.error === 'string') return candidate.error;
    return candidate?.error?.message || fallback;
  }

  deactivateUser(userRow: UserRow): void {
    if (!confirm(`¿Está seguro de desactivar la cuenta del usuario: "${userRow.persona}"?`)) {
      return;
    }
    const id = userRow.id;
    if (!id) return;

    this.portal.deleteUser(id).subscribe({
      next: () => {
        this.showAlertMsg('Cuenta desactivada exitosamente.', 'success');
        this.loadData();
      },
      error: () => this.showAlertMsg('No se pudo desactivar la cuenta del usuario.', 'error'),
    });
  }

  activateUser(userRow: UserRow): void {
    if (!confirm(`¿Está seguro de reactivar la cuenta del usuario: "${userRow.persona}"?`)) {
      return;
    }
    const id = userRow.id;
    if (!id) return;

    this.portal.activateUser(id).subscribe({
      next: () => {
        this.showAlertMsg('Cuenta reactivada exitosamente.', 'success');
        this.loadData();
      },
      error: () => this.showAlertMsg('No se pudo reactivar la cuenta del usuario.', 'error'),
    });
  }

  isSystemRole(roleName: string): boolean {
    return (this.SYSTEM_ROLES as string[]).includes(roleName.toUpperCase());
  }

  deleteRole(role: RolResponse): void {
    if (!confirm(`¿Está seguro de eliminar de forma permanente el rol "${role.nombre}"?`)) {
      return;
    }

    this.portal.deleteRole(role.id).subscribe({
      next: () => {
        this.showAlertMsg('Rol eliminado exitosamente.', 'success');
        this.loadData();
      },
      error: (err) => {
        this.showAlertMsg(
          err.error?.message || 'No es posible eliminar el rol porque está asignado a cuentas activas.',
          'error'
        );
      },
    });
  }

  // (Lógica de personas eliminada porque se migró al componente admin-personal)
}
