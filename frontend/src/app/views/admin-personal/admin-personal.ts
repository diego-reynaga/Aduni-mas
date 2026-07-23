import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PortalService } from '../../core/portal.service';
import { PersonaResponse, PersonaRequest } from '../../core/models';
import { fadeIn, staggerRows, staggerList, scaleInModal, slideAlert, tabTransition, slideInRight, counterAnimate } from '../../core/animations';
import { ConfirmationService } from '../../core/confirmation.service';

type Tab = 'general' | 'docentes' | 'administrativos' | 'familias';

@Component({
  selector: 'app-admin-personal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-personal.html',
  styleUrl: './admin-personal.css',
  animations: [fadeIn, staggerRows, staggerList, scaleInModal, slideAlert, tabTransition, slideInRight, counterAnimate],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPersonal {
  private readonly portal = inject(PortalService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly activeTab = signal<Tab>('general');
  readonly personas = signal<PersonaResponse[]>([]);
  readonly loading = signal(false);
  readonly toasts = signal<{id: number, msg: string, type: 'success' | 'error'}[]>([]);
  private toastIdCounter = 0;
  readonly searchQuery = signal('');
  readonly showModal = signal(false);
  readonly editingPersona = signal<PersonaResponse | null>(null);

  // --- KPIs ---
  readonly totalDocentes = computed(() => this.personas().filter(p => p.tipoPersona === 'DOCENTE').length);
  readonly totalAdministrativos = computed(() => this.personas().filter(p => p.tipoPersona === 'ADMINISTRATIVO').length);
  readonly totalFamilias = computed(() => this.personas().filter(p => p.tipoPersona === 'PADRE_FAMILIA').length);
  readonly totalEstudiantes = computed(() => this.personas().filter(p => p.tipoPersona === 'ESTUDIANTE').length);

  // --- Columnas dinámicas por pestaña ---
  readonly columns = computed(() => {
    switch (this.activeTab()) {
      case 'docentes':
        return [
          { key: 'documentoIdentidad', label: 'Documento' },
          { key: 'nombreCompleto', label: 'Nombre Completo' },
          { key: 'codigo', label: 'Código' },
          { key: 'especialidad', label: 'Especialidad' },
          { key: 'areaAcademica', label: 'Área Académica' },
          { key: 'correo', label: 'Correo' },
          { key: 'telefono', label: 'Teléfono' },
        ];
      case 'administrativos':
        return [
          { key: 'documentoIdentidad', label: 'Documento' },
          { key: 'nombreCompleto', label: 'Nombre Completo' },
          { key: 'codigo', label: 'Código' },
          { key: 'cargo', label: 'Cargo' },
          { key: 'correo', label: 'Correo' },
          { key: 'telefono', label: 'Teléfono' },
        ];
      case 'familias':
        return [
          { key: 'documentoIdentidad', label: 'Documento' },
          { key: 'nombreCompleto', label: 'Nombre Completo' },
          { key: 'ocupacion', label: 'Ocupación' },
          { key: 'correo', label: 'Correo' },
          { key: 'telefono', label: 'Teléfono' },
        ];
      default:
        return [
          { key: 'documentoIdentidad', label: 'Documento' },
          { key: 'nombreCompleto', label: 'Nombre Completo' },
          { key: 'tipoPersona', label: 'Tipo' },
          { key: 'correo', label: 'Correo' },
          { key: 'telefono', label: 'Teléfono' },
          { key: 'fechaNacimiento', label: 'F. Nacimiento' },
        ];
    }
  });

  readonly modalTitle = computed(() => {
    const prefix = this.editingPersona() ? 'Editar' : 'Nuevo';
    const labels: Record<Tab, string> = {
      general: 'Persona',
      docentes: 'Docente',
      administrativos: 'Administrativo',
      familias: 'Apoderado',
    };
    return `${prefix} ${labels[this.activeTab()]}`;
  });

  readonly filteredPersonas = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const tab = this.activeTab();
    return this.personas().filter(p => {
      const matchTab = tab === 'general' ||
                       (tab === 'docentes' && p.tipoPersona === 'DOCENTE') ||
                       (tab === 'administrativos' && p.tipoPersona === 'ADMINISTRATIVO') ||
                       (tab === 'familias' && p.tipoPersona === 'PADRE_FAMILIA');
      if (!matchTab) return false;
      if (!q) return true;
      const baseSearch = p.nombres.toLowerCase().includes(q) ||
                         p.apellidos.toLowerCase().includes(q) ||
                         p.documentoIdentidad.toLowerCase().includes(q) ||
                         (p.correo || '').toLowerCase().includes(q) ||
                         (p.telefono || '').toLowerCase().includes(q);
      const specificSearch = tab === 'docentes'
        ? (p.codigo || '').toLowerCase().includes(q) ||
          (p.especialidad || '').toLowerCase().includes(q) ||
          (p.areaAcademica || '').toLowerCase().includes(q)
        : tab === 'administrativos'
        ? (p.codigo || '').toLowerCase().includes(q) ||
          (p.cargo || '').toLowerCase().includes(q)
        : tab === 'familias'
        ? (p.ocupacion || '').toLowerCase().includes(q)
        : false;
      return baseSearch || specificSearch;
    });
  });

  readonly administrativosPorCargo = computed(() => {
    const admins = this.personas().filter(p => p.tipoPersona === 'ADMINISTRATIVO');
    const q = this.searchQuery().toLowerCase();
    const filtered = q ? admins.filter(a =>
      a.nombres.toLowerCase().includes(q) ||
      a.apellidos.toLowerCase().includes(q) ||
      a.documentoIdentidad.toLowerCase().includes(q) ||
      (a.codigo || '').toLowerCase().includes(q) ||
      (a.cargo || '').toLowerCase().includes(q) ||
      (a.correo || '').toLowerCase().includes(q) ||
      (a.telefono || '').toLowerCase().includes(q)
    ) : admins;
    const map = new Map<string, PersonaResponse[]>();
    for (const a of filtered) {
      const cargo = a.cargo || 'Sin Cargo';
      if (!map.has(cargo)) map.set(cargo, []);
      map.get(cargo)!.push(a);
    }
    return map;
  });

  readonly formPersona = new FormGroup({
    tipoPersona: new FormControl('PERSONA', { nonNullable: true }),
    nombres: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellidos: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipoDocumento: new FormControl('DNI', { nonNullable: true }),
    documentoIdentidad: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaNacimiento: new FormControl(''),
    genero: new FormControl(''),
    direccion: new FormControl(''),
    telefono: new FormControl(''),
    correo: new FormControl('', [Validators.email]),
    activo: new FormControl(true, { nonNullable: true }),
    codigo: new FormControl(''),
    cargo: new FormControl(''),
    especialidad: new FormControl(''),
    areaAcademica: new FormControl(''),
    ocupacion: new FormControl(''),
  });

  constructor() {
    this.loadPersonas();
    this.route.data.subscribe(data => {
      const tab = data['tab'] as Tab;
      if (tab) {
        this.activeTab.set(tab);
      }
    });
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as Tab;
      if (tab && ['general', 'docentes', 'administrativos', 'familias'].includes(tab)) {
        this.activeTab.set(tab);
      }
    });
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.closeModal();
    void this.router.navigate(['/admin/personal', tab]);
  }

  showToast(msg: string, type: 'success' | 'error') {
    const id = this.toastIdCounter++;
    this.toasts.update(t => [...t, { id, msg, type }]);
    setTimeout(() => {
      this.toasts.update(t => t.filter(toast => toast.id !== id));
    }, 3000);
  }

  loadPersonas() {
    this.loading.set(true);
    this.portal.getPersonas().subscribe({
      next: (res) => {
        this.personas.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.showToast('Error al cargar la lista de personas.', 'error');
        this.loading.set(false);
      }
    });
  }

  openAdd() {
    const tipoMap: Record<Tab, string> = {
      general: 'PERSONA',
      docentes: 'DOCENTE',
      administrativos: 'ADMINISTRATIVO',
      familias: 'PADRE_FAMILIA',
    };
    this.editingPersona.set(null);
    this.formPersona.reset({ tipoPersona: tipoMap[this.activeTab()] });
    this.updateValidators();
    this.showModal.set(true);
  }

  openEdit(p: PersonaResponse) {
    this.editingPersona.set(p);
    this.formPersona.reset({
      tipoPersona: p.tipoPersona,
      nombres: p.nombres,
      apellidos: p.apellidos,
      tipoDocumento: p.tipoDocumento || 'DNI',
      documentoIdentidad: p.documentoIdentidad,
      fechaNacimiento: p.fechaNacimiento || '',
      genero: p.genero || '',
      direccion: p.direccion || '',
      telefono: p.telefono || '',
      correo: p.correo || '',
      activo: p.activo,
      codigo: p.codigo || '',
      cargo: p.cargo || '',
      especialidad: p.especialidad || '',
      areaAcademica: p.areaAcademica || '',
      ocupacion: p.ocupacion || ''
    });
    this.updateValidators();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingPersona.set(null);
  }

  private updateValidators() {
    const tab = this.activeTab();
    const codigoCtrl = this.formPersona.get('codigo');
    const cargoCtrl = this.formPersona.get('cargo');
    codigoCtrl?.clearValidators();
    cargoCtrl?.clearValidators();
    if (tab === 'docentes' || tab === 'administrativos') {
      codigoCtrl?.setValidators([Validators.required]);
    }
    if (tab === 'administrativos') {
      cargoCtrl?.setValidators([Validators.required]);
    }
    codigoCtrl?.updateValueAndValidity();
    cargoCtrl?.updateValueAndValidity();
  }

  savePersona() {
    if (this.formPersona.invalid) {
      this.formPersona.markAllAsTouched();
      return;
    }
    const val = this.formPersona.value;
    const req: PersonaRequest = {
      tipoPersona: val.tipoPersona!,
      nombres: val.nombres!,
      apellidos: val.apellidos!,
      tipoDocumento: val.tipoDocumento || 'DNI',
      documentoIdentidad: val.documentoIdentidad!,
      fechaNacimiento: val.fechaNacimiento || undefined,
      genero: val.genero || undefined,
      direccion: val.direccion || undefined,
      telefono: val.telefono || undefined,
      correo: val.correo || undefined,
      activo: val.activo ?? true,
      codigo: val.codigo || undefined,
      cargo: val.cargo || undefined,
      especialidad: val.especialidad || undefined,
      areaAcademica: val.areaAcademica || undefined,
      ocupacion: val.ocupacion || undefined
    };

    const edit = this.editingPersona();
    const obs = edit ? this.portal.updatePersona(edit.id, req) : this.portal.createPersona(req);

    obs.subscribe({
      next: () => {
        this.loadPersonas();
        this.closeModal();
        this.showToast('Registro guardado exitosamente.', 'success');
      },
      error: (err) => {
        this.showToast(err?.message || err?.error?.message || 'Error al guardar el registro.', 'error');
      }
    });
  }

  async desactivarPersona(p: PersonaResponse): Promise<void> {
    if (!await this.confirmation.confirm({ title: 'Desactivar persona', message: `${p.nombres} ${p.apellidos} dejará de estar activo en el sistema.`, confirmLabel: 'Desactivar', tone: 'danger' })) return;
    this.portal.deletePersona(p.id).subscribe({
      next: () => {
        this.loadPersonas();
        this.showToast('Persona desactivada.', 'success');
      },
      error: () => this.showToast('No se pudo desactivar la persona.', 'error'),
    });
  }

  activarPersona(p: PersonaResponse): void {
    this.portal.updatePersona(p.id, {
      tipoPersona: p.tipoPersona,
      nombres: p.nombres,
      apellidos: p.apellidos,
      tipoDocumento: p.tipoDocumento,
      documentoIdentidad: p.documentoIdentidad,
      fechaNacimiento: p.fechaNacimiento,
      genero: p.genero,
      direccion: p.direccion,
      telefono: p.telefono,
      correo: p.correo,
      activo: true,
      codigo: p.codigo,
      cargo: p.cargo,
      especialidad: p.especialidad,
      areaAcademica: p.areaAcademica,
      ocupacion: p.ocupacion,
    }).subscribe({
      next: () => {
        this.loadPersonas();
        this.showToast('Persona activada.', 'success');
      },
      error: () => this.showToast('No se pudo activar la persona.', 'error'),
    });
  }
}
