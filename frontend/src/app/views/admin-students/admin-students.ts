import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PortalService } from '../../core/portal.service';

type Tab = 'directorio' | 'matriculas';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-students.html',
  styleUrl: './admin-students.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStudents {
  private readonly portal = inject(PortalService);

  readonly activeTab = signal<Tab>('directorio');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  // Directorio State
  readonly estudiantes = signal<any[]>([]);
  readonly searchControl = new FormControl('');
  
  // Modal de Alta Estudiante
  readonly showModalEstudiante = signal(false);
  readonly formEstudiante = new FormGroup({
    nombres: new FormControl('', Validators.required),
    apellidos: new FormControl('', Validators.required),
    documentoIdentidad: new FormControl('', Validators.required),
    fechaNacimiento: new FormControl(''),
    correo: new FormControl('', Validators.email),
    telefono: new FormControl(''),
    direccion: new FormControl('')
  });

  // Matriculas Wizard State
  readonly showWizardMatricula = signal(false);
  readonly wizardStep = signal(1); // 1: Alumno, 2: Aula, 3: Confirmación
  readonly matriculas = signal<any[]>([]);
  
  readonly formMatricula = new FormGroup({
    estudianteId: new FormControl<number | null>(null, Validators.required),
    gradoId: new FormControl<number | null>(null, Validators.required),
  });

  // Jerarquía Académica para el Wizard
  readonly niveles = signal<any[]>([]);
  readonly grados = signal<any[]>([]);

  constructor() {
    this.loadEstudiantes();
    
    this.searchControl.valueChanges.subscribe(val => {
      this.loadEstudiantes(val || '');
    });
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    if (tab === 'matriculas') {
      this.loadMatriculas();
    } else {
      this.loadEstudiantes();
    }
  }

  // --- DIRECTORIO ---
  loadEstudiantes(search: string = '') {
    this.loading.set(true);
    this.portal.buscarEstudiantes(search).subscribe({
      next: (res) => {
        this.estudiantes.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error("Error cargando estudiantes:", err);
        this.error.set("No se pudieron cargar los estudiantes.");
        this.loading.set(false);
      }
    });
  }

  openModalEstudiante() {
    this.formEstudiante.reset();
    this.showModalEstudiante.set(true);
  }

  saveEstudiante() {
    if (this.formEstudiante.invalid) return;
    this.loading.set(true);
    this.portal.crearEstudiante(this.formEstudiante.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.showModalEstudiante.set(false);
        this.loadEstudiantes();
        this.success.set('Estudiante registrado con éxito.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error || 'Error al crear estudiante');
      }
    });
  }

  // --- MATRICULAS WIZARD ---
  loadMatriculas() {
    this.portal.listarMatriculas().subscribe(res => this.matriculas.set(res));
  }

  startWizard() {
    this.wizardStep.set(1);
    this.formMatricula.reset();
    this.showWizardMatricula.set(true);
    this.portal.getNiveles().subscribe(res => this.niveles.set(res));
  }

  nextStep() {
    if (this.wizardStep() === 1 && !this.formMatricula.value.estudianteId) return;
    if (this.wizardStep() === 2 && !this.formMatricula.value.gradoId) return;
    this.wizardStep.update(s => s + 1);
  }

  prevStep() {
    this.wizardStep.update(s => s - 1);
  }

  onNivelSelected(event: any) {
    const id = event.target.value;
    if (id) {
      this.portal.getGrados(id).subscribe(res => this.grados.set(res));
    } else {
      this.grados.set([]);
    }
  }

  confirmMatricula() {
    this.loading.set(true);
    this.portal.matricularEstudiante(this.formMatricula.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.showWizardMatricula.set(false);
        this.loadMatriculas();
        this.success.set('Matrícula completada con éxito.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error || 'Error al matricular');
      }
    });
  }

  cambiarEstadoMatricula(id: number, nuevoEstado: string) {
    if (!confirm(`¿Está seguro de cambiar el estado a ${nuevoEstado}?`)) return;
    this.loading.set(true);
    this.portal.cambiarEstadoMatricula(id, nuevoEstado).subscribe({
      next: () => {
        this.loading.set(false);
        this.loadMatriculas();
        this.success.set(`Estado actualizado a ${nuevoEstado}`);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Error al actualizar el estado de la matrícula');
      }
    });
  }
}
