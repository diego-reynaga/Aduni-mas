import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { PortalService } from '../../core/portal.service';
import { PersonaResponse, PersonaRequest, EstudianteApoderadoResponse, EstudianteApoderadoRequest } from '../../core/models';

type Tab = 'personas' | 'docentes' | 'administrativos' | 'estudiantes';

@Component({
  selector: 'app-admin-personal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-personal.html',
  styleUrl: './admin-personal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPersonal {
  private readonly portal = inject(PortalService);

  readonly activeTab = signal<Tab>('personas');
  readonly personas = signal<PersonaResponse[]>([]);
  readonly apoderados = signal<EstudianteApoderadoResponse[]>([]);
  readonly selectedEstudianteId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMsg = signal('');

  // --- FILTROS DE BÚSQUEDA ---
  readonly searchQuery = signal('');

  readonly filteredPersonas = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const tab = this.activeTab();
    return this.personas().filter(p => {
      const matchTab = tab === 'personas' ||
                       (tab === 'docentes' && p.tipoPersona === 'DOCENTE') ||
                       (tab === 'administrativos' && p.tipoPersona === 'ADMINISTRATIVO') ||
                       (tab === 'estudiantes' && p.tipoPersona === 'ESTUDIANTE');
      if (!matchTab) return false;

      if (!q) return true;
      return p.nombres.toLowerCase().includes(q) ||
             p.apellidos.toLowerCase().includes(q) ||
             p.documentoIdentidad.toLowerCase().includes(q);
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

  // Estados de formularios compartidos
  readonly isAdding = signal(false);
  readonly editingPersona = signal<PersonaResponse | null>(null);

  // Formulario Base de Persona (Manejando campos requeridos y tipos)
  readonly formPersona = new FormGroup({
    tipoPersona: new FormControl('PERSONA', { nonNullable: true, validators: [Validators.required] }),
    nombres: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellidos: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    documentoIdentidad: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaNacimiento: new FormControl(''),
    direccion: new FormControl(''),
    telefono: new FormControl(''),
    correo: new FormControl('', [Validators.email]),
    // Campos Específicos
    codigo: new FormControl(''),
    cargo: new FormControl(''),
    especialidad: new FormControl(''),
    areaAcademica: new FormControl(''),
    ocupacion: new FormControl(''),
  });

  // Formulario Vinculación Familiar
  readonly isAddingApoderado = signal(false);
  readonly formApoderado = new FormGroup({
    padreFamiliaId: new FormControl<number | null>(null, [Validators.required]),
    parentesco: new FormControl('', [Validators.required]),
    principal: new FormControl(false),
  });

  constructor() {
    this.loadPersonas();
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.cancelAdd();
    this.isAddingApoderado.set(false);
    this.selectedEstudianteId.set(null);
    this.apoderados.set([]);
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

  // --- Lógica de Apoderados ---
  selectEstudiante(id: number) {
    this.selectedEstudianteId.set(id);
    this.loadApoderados(id);
  }

  loadApoderados(id: number) {
    this.loading.set(true);
    this.portal.getApoderados(id).subscribe({
      next: (res) => {
        this.apoderados.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar apoderados.');
        this.loading.set(false);
      }
    });
  }

  openAddApoderado() {
    this.isAddingApoderado.set(true);
    this.formApoderado.reset({ principal: false });
  }

  cancelAddApoderado() {
    this.isAddingApoderado.set(false);
  }

  saveApoderado() {
    const eId = this.selectedEstudianteId();
    if (this.formApoderado.invalid || !eId) {
      this.formApoderado.markAllAsTouched();
      return;
    }

    const val = this.formApoderado.value;
    const req: EstudianteApoderadoRequest = {
      padreFamiliaId: val.padreFamiliaId!,
      parentesco: val.parentesco!,
      principal: val.principal || false
    };

    this.portal.asignarApoderado(eId, req).subscribe({
      next: () => {
        this.loadApoderados(eId);
        this.cancelAddApoderado();
        this.successMsg.set('Apoderado vinculado correctamente.');
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Error al vincular apoderado.');
      }
    });
  }
}
