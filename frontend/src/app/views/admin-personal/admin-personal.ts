import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { PortalService } from '../../core/portal.service';
import { PersonaResponse, PersonaRequest } from '../../core/models';
import { fadeIn } from '../../core/animations';

type Tab = 'general' | 'docentes' | 'administrativos' | 'familias';

@Component({
  selector: 'app-admin-personal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-personal.html',
  styleUrl: './admin-personal.css',
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPersonal {
  private readonly portal = inject(PortalService);

  readonly activeTab = signal<Tab>('general');
  readonly personas = signal<PersonaResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMsg = signal('');
  readonly searchQuery = signal('');
  readonly isAdding = signal(false);
  readonly editingPersona = signal<PersonaResponse | null>(null);

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
      const matchSearch = p.nombres.toLowerCase().includes(q) ||
             p.apellidos.toLowerCase().includes(q) ||
             p.documentoIdentidad.toLowerCase().includes(q);
      return matchSearch;
    });
  });

  // --- AGRUPACIÓN ADMINISTRATIVOS ---
  readonly administrativosPorCargo = computed(() => {
    const admins = this.filteredPersonas().filter((p: PersonaResponse) => p.tipoPersona === 'ADMINISTRATIVO');
    const map = new Map<string, PersonaResponse[]>();
    for (const a of admins) {
      const cargo = a.cargo || 'Sin Cargo';
      if (!map.has(cargo)) map.set(cargo, []);
      map.get(cargo)!.push(a);
    }
    return map;
  });

  readonly formPersona = new FormGroup({
    tipoPersona: new FormControl('PERSONA', { nonNullable: true, validators: [Validators.required] }),
    nombres: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellidos: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    documentoIdentidad: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaNacimiento: new FormControl(''),
    direccion: new FormControl(''),
    telefono: new FormControl(''),
    correo: new FormControl('', [Validators.email]),
    codigo: new FormControl(''),
    cargo: new FormControl(''),
    especialidad: new FormControl(''),
    areaAcademica: new FormControl(''),
    ocupacion: new FormControl(''),
  });

  constructor() {
    this.loadPersonas();
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.cancelAdd();
    this.error.set('');
    this.successMsg.set('');
  }

  loadPersonas() {
    this.loading.set(true);
    this.portal.getPersonas().subscribe({
      next: (res) => {
        this.personas.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar la lista de personas.');
        this.loading.set(false);
      }
    });
  }

  openAdd(tipo: string) {
    this.isAdding.set(true);
    this.editingPersona.set(null);
    this.formPersona.reset({ tipoPersona: tipo });
  }

  openEdit(p: PersonaResponse) {
    this.isAdding.set(true);
    this.editingPersona.set(p);
    this.formPersona.reset({
      tipoPersona: p.tipoPersona,
      nombres: p.nombres,
      apellidos: p.apellidos,
      documentoIdentidad: p.documentoIdentidad,
      fechaNacimiento: p.fechaNacimiento || '',
      direccion: p.direccion || '',
      telefono: p.telefono || '',
      correo: p.correo || '',
      codigo: p.codigo || '',
      cargo: p.cargo || '',
      especialidad: p.especialidad || '',
      areaAcademica: p.areaAcademica || '',
      ocupacion: p.ocupacion || ''
    });
  }

  cancelAdd() {
    this.isAdding.set(false);
    this.editingPersona.set(null);
  }

  savePersona() {
    if (this.formPersona.invalid) {
      this.formPersona.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.successMsg.set('');
    const val = this.formPersona.value;
    const req: PersonaRequest = {
      tipoPersona: val.tipoPersona!,
      nombres: val.nombres!,
      apellidos: val.apellidos!,
      documentoIdentidad: val.documentoIdentidad!,
      fechaNacimiento: val.fechaNacimiento || undefined,
      direccion: val.direccion || undefined,
      telefono: val.telefono || undefined,
      correo: val.correo || undefined,
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
        this.cancelAdd();
        this.successMsg.set('Registro guardado exitosamente.');
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Error al guardar el registro.');
      }
    });
  }
}
