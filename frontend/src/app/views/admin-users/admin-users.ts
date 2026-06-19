import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ROLE_LABELS, RoleName, UserRow, PersonaDropdown, RolResponse, ALL_ROLES, UsuarioRequest, AuditoriaResponse } from '../../core/models';
import { PortalService } from '../../core/portal.service';


@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers {
  private readonly portal = inject(PortalService);

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
  readonly editingUserId = signal<number | null>(null);
  
  // Modales Rol
  readonly showRoleModal = signal(false);

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
    personaId: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    roles: new FormControl<string[]>([], {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  // Formulario de Rol
  readonly roleForm = new FormGroup({
    nombre: new FormControl('', {
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
    this.loadData();
  }

  loadData(): void {
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
      next: (personas) => this.personas.set(personas),
      error: () => this.error.set('No se pudo cargar el listado de personas disponibles.'),
    });
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
    this.portal.getAuditorias({
      usuario: this.auditUserQuery(),
      accion: this.auditActionFilter(),
      entidad: this.auditEntityFilter(),
      fechaInicio: this.auditDateInicio(),
      fechaFin: this.auditDateFin()
    }).subscribe({
      next: (data) => this.auditoriasList.set(data),
      error: () => this.error.set('No se pudo cargar el historial de auditorías.')
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
      return 'status-pill is-good';
    }
    if (status === 'Pendiente') {
      return 'status-pill is-warning';
    }
    return 'status-pill is-danger';
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
    
    this.userForm.controls.password.setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)
    ]);
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

  onRoleToggle(role: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedRoles.update((prev) => [...prev, role]);
    } else {
      this.selectedRoles.update((prev) => prev.filter((r) => r !== role));
    }
    this.userForm.controls.roles.setValue(this.selectedRoles());
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formVal = this.userForm.getRawValue();
    const req: UsuarioRequest = {
      username: formVal.username,
      personaId: formVal.personaId!,
      roles: formVal.roles,
      password: formVal.password || undefined,
    };

    const action = this.isEditingUser()
      ? this.portal.updateUser(this.editingUserId()!, req)
      : this.portal.createUser(req);

    action.subscribe({
      next: () => {
        this.successMessage.set(
          this.isEditingUser() ? 'Cuenta de usuario actualizada exitosamente.' : 'Cuenta de usuario creada exitosamente.'
        );
        this.showUserModal.set(false);
        this.loadData();
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Hubo un problema al intentar guardar la cuenta.');
      },
    });
  }

  deactivateUser(userRow: UserRow): void {
    if (!confirm(`¿Está seguro de desactivar la cuenta del usuario: "${userRow.persona}"?`)) {
      return;
    }
    const id = userRow.id;
    if (!id) return;

    this.portal.deleteUser(id).subscribe({
      next: () => {
        this.successMessage.set('Cuenta desactivada exitosamente.');
        this.loadData();
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: () => this.error.set('No se pudo desactivar la cuenta del usuario.'),
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
        this.successMessage.set('Cuenta reactivada exitosamente.');
        this.loadData();
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: () => this.error.set('No se pudo reactivar la cuenta del usuario.'),
    });
  }

  // --- Operaciones de Rol ---

  openAddRoleModal(): void {
    this.error.set('');
    this.roleForm.reset({ nombre: '' });
    this.showRoleModal.set(true);
  }

  saveRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const req = {
      nombre: this.roleForm.value.nombre!,
    };

    this.portal.createRole(req).subscribe({
      next: () => {
        this.successMessage.set('Rol registrado exitosamente.');
        this.showRoleModal.set(false);
        this.loadData();
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'No se pudo registrar el rol en la base de datos.');
      },
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
        this.successMessage.set('Rol eliminado exitosamente.');
        this.loadData();
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.error.set(
          err.error?.message || 'No es posible eliminar el rol porque está asignado a cuentas activas.'
        );
      },
    });
  }

  // (Lógica de personas eliminada porque se migró al componente admin-personal)
}
