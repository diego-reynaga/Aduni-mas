import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { Metric, TeacherProgress, EntityId, StudentAdminRequest, PersonaResponse, EstudianteApoderadoRequest } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, staggerList, staggerRows, slideInRight } from '../../core/animations';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: '../admin-students/admin-students.css',
  animations: [fadeIn, staggerList, staggerRows, slideInRight],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly portal = inject(PortalService);

  readonly metrics = signal<Metric[]>([]);
  readonly progress = signal<TeacherProgress[]>([]);
  readonly error = signal('');

  // Wizard state
  readonly showWizard = signal(false);
  readonly wizardStep = signal(1); // 1=Estudiante, 2=Apoderado, 3=Matrícula, 4=Usuario, 5=Confirmación
  readonly wizardLoading = signal(false);
  readonly wizardError = signal('');
  readonly wizardSuccess = signal('');

  // Student data (created in step 1)
  readonly createdStudentId = signal<EntityId | null>(null);
  readonly createdPersonaId = signal<EntityId | null>(null);
  readonly createdStudentName = signal('');
  
  // Teacher Wizard state
  readonly showTeacherWizard = signal(false);
  readonly teacherWizardStep = signal(1); // 1=Docente, 2=Curso, 3=Usuario, 4=Confirmación
  readonly teacherWizardLoading = signal(false);
  readonly teacherWizardError = signal('');

  readonly createdTeacherId = signal<EntityId | null>(null); // subtypeId (docentes.id)
  readonly createdTeacherPersonaId = signal<EntityId | null>(null); // personas.id
  readonly createdTeacherName = signal('');
  readonly activePeriodoId = signal<EntityId | null>(null);

  readonly formDocente = new FormGroup({
    nombres: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellidos: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipoDocumento: new FormControl('DNI', { nonNullable: true }),
    documentoIdentidad: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaNacimiento: new FormControl(''),
    genero: new FormControl(''),
    correo: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    telefono: new FormControl(''),
    direccion: new FormControl(''),
    codigo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    especialidad: new FormControl(''),
    areaAcademica: new FormControl(''),
  });

  readonly selectedTeacherNivelId = signal<EntityId | null>(null);
  readonly selectedTeacherGradoId = signal<EntityId | null>(null);
  readonly teacherCursosList = signal<any[]>([]);
  readonly selectedTeacherCursoId = signal<EntityId | null>(null);
  readonly teacherCredentials = signal<{username: string, password: string} | null>(null);

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

  // Apoderado data
  readonly padresList = signal<PersonaResponse[]>([]);
  readonly padresSearch = signal('');
  readonly showQuickCreatePadre = signal(false);
  readonly selectedPadre = signal<PersonaResponse | null>(null);
  readonly selectedParentesco = signal('MADRE');
  readonly selectedPrincipal = signal(false);
  
  readonly filteredPadresWizard = computed(() => {
    const term = this.padresSearch().toLowerCase().trim();
    if (!term) return this.padresList();
    return this.padresList().filter(p => 
      `${p.nombres} ${p.apellidos} ${p.documentoIdentidad}`.toLowerCase().includes(term)
    );
  });

  readonly quickPadreForm = new FormGroup({
    nombres: new FormControl('', [Validators.required]),
    apellidos: new FormControl('', [Validators.required]),
    documentoIdentidad: new FormControl('', [Validators.required]),
    telefono: new FormControl(''),
    correo: new FormControl('', [Validators.email]),
    ocupacion: new FormControl(''),
  });

  // Matrícula data
  readonly nivelesList = signal<any[]>([]);
  readonly gradosList = signal<any[]>([]);
  readonly selectedNivelId = signal<EntityId | null>(null);
  readonly selectedGradoId = signal<EntityId | null>(null);

  // User created flag
  readonly userCreated = signal(false);
  readonly userCredentials = signal<{username: string, password: string} | null>(null);
  readonly parentCredentials = signal<{username: string, password: string} | null>(null);

  constructor() {
    this.portal.adminDashboard().subscribe({
      next: (payload) => {
        this.metrics.set(payload.metrics);
        this.progress.set(payload.progress);
      },
      error: () => {
        this.error.set('No se pudo cargar el panel administrativo.');
      },
    });
  }

  statusClass(status: string): string {
    if (status === 'Completo') {
      return 'status-pill-premium is-active';
    }

    if (status === 'En proceso') {
      return 'status-pill-premium is-warning';
    }

    return 'status-pill-premium is-inactive';
  }

  // --- WIZARD METHODS ---
  openWizard() {
    this.showWizard.set(true);
    this.wizardStep.set(1);
    this.wizardError.set('');
    this.wizardSuccess.set('');
    this.wizardLoading.set(false);
    this.createdStudentId.set(null);
    this.createdPersonaId.set(null);
    this.createdStudentName.set('');
    this.formEstudiante.reset({ tipoDocumento: 'DNI', activo: true });
    
    this.showQuickCreatePadre.set(false);
    this.selectedPadre.set(null);
    this.selectedParentesco.set('MADRE');
    this.selectedPrincipal.set(false);
    this.padresSearch.set('');
    this.quickPadreForm.reset();

    this.selectedNivelId.set(null);
    this.selectedGradoId.set(null);
    this.userCreated.set(false);
    this.userCredentials.set(null);
    this.parentCredentials.set(null);

    this.portal.getPersonas().subscribe({
      next: res => this.padresList.set(res.filter(p => p.tipoPersona === 'PADRE_FAMILIA')),
      error: () => {}
    });
    this.portal.getNiveles().subscribe({
      next: res => this.nivelesList.set(res),
      error: () => {}
    });
  }

  closeWizard() {
    this.showWizard.set(false);
  }

  step1CreateStudent() {
    if (this.formEstudiante.invalid) {
      this.formEstudiante.markAllAsTouched();
      return;
    }
    this.wizardLoading.set(true);
    this.wizardError.set('');
    const req = this.formEstudiante.getRawValue() as StudentAdminRequest;
    this.portal.crearEstudiante(req).subscribe({
      next: (res) => {
        this.wizardLoading.set(false);
        this.createdStudentId.set(res.id);
        this.createdPersonaId.set(res.personaId);
        this.createdStudentName.set(`${res.nombres} ${res.apellidos}`);
        this.wizardStep.set(2);
      },
      error: (err) => {
        this.wizardLoading.set(false);
        this.wizardError.set(err.message || 'No se pudo crear el estudiante.');
      }
    });
  }

  step2AssignGuardian() {
    const pId = this.selectedPadre()?.subtypeId || this.selectedPadre()?.id; 
    // Wait, portal.asignarApoderado requires padreFamiliaId which is the ID in padres_familia table.
    // When we call getPersonas, it returns PersonaResponse. subtypeId is the ID in the specific role table.
    // If it's PADRE_FAMILIA, subtypeId is padreFamiliaId.
    if (!this.selectedPadre()) {
      this.wizardError.set('Seleccione un apoderado.');
      return;
    }
    const studentId = this.createdStudentId();
    if (!studentId) return;

    this.wizardLoading.set(true);
    this.wizardError.set('');
    
    // Fallback to id if subtypeId is missing, though it should exist for created parents
    const padreFamId = this.selectedPadre()?.subtypeId;
    // Wait, if createQuickPadre is used, createPersona returns a PersonaResponse. Does it have subtypeId right away?
    // Let's assume the API handles it properly if we pass subtypeId.

    const req: EstudianteApoderadoRequest = {
      padreFamiliaId: padreFamId as string, // subtypeId is padre_familia.id
      parentesco: this.selectedParentesco(),
      principal: this.selectedPrincipal(),
    };
    
    // If padreFamId is missing, it might mean the Persona exists but not the padre_familia record? No, `tipoPersona: 'PADRE_FAMILIA'` ensures it.
    // To be safe, let's make sure it's valid:
    if (!req.padreFamiliaId) {
      this.wizardError.set('Error: El apoderado no tiene un ID de rol válido (subtypeId).');
      this.wizardLoading.set(false);
      return;
    }

    this.portal.asignarApoderado(studentId, req).subscribe({
      next: () => {
        this.wizardLoading.set(false);
        this.wizardStep.set(3);
      },
      error: (err) => {
        this.wizardLoading.set(false);
        this.wizardError.set(err.message || 'Error al asignar apoderado.');
      }
    });
  }

  createQuickPadre() {
    if (this.quickPadreForm.invalid) {
      this.quickPadreForm.markAllAsTouched();
      return;
    }
    this.wizardLoading.set(true);
    this.wizardError.set('');
    const vals = this.quickPadreForm.value;
    const req = {
      nombres: vals.nombres || '',
      apellidos: vals.apellidos || '',
      documentoIdentidad: vals.documentoIdentidad || '',
      telefono: vals.telefono || '',
      correo: vals.correo || '',
      tipoPersona: 'PADRE_FAMILIA',
      ocupacion: vals.ocupacion || '',
      activo: true
    };
    this.portal.createPersona(req).subscribe({
      next: (res) => {
        this.wizardLoading.set(false);
        this.padresList.update(list => [res, ...list]);
        this.selectedPadre.set(res);
        this.showQuickCreatePadre.set(false);
        this.quickPadreForm.reset();
      },
      error: (err) => {
        this.wizardLoading.set(false);
        this.wizardError.set(err.message || 'Error al crear apoderado.');
      }
    });
  }

  onNivelSelectedWizard(id: EntityId | null) {
    this.selectedNivelId.set(id);
    this.selectedGradoId.set(null);
    if (id) {
      this.portal.getGrados(id).subscribe({
        next: res => this.gradosList.set(res),
        error: () => this.gradosList.set([])
      });
    } else {
      this.gradosList.set([]);
    }
  }

  selectGradoWizard(id: EntityId) {
    this.selectedGradoId.set(id);
  }

  step3Enroll() {
    const gradoId = this.selectedGradoId();
    const estudianteId = this.createdStudentId();
    if (!gradoId || !estudianteId) {
      this.wizardError.set('Seleccione un grado.');
      return;
    }
    this.wizardLoading.set(true);
    this.wizardError.set('');
    this.portal.matricularEstudiante({ estudianteId, gradoId }).subscribe({
      next: () => {
        this.wizardLoading.set(false);
        this.wizardStep.set(4);
      },
      error: (err) => {
        this.wizardLoading.set(false);
        this.wizardError.set(err.message || 'Error al matricular.');
      }
    });
  }

  step4CreateUser() {
    const personaId = this.createdPersonaId();
    if (!personaId) {
      this.wizardError.set('Error: No se encontró la Persona ID del estudiante.');
      return;
    }

    this.wizardLoading.set(true);
    this.wizardError.set('');

    const studentReq = this.portal.createUser({ personaId, roles: ['ESTUDIANTE'], username: '', password: '' });
    
    // Check if there is a selected parent
    const padre = this.selectedPadre();
    const parentReq = padre ? this.portal.createUser({ personaId: padre.id, roles: ['PADRE_FAMILIA'], username: '', password: '' }) : of(null);

    forkJoin({
      studentUser: studentReq,
      parentUser: parentReq
    }).subscribe({
      next: (results) => {
        this.wizardLoading.set(false);
        this.userCreated.set(true);
        
        const res = results.studentUser;
        this.userCredentials.set({
          username: res.username || this.formEstudiante.value.correo || '',
          password: this.formEstudiante.value.documentoIdentidad || ''
        });

        if (results.parentUser && padre) {
          const pRes = results.parentUser;
          this.parentCredentials.set({
            username: pRes.username || padre.correo || '',
            password: padre.documentoIdentidad || ''
          });
        } else {
          this.parentCredentials.set(null);
        }

        this.wizardStep.set(5);
      },
      error: (err) => {
        this.wizardLoading.set(false);
        this.wizardError.set(err.message || 'Error al crear usuario(s).');
      }
    });
  }

  // --- TEACHER WIZARD METHODS ---
  openTeacherWizard() {
    this.showTeacherWizard.set(true);
    this.teacherWizardStep.set(1);
    this.teacherWizardError.set('');
    this.teacherWizardLoading.set(false);
    this.createdTeacherId.set(null);
    this.createdTeacherPersonaId.set(null);
    this.createdTeacherName.set('');
    this.formDocente.reset({ tipoDocumento: 'DNI' });
    this.selectedTeacherNivelId.set(null);
    this.selectedTeacherGradoId.set(null);
    this.selectedTeacherCursoId.set(null);
    this.teacherCursosList.set([]);
    this.teacherCredentials.set(null);
    this.activePeriodoId.set(null);

    this.portal.getNiveles().subscribe({
      next: res => this.nivelesList.set(res),
      error: () => {}
    });

    // Determine active Periodo ID for auto-assignment
    this.portal.getGestiones().subscribe({
      next: gestiones => {
        const newestActive = [...gestiones].filter(g => g.activa).sort((a, b) => b.anio - a.anio)[0] || gestiones[0];
        if (newestActive) {
          this.portal.getPeriodos(newestActive.id).subscribe({
            next: periodos => {
              if (periodos.length > 0) this.activePeriodoId.set(periodos[0].id);
            }
          });
        }
      }
    });
  }

  closeTeacherWizard() {
    this.showTeacherWizard.set(false);
  }

  teacherStep1Create() {
    if (this.formDocente.invalid) {
      this.formDocente.markAllAsTouched();
      return;
    }
    this.teacherWizardLoading.set(true);
    this.teacherWizardError.set('');
    
    const vals = this.formDocente.value;
    const req = {
      nombres: vals.nombres || '',
      apellidos: vals.apellidos || '',
      documentoIdentidad: vals.documentoIdentidad || '',
      telefono: vals.telefono || '',
      correo: vals.correo || '',
      tipoPersona: 'DOCENTE',
      ocupacion: '',
      activo: true
    };

    this.portal.createPersona(req).subscribe({
      next: (res) => {
        this.teacherWizardLoading.set(false);
        this.createdTeacherId.set(res.subtypeId || res.id); // Assuming backend correctly assigns subtypeId
        this.createdTeacherPersonaId.set(res.id);
        this.createdTeacherName.set(`${res.nombres} ${res.apellidos}`);
        this.teacherWizardStep.set(2);
      },
      error: (err) => {
        this.teacherWizardLoading.set(false);
        this.teacherWizardError.set(err.message || 'Error al crear docente.');
      }
    });
  }

  onTeacherNivelSelected(id: EntityId | null) {
    this.selectedTeacherNivelId.set(id);
    this.selectedTeacherGradoId.set(null);
    this.selectedTeacherCursoId.set(null);
    this.teacherCursosList.set([]);
    if (id) {
      this.portal.getGrados(id).subscribe({
        next: res => this.gradosList.set(res),
        error: () => this.gradosList.set([])
      });
    } else {
      this.gradosList.set([]);
    }
  }

  onTeacherGradoSelected(id: EntityId) {
    this.selectedTeacherGradoId.set(id);
    this.selectedTeacherCursoId.set(null);
    this.teacherCursosList.set([]);
    this.portal.getCursos(id).subscribe({
      next: res => this.teacherCursosList.set(res),
      error: () => this.teacherCursosList.set([])
    });
  }

  selectTeacherCurso(id: EntityId) {
    this.selectedTeacherCursoId.set(id);
  }

  teacherStep2Assign() {
    const cursoId = this.selectedTeacherCursoId();
    const docenteId = this.createdTeacherId();
    const periodoId = this.activePeriodoId();
    
    if (!cursoId) {
      this.teacherWizardError.set('Seleccione un curso.');
      return;
    }
    if (!periodoId) {
      this.teacherWizardError.set('No se encontró un periodo activo. Asegúrese de que haya una gestión activa.');
      return;
    }
    if (!docenteId) return;

    this.teacherWizardLoading.set(true);
    this.teacherWizardError.set('');
    
    const req: any = {
      docenteId: docenteId,
      cursoId: cursoId,
      periodoAcademicoId: periodoId,
      estado: 'ACTIVA'
    };

    // Assuming createAsignacionDocente handles upsert correctly
    this.portal.createAsignacionDocente(req).subscribe({
      next: () => {
        this.teacherWizardLoading.set(false);
        this.teacherWizardStep.set(3);
      },
      error: (err) => {
        this.teacherWizardLoading.set(false);
        this.teacherWizardError.set(err.message || 'Error al asignar curso.');
      }
    });
  }

  teacherStep3CreateUser() {
    const personaId = this.createdTeacherPersonaId();
    if (!personaId) return;

    this.teacherWizardLoading.set(true);
    this.teacherWizardError.set('');
    
    this.portal.createUser({ personaId, roles: ['DOCENTE'], username: '', password: '' }).subscribe({
      next: (res) => {
        this.teacherWizardLoading.set(false);
        this.teacherCredentials.set({
          username: res.username || this.formDocente.value.correo || '',
          password: this.formDocente.value.documentoIdentidad || ''
        });
        this.teacherWizardStep.set(4);
      },
      error: (err) => {
        this.teacherWizardLoading.set(false);
        this.teacherWizardError.set(err.message || 'Error al crear usuario.');
      }
    });
  }
}
