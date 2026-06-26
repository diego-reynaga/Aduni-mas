import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PortalService } from '../../core/portal.service';
import { PadreFamiliaResponse } from '../../core/models';

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
  
  // Detail & Edition
  readonly editMode = signal(false);
  readonly editandoId = signal<number | null>(null);
  readonly selectedStudent = signal<any | null>(null);
  readonly showDetail = signal(false);
  readonly apoderados = signal<any[]>([]);
  readonly matriculasEstudiante = signal<any[]>([]);
  
  // Apoderados Modals
  readonly showAssignApoderado = signal(false);
  readonly showEditApoderado = signal(false);
  readonly editApoderadoId = signal<number | null>(null);
  readonly searchApoderadoControl = new FormControl('');
  readonly apoderadosDisponibles = signal<PadreFamiliaResponse[]>([]);
  
  readonly formApoderado = new FormGroup({
    padreFamiliaId: new FormControl<number | null>(null, Validators.required),
    parentesco: new FormControl('', Validators.required),
    principal: new FormControl(false)
  });
  
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
    this.editMode.set(false);
    this.editandoId.set(null);
    this.formEstudiante.reset();
    this.showModalEstudiante.set(true);
  }

  openEditStudent(student: any) {
    this.editMode.set(true);
    this.editandoId.set(student.id);
    this.formEstudiante.patchValue(student);
    this.showModalEstudiante.set(true);
  }

  saveEstudianteAction() {
    if (this.editMode()) {
      this.updateStudent();
    } else {
      this.saveEstudiante();
    }
  }

  updateStudent() {
    if (this.formEstudiante.invalid) return;
    this.loading.set(true);
    this.portal.actualizarEstudiante(this.editandoId()!, this.formEstudiante.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.showModalEstudiante.set(false);
        this.loadEstudiantes();
        this.success.set('Estudiante actualizado con éxito.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error || 'Error al actualizar estudiante');
      }
    });
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

  // --- DETALLE ESTUDIANTE ---
  viewDetail(student: any) {
    this.selectedStudent.set(student);
    this.showDetail.set(true);
    this.loadApoderados(student.id);
    this.loadMatriculasEstudiante(student.id);
  }

  loadApoderados(estudianteId: number) {
    this.portal.getApoderados(estudianteId).subscribe(res => this.apoderados.set(res));
  }

  loadMatriculasEstudiante(estudianteId: number) {
    this.portal.listarMatriculasPorEstudiante(estudianteId).subscribe(res => this.matriculasEstudiante.set(res));
  }

  searchApoderados() {
    const val = this.searchApoderadoControl.value;
    if (!val) return;
    this.portal.buscarApoderados(val).subscribe(res => this.apoderadosDisponibles.set(res));
  }

  openAssignApoderado() {
    this.formApoderado.reset({ principal: false });
    this.searchApoderadoControl.reset('');
    this.apoderadosDisponibles.set([]);
    this.showAssignApoderado.set(true);
  }

  assignApoderado() {
    if (this.formApoderado.invalid) return;
    const est = this.selectedStudent();
    if (!est) return;
    this.loading.set(true);
    const formVal = this.formApoderado.getRawValue();
    this.portal.asignarApoderado(est.id, formVal as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.showAssignApoderado.set(false);
        this.loadApoderados(est.id);
        this.success.set('Apoderado asignado con éxito');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Error al asignar apoderado');
      }
    });
  }

  removeApoderado(id: number) {
    if (!confirm('¿Está seguro de remover este apoderado?')) return;
    const est = this.selectedStudent();
    if (!est) return;
    this.loading.set(true);
    this.portal.removerApoderado(est.id, id).subscribe({
      next: () => {
        this.loading.set(false);
        this.loadApoderados(est.id);
        this.success.set('Apoderado removido');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Error al remover apoderado');
      }
    });
  }

  openEditApoderado(rel: any) {
    this.editApoderadoId.set(rel.id);
    this.formApoderado.patchValue({
      padreFamiliaId: rel.padreFamiliaId,
      parentesco: rel.parentesco,
      principal: rel.principal
    });
    this.showEditApoderado.set(true);
  }

  saveEditApoderado() {
    if (this.formApoderado.invalid) return;
    const est = this.selectedStudent();
    const relId = this.editApoderadoId();
    if (!est || !relId) return;
    this.loading.set(true);
    const formVal = this.formApoderado.getRawValue();
    this.portal.actualizarApoderado(est.id, relId, formVal as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.showEditApoderado.set(false);
        this.loadApoderados(est.id);
        this.success.set('Apoderado actualizado');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Error al actualizar apoderado');
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
