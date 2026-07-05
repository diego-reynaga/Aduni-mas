import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PortalService } from '../../core/portal.service';
import { fadeIn } from '../../core/animations';
import { EntityId, StudentAdminRequest, StudentAdminResponse } from '../../core/models';

type Tab = 'directorio' | 'matriculas';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-students.html',
  styleUrl: './admin-students.css',
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStudents {
  private readonly portal = inject(PortalService);

  readonly activeTab = signal<Tab>('directorio');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  // Directorio State
  readonly estudiantes = signal<StudentAdminResponse[]>([]);
  readonly searchControl = new FormControl('');
  // Modal de Alta Estudiante
  readonly showModalEstudiante = signal(false);
  readonly editingStudent = signal<StudentAdminResponse | null>(null);
  readonly formEstudiante = new FormGroup({
    nombres: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellidos: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipoDocumento: new FormControl('DNI', { nonNullable: true, validators: [Validators.required] }),
    documentoIdentidad: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    codigoEstudiante: new FormControl('', { nonNullable: true }),
    fechaNacimiento: new FormControl('', { nonNullable: true }),
    genero: new FormControl('', { nonNullable: true }),
    correo: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    telefono: new FormControl('', { nonNullable: true }),
    direccion: new FormControl('', { nonNullable: true }),
    activo: new FormControl(true, { nonNullable: true }),
  });

  // Matriculas Wizard State
  readonly showWizardMatricula = signal(false);
  readonly wizardStep = signal(1); // 1: Alumno, 2: Aula, 3: Confirmación
  readonly matriculas = signal<any[]>([]);
  readonly formMatricula = new FormGroup({
    estudianteId: new FormControl<EntityId | null>(null, Validators.required),
    gradoId: new FormControl<EntityId | null>(null, Validators.required),
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
        this.error.set(this.errorMessage(err, 'No se pudieron cargar los estudiantes.'));
        this.loading.set(false);
      }
    });
  }

  openModalEstudiante() {
    this.editingStudent.set(null);
    this.formEstudiante.reset({ tipoDocumento: 'DNI', activo: true });
    this.error.set('');
    this.success.set('');
    this.showModalEstudiante.set(true);
  }

  editEstudiante(student: StudentAdminResponse) {
    this.editingStudent.set(student);
    this.formEstudiante.reset({
      nombres: student.nombres,
      apellidos: student.apellidos,
      tipoDocumento: student.tipoDocumento || 'DNI',
      documentoIdentidad: student.documentoIdentidad,
      codigoEstudiante: student.codigoEstudiante,
      fechaNacimiento: student.fechaNacimiento || '',
      genero: student.genero || '',
      correo: student.correo || '',
      telefono: student.telefono || '',
      direccion: student.direccion || '',
      activo: student.activo,
    });
    this.showModalEstudiante.set(true);
  }

  saveEstudiante() {
    if (this.formEstudiante.invalid) {
      this.formEstudiante.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    const edit = this.editingStudent();
    const request: StudentAdminRequest = this.formEstudiante.getRawValue();
    const action = edit ? this.portal.actualizarEstudiante(edit.id, request) : this.portal.crearEstudiante(request);
    action.subscribe({
      next: () => {
        this.loading.set(false);
        this.showModalEstudiante.set(false);
        this.loadEstudiantes();
        this.editingStudent.set(null);
        this.success.set(edit ? 'Estudiante actualizado con éxito.' : 'Estudiante registrado con éxito.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.errorMessage(err, 'No se pudo guardar el estudiante.'));
      }
    });
  }

  desactivarEstudiante(student: StudentAdminResponse) {
    if (!confirm(`¿Desactivar a ${student.nombres} ${student.apellidos}?`)) return;
    this.portal.desactivarEstudiante(student.id).subscribe({
      next: () => { this.success.set('Estudiante desactivado.'); this.loadEstudiantes(); },
      error: err => this.error.set(this.errorMessage(err, 'No se pudo desactivar al estudiante.')),
    });
  }

  activarEstudiante(student: StudentAdminResponse) {
    this.portal.activarEstudiante(student.id).subscribe({
      next: () => { this.success.set('Estudiante activado.'); this.loadEstudiantes(); },
      error: err => this.error.set(this.errorMessage(err, 'No se pudo activar al estudiante.')),
    });
  }

  // --- MATRICULAS WIZARD ---
  loadMatriculas() {
    this.portal.listarMatriculas().subscribe({
      next: res => this.matriculas.set(res),
      error: err => this.error.set(this.errorMessage(err, 'No se pudieron cargar las matrículas.')),
    });
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
        this.error.set(this.errorMessage(err, 'No se pudo completar la matrícula.'));
      }
    });
  }

  cambiarEstadoMatricula(id: EntityId, nuevoEstado: string) {
    if (!confirm(`¿Está seguro de cambiar el estado a ${nuevoEstado}?`)) return;
    this.loading.set(true);
    this.portal.cambiarEstadoMatricula(id, nuevoEstado).subscribe({
      next: () => {
        this.loading.set(false);
        this.loadMatriculas();
        this.success.set(`Estado actualizado a ${nuevoEstado}`);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.errorMessage(err, 'No se pudo actualizar el estado de la matrícula.'));
      }
    });
  }

  private errorMessage(error: unknown, fallback: string): string {
    const candidate = error as { message?: string; error?: string | { message?: string } };
    if (candidate?.message) return candidate.message;
    if (typeof candidate?.error === 'string') return candidate.error;
    return candidate?.error?.message || fallback;
  }
}
