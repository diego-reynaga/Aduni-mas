import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PortalService } from '../../core/portal.service';
import { fadeIn, tabTransition, slideAlert, counterAnimate, slideInRight, scaleInModal, slideInUp, staggerList } from '../../core/animations';
import { EntityId, StudentAdminRequest, StudentAdminResponse } from '../../core/models';
import { ConfirmationService } from '../../core/confirmation.service';

type Tab = 'directorio' | 'matriculas';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-students.html',
  styleUrl: './admin-students.css',
  animations: [fadeIn, tabTransition, slideAlert, counterAnimate, slideInRight, scaleInModal, slideInUp, staggerList],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStudents {
  private readonly portal = inject(PortalService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<Tab>('directorio');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  // Directorio State
  readonly estudiantes = signal<StudentAdminResponse[]>([]);
  readonly searchControl = new FormControl('');

  // KPIs
  readonly totalEstudiantes = computed(() => this.estudiantes().length);
  readonly activosEstudiantes = computed(() => this.estudiantes().filter(e => e.activo).length);
  readonly inactivasEstudiantes = computed(() => this.totalEstudiantes() - this.activosEstudiantes());

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
  readonly matriculasSearchControl = new FormControl('');
  readonly wizardStudentSearch = new FormControl('');
  
  readonly filteredMatriculas = computed(() => {
    const term = (this.matriculasSearchControl.value || '').toLowerCase().trim();
    const list = this.matriculas();
    if (!term) return list;
    return list.filter(m => 
      `${m.codigoMatricula || ''} ${m.estudianteCodigo || ''} ${m.estudianteNombre || ''} ${m.gradoNombre || ''} ${m.paralelo || ''} ${m.nivelNombre || ''} ${m.estado || ''}`.toLowerCase().includes(term)
    );
  });

  readonly wizardFilteredEstudiantes = computed(() => {
    const term = (this.wizardStudentSearch.value || '').toLowerCase();
    const activos = this.estudiantes().filter(e => e.activo);
    if (!term) return activos;
    return activos.filter(e => 
      `${e.nombres} ${e.apellidos} ${e.documentoIdentidad} ${e.codigoEstudiante}`.toLowerCase().includes(term)
    );
  });
  
  // KPIs Matriculas
  readonly matriculasActivas = computed(() => this.matriculas().filter(m => m.estado === 'ACTIVA').length);
  readonly matriculasSuspendidas = computed(() => this.matriculas().filter(m => m.estado === 'SUSPENDIDA').length);
  readonly matriculasRetiradas = computed(() => this.matriculas().filter(m => m.estado === 'RETIRADA').length);

  readonly selectedNivelId = signal<EntityId | null>(null);

  readonly formMatricula = new FormGroup({
    estudianteId: new FormControl<EntityId | null>(null, Validators.required),
    gradoId: new FormControl<EntityId | null>(null, Validators.required),
  });

  // Traslado State
  readonly showModalTraslado = signal(false);
  readonly matriculaATrasladar = signal<any>(null);
  readonly trasladoSelectedNivelId = signal<EntityId | null>(null);
  readonly trasladoForm = new FormGroup({
    gradoId: new FormControl<EntityId | null>(null, Validators.required)
  });

  // Jerarquía Académica para el Wizard
  readonly niveles = signal<any[]>([]);
  readonly grados = signal<any[]>([]);

  constructor() {
    this.loadEstudiantes();
    this.searchControl.valueChanges.subscribe(val => {
      this.loadEstudiantes(val || '');
    });
    this.route.data.subscribe(data => {
      const tab = data['tab'] as Tab;
      if (tab) {
        this.activeTab.set(tab);
        if (tab === 'matriculas') {
          this.loadMatriculas();
        } else {
          this.loadEstudiantes();
        }
      }
    });
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'matriculas' || params['tab'] === 'directorio') {
        this.activeTab.set(params['tab'] as Tab);
      }
    });
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    if (tab === 'matriculas') {
      this.loadMatriculas();
    } else {
      this.loadEstudiantes();
    }
    void this.router.navigate(['/admin/alumnos', tab]);
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
      next: (res: any) => {
        this.loading.set(false);
        this.showModalEstudiante.set(false);
        this.loadEstudiantes();
        this.editingStudent.set(null);
        this.success.set(edit ? 'Estudiante actualizado con éxito.' : 'Estudiante registrado con éxito.');

        if (!edit && res && res.id) {
          this.setTab('matriculas');
          this.startWizard();
          this.formMatricula.patchValue({ estudianteId: res.id });
          this.wizardStep.set(2);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.errorMessage(err, 'No se pudo guardar el estudiante.'));
      }
    });
  }

  async desactivarEstudiante(student: StudentAdminResponse): Promise<void> {
    if (!await this.confirmation.confirm({ title: 'Desactivar estudiante', message: `${student.nombres} ${student.apellidos} dejará de estar activo en el sistema.`, confirmLabel: 'Desactivar', tone: 'danger' })) return;
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
    this.wizardStudentSearch.reset('');
    this.selectedNivelId.set(null);
    this.grados.set([]);
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
    this.selectNivel(id);
  }

  selectNivel(id: EntityId | null) {
    this.selectedNivelId.set(id);
    this.formMatricula.patchValue({ gradoId: null });
    if (id) {
      this.portal.getGrados(id).subscribe(res => this.grados.set(res));
    } else {
      this.grados.set([]);
    }
  }

  selectGrado(id: EntityId) {
    this.formMatricula.patchValue({ gradoId: id });
  }

  confirmMatricula() {
    this.loading.set(true);
    this.portal.matricularEstudiante(this.formMatricula.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.showWizardMatricula.set(false);
        this.loadMatriculas();
        this.success.set('Matrícula completada con éxito.');
        this.router.navigate(['/admin/usuarios'], { queryParams: { action: 'new-user', role: 'ESTUDIANTE' } });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.errorMessage(err, 'No se pudo completar la matrícula.'));
      }
    });
  }

  openTrasladoModal(matricula: any) {
    this.matriculaATrasladar.set(matricula);
    this.trasladoSelectedNivelId.set(null);
    this.grados.set([]);
    this.trasladoForm.reset();
    this.showModalTraslado.set(true);
    this.portal.getNiveles().subscribe(res => this.niveles.set(res));
  }

  selectTrasladoNivel(id: EntityId | null) {
    this.trasladoSelectedNivelId.set(id);
    this.trasladoForm.patchValue({ gradoId: null });
    if (id) {
      this.portal.getGrados(id).subscribe(res => this.grados.set(res));
    } else {
      this.grados.set([]);
    }
  }

  selectTrasladoGrado(id: EntityId) {
    this.trasladoForm.patchValue({ gradoId: id });
  }

  confirmTraslado() {
    const matricula = this.matriculaATrasladar();
    const gradoId = this.trasladoForm.value.gradoId;
    if (!matricula || !gradoId) return;

    this.loading.set(true);
    this.portal.trasladarMatricula(matricula.id, gradoId).subscribe({
      next: () => {
        this.loading.set(false);
        this.showModalTraslado.set(false);
        this.loadMatriculas();
        this.success.set('Traslado completado con éxito.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.errorMessage(err, 'No se pudo completar el traslado.'));
      }
    });
  }

  async cambiarEstadoMatricula(id: EntityId, nuevoEstado: string): Promise<void> {
    if (!await this.confirmation.confirm({ title: 'Cambiar estado de matrícula', message: `La matrícula pasará al estado ${nuevoEstado}.`, confirmLabel: 'Cambiar estado', tone: 'danger' })) return;
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
