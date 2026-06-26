import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PortalService } from '../../core/portal.service';
import * as Academico from '../../core/academico.models';
import { PersonaDropdown } from '../../core/models';

type Tab = 'niveles' | 'grados' | 'materias' | 'oferta' | 'asignaciones';

@Component({
  selector: 'app-admin-academic',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './admin-academic.html',
  styleUrl: './admin-academic.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAcademic {
  private readonly portal = inject(PortalService);

  readonly activeTab = signal<Tab>('niveles');
  readonly error = signal('');
  readonly successMessage = signal('');

  // --- NIVELES EDUCATIVOS ---
  readonly niveles = signal<Academico.NivelEducativoResponse[]>([]);
  readonly isAddingNivel = signal(false);
  readonly isEditingNivel = signal(false);
  readonly editingNivelId = signal<number | null>(null);

  // --- CLONAR ESTRUCTURA ---
  readonly gestiones = signal<Academico.GestionAcademicaResponse[]>([]);
  readonly isCloning = signal(false);
  readonly clonarForm = new FormGroup({
    gestionOrigenId: new FormControl<number | null>(null, { nonNullable: true, validators: [Validators.required] }),
    gestionDestinoId: new FormControl<number | null>(null, { nonNullable: true, validators: [Validators.required] }),
  });

  readonly nivelForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    turno: new FormControl('MANANA', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true }),
    activo: new FormControl(true, { nonNullable: true }),
    gestionAcademicaId: new FormControl<number>(1, { nonNullable: true }), // Por defecto 1 (primera gestion)
  });

  // --- GRADOS (Tree View) ---
  readonly expandedNiveles = signal<Set<number>>(new Set());
  readonly gradosPorNivel = signal<Map<number, Academico.GradoResponse[]>>(new Map());
  
  readonly isAddingGrado = signal(false);
  readonly isEditingGrado = signal(false);
  readonly editingGradoId = signal<number | null>(null);

  readonly gradoForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    paralelo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    activo: new FormControl(true, { nonNullable: true }),
    nivelEducativoId: new FormControl<number | null>(null, { nonNullable: true, validators: [Validators.required] }),
  });

  // --- MATERIAS ---
  readonly materias = signal<Academico.MateriaResponse[]>([]);
  readonly isAddingMateria = signal(false);
  readonly isEditingMateria = signal(false);
  readonly editingMateriaId = signal<number | null>(null);
  readonly searchMateriaQuery = signal('');

  readonly filteredMaterias = computed(() => {
    const q = this.searchMateriaQuery().toLowerCase();
    const area = this.selectedArea();
    return this.materias().filter(m => {
      const matchesSearch = m.nombre.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q) || m.area.toLowerCase().includes(q);
      const matchesArea = area === '' || m.area === area;
      return matchesSearch && matchesArea;
    });
  });

  readonly materiaForm = new FormGroup({
    codigo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    area: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    activa: new FormControl(true, { nonNullable: true }),
  });

  // --- OFERTA EDUCATIVA (CURSOS) ---
  readonly cursos = signal<Academico.CursoResponse[]>([]);
  readonly selectedNivelForOferta = signal<number | null>(null);
  readonly gradosForOferta = signal<Academico.GradoResponse[]>([]);
  readonly selectedGradoForOferta = signal<number | null>(null);
  readonly assignedMateriasIds = computed(() => new Set(this.cursos().map(c => c.materiaId)));
  
  // Checklist de asignación masiva
  selectedMateriasToAssign = signal<number[]>([]);

  // --- ASIGNACION DOCENTE ---
  readonly periodos = signal<Academico.PeriodoAcademicoResponse[]>([]);
  readonly asignaciones = signal<Academico.AsignacionDocenteResponse[]>([]);
  readonly cursosDisponibles = signal<Academico.CursoDisponibleResponse[]>([]);
  readonly docentes = signal<PersonaDropdown[]>([]);
  readonly selectedPeriodoId = signal<number | null>(null);
  readonly showModalAsignacion = signal(false);

  readonly formAsignacion = new FormGroup({
    docenteId: new FormControl<number | null>(null, { nonNullable: true, validators: [Validators.required] }),
    cursoId: new FormControl<number | null>(null, { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.loadGestiones();
    this.loadNiveles();
    this.loadMaterias();
  }

  loadGestiones() {
    this.portal.getGestiones().subscribe({
      next: (data) => this.gestiones.set(data),
      error: () => this.error.set('No se pudieron cargar las gestiones académicas.')
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.error.set('');
    this.successMessage.set('');

    if (tab === 'asignaciones') {
      if (this.gestiones().length > 0) {
        this.portal.getPeriodos(this.gestiones()[0].id).subscribe({
          next: (data) => this.periodos.set(data)
        });
      }
    }
  }

  // --- LÓGICA NIVELES ---
  loadNiveles() {
    this.portal.getNiveles().subscribe({
      next: (data) => {
        this.niveles.set(data);
      },
      error: () => this.error.set('No se pudieron cargar los niveles educativos.')
    });
  }

  openAddNivel() {
    this.nivelForm.reset({ activo: true, gestionAcademicaId: 1, turno: 'MANANA' });
    this.isAddingNivel.set(true);
    this.isEditingNivel.set(false);
  }

  openEditNivel(nivel: Academico.NivelEducativoResponse) {
    this.nivelForm.patchValue(nivel);
    this.editingNivelId.set(nivel.id);
    this.isEditingNivel.set(true);
    this.isAddingNivel.set(false);
  }

  closeNivelModal() {
    this.isAddingNivel.set(false);
    this.isEditingNivel.set(false);
  }

  saveNivel() {
    if (this.nivelForm.invalid) return;
    const req = this.nivelForm.getRawValue() as Academico.NivelEducativoRequest;
    
    if (this.isAddingNivel()) {
      this.portal.createNivel(req).subscribe({
        next: () => {
          this.successMessage.set('Nivel educativo creado.');
          this.closeNivelModal();
          this.loadNiveles();
        },
        error: (err) => this.error.set(err.error?.message || 'Error al crear nivel.')
      });
    } else if (this.isEditingNivel()) {
      const id = this.editingNivelId();
      if (!id) return;
      this.portal.updateNivel(id, req).subscribe({
        next: () => {
          this.successMessage.set('Nivel educativo actualizado.');
          this.closeNivelModal();
          this.loadNiveles();
        },
        error: (err) => this.error.set(err.error?.message || 'Error al actualizar nivel.')
      });
    }
  }

  deleteNivel(id: number) {
    if (!confirm('¿Desactivar este nivel educativo?')) return;
    this.portal.deleteNivel(id).subscribe({
      next: () => {
        this.successMessage.set('Nivel desactivado.');
        this.loadNiveles();
      },
      error: () => this.error.set('Error al desactivar nivel.')
    });
  }

  // --- LÓGICA CLONAR ---
  openClonarModal() {
    this.clonarForm.reset();
    this.isCloning.set(true);
  }

  closeClonarModal() {
    this.isCloning.set(false);
  }

  saveClonar() {
    if (this.clonarForm.invalid) return;
    const req = {
      gestionOrigenId: this.clonarForm.value.gestionOrigenId!,
      gestionDestinoId: this.clonarForm.value.gestionDestinoId!
    };
    if (req.gestionOrigenId === req.gestionDestinoId) {
      this.error.set('La gestión origen y destino no pueden ser la misma.');
      return;
    }

    this.portal.clonarEstructura(req).subscribe({
      next: () => {
        this.successMessage.set('Estructura clonada exitosamente.');
        this.closeClonarModal();
        this.loadNiveles(); // recargar
      },
      error: (err) => this.error.set(err.error?.message || 'Error al clonar estructura.')
    });
  }

  // --- LÓGICA GRADOS (Tree View) ---
  toggleNivelExpansion(nivelId: number) {
    const current = new Set(this.expandedNiveles());
    if (current.has(nivelId)) {
      current.delete(nivelId);
      this.expandedNiveles.set(current);
    } else {
      current.add(nivelId);
      this.expandedNiveles.set(current);
      if (!this.gradosPorNivel().has(nivelId)) {
        this.loadGradosForNivel(nivelId);
      }
    }
  }

  loadGradosForNivel(nivelId: number) {
    this.portal.getGrados(nivelId).subscribe({
      next: (data) => {
        const map = new Map(this.gradosPorNivel());
        map.set(nivelId, data);
        this.gradosPorNivel.set(map);
      },
      error: () => this.error.set('No se pudieron cargar los grados del nivel.')
    });
  }

  openAddGrado(nivelId: number) {
    this.gradoForm.reset({ activo: true, nivelEducativoId: nivelId });
    this.isAddingGrado.set(true);
    this.isEditingGrado.set(false);
  }

  openEditGrado(grado: Academico.GradoResponse) {
    this.gradoForm.patchValue(grado);
    this.editingGradoId.set(grado.id);
    this.isEditingGrado.set(true);
    this.isAddingGrado.set(false);
  }

  closeGradoModal() {
    this.isAddingGrado.set(false);
    this.isEditingGrado.set(false);
  }

  saveGrado() {
    if (this.gradoForm.invalid) return;
    const req = this.gradoForm.getRawValue() as Academico.GradoRequest;
    
    if (this.isAddingGrado()) {
      this.portal.createGrado(req).subscribe({
        next: () => {
          this.successMessage.set('Grado creado.');
          this.closeGradoModal();
          this.loadGradosForNivel(req.nivelEducativoId!);
        },
        error: (err) => this.error.set(err.error?.message || 'Error al crear grado.')
      });
    } else if (this.isEditingGrado()) {
      const id = this.editingGradoId();
      if (!id) return;
      this.portal.updateGrado(id, req).subscribe({
        next: () => {
          this.successMessage.set('Grado actualizado.');
          this.closeGradoModal();
          this.loadGradosForNivel(req.nivelEducativoId!);
        },
        error: (err) => this.error.set(err.error?.message || 'Error al actualizar grado.')
      });
    }
  }

  deleteGrado(grado: Academico.GradoResponse) {
    if (!confirm('¿Desactivar este grado?')) return;
    this.portal.deleteGrado(grado.id).subscribe({
      next: () => {
        this.successMessage.set('Grado desactivado.');
        this.loadGradosForNivel(grado.nivelEducativoId!);
      },
      error: () => this.error.set('Error al desactivar grado.')
    });
  }

  // --- LÓGICA MATERIAS ---
  readonly areas = computed(() => {
    const areasSet = new Set(this.materias().map(m => m.area));
    return Array.from(areasSet).sort();
  });
  readonly selectedArea = signal<string>('');

  loadMaterias() {
    this.portal.getMaterias().subscribe({
      next: (data) => this.materias.set(data),
      error: () => this.error.set('No se pudieron cargar las materias.')
    });
  }

  openAddMateria() {
    this.materiaForm.reset({ activa: true });
    this.isAddingMateria.set(true);
    this.isEditingMateria.set(false);
  }

  openEditMateria(materia: Academico.MateriaResponse) {
    this.materiaForm.patchValue(materia);
    this.editingMateriaId.set(materia.id);
    this.isEditingMateria.set(true);
    this.isAddingMateria.set(false);
  }

  closeMateriaModal() {
    this.isAddingMateria.set(false);
    this.isEditingMateria.set(false);
  }

  saveMateria() {
    if (this.materiaForm.invalid) return;
    const req = this.materiaForm.getRawValue() as Academico.MateriaRequest;
    
    if (this.isAddingMateria()) {
      this.portal.createMateria(req).subscribe({
        next: () => {
          this.successMessage.set('Materia creada.');
          this.closeMateriaModal();
          this.loadMaterias();
        },
        error: (err) => this.error.set(err.error?.message || 'Error al crear materia.')
      });
    } else if (this.isEditingMateria()) {
      const id = this.editingMateriaId();
      if (!id) return;
      this.portal.updateMateria(id, req).subscribe({
        next: () => {
          this.successMessage.set('Materia actualizada.');
          this.closeMateriaModal();
          this.loadMaterias();
        },
        error: (err) => this.error.set(err.error?.message || 'Error al actualizar materia.')
      });
    }
  }

  deleteMateria(id: number) {
    if (!confirm('¿Desactivar esta materia?')) return;
    this.portal.deleteMateria(id).subscribe({
      next: () => {
        this.successMessage.set('Materia desactivada.');
        this.loadMaterias();
      },
      error: () => this.error.set('Error al desactivar materia.')
    });
  }

  // --- LÓGICA OFERTA EDUCATIVA (CURSOS) ---
  onSelectNivelForOferta(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value);
    this.selectedNivelForOferta.set(id);
    this.selectedGradoForOferta.set(null);
    this.cursos.set([]);
    this.portal.getGrados(id).subscribe({
      next: (data) => this.gradosForOferta.set(data),
      error: () => this.error.set('No se pudieron cargar los grados del nivel.')
    });
  }

  onSelectGradoForOferta(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value);
    this.selectedGradoForOferta.set(id);
    this.loadCursos();
  }

  loadCursos() {
    const gradoId = this.selectedGradoForOferta();
    if (!gradoId) return;
    this.portal.getCursos(gradoId).subscribe({
      next: (data) => {
        this.cursos.set(data);
        this.selectedMateriasToAssign.set([]); // Limpiar checklist
      },
      error: () => this.error.set('No se pudieron cargar los cursos.')
    });
  }

  toggleMateriaSelection(materiaId: number) {
    const current = this.selectedMateriasToAssign();
    if (current.includes(materiaId)) {
      this.selectedMateriasToAssign.set(current.filter(id => id !== materiaId));
    } else {
      this.selectedMateriasToAssign.set([...current, materiaId]);
    }
  }

  assignMaterias() {
    const gradoId = this.selectedGradoForOferta();
    const materiasIds = this.selectedMateriasToAssign();
    if (!gradoId || materiasIds.length === 0) return;

    this.portal.asignarCursosMasivo({ gradoId, materiasIds }).subscribe({
      next: () => {
        this.successMessage.set('Materias asignadas al grado exitosamente.');
        this.loadCursos();
      },
      error: (err) => this.error.set(err.error?.message || 'Error al asignar materias. Transacción revertida.')
    });
  }

  removeCurso(id: number) {
    if (!confirm('¿Remover esta materia del grado?')) return;
    this.portal.removerCurso(id).subscribe({
      next: () => {
        this.successMessage.set('Materia removida del grado.');
        this.loadCursos();
      },
      error: () => this.error.set('Error al remover materia.')
    });
  }

  // --- LÓGICA ASIGNACIÓN DOCENTE ---
  onSelectPeriodo(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value);
    if (!id) {
      this.selectedPeriodoId.set(null);
      this.asignaciones.set([]);
      return;
    }
    this.selectedPeriodoId.set(id);
    this.loadAsignaciones();
  }

  loadAsignaciones() {
    const periodoId = this.selectedPeriodoId();
    if (!periodoId) return;
    this.portal.getAsignaciones(periodoId).subscribe({
      next: (data) => this.asignaciones.set(data),
      error: () => this.error.set('Error al cargar asignaciones.')
    });
  }

  openAsignarModal() {
    const periodoId = this.selectedPeriodoId();
    if (!periodoId) return;
    
    this.formAsignacion.reset();
    this.showModalAsignacion.set(true);
    
    this.portal.getDocentesDropdown().subscribe({
      next: (data) => this.docentes.set(data),
      error: () => this.error.set('Error al cargar docentes.')
    });

    this.portal.getCursosDisponibles(periodoId).subscribe({
      next: (data) => this.cursosDisponibles.set(data),
      error: () => this.error.set('Error al cargar cursos disponibles.')
    });
  }

  saveAsignacion() {
    if (this.formAsignacion.invalid) return;
    const periodoId = this.selectedPeriodoId();
    if (!periodoId) return;

    const req: Academico.AsignacionDocenteRequest = {
      docenteId: this.formAsignacion.value.docenteId!,
      cursoId: this.formAsignacion.value.cursoId!,
      periodoAcademicoId: periodoId
    };

    this.portal.asignarDocente(req).subscribe({
      next: () => {
        this.successMessage.set('Docente asignado exitosamente.');
        this.showModalAsignacion.set(false);
        this.loadAsignaciones();
      },
      error: (err) => this.error.set(err.error?.message || 'Error al asignar docente.')
    });
  }

  confirmarRemover(id: number) {
    if (!confirm('¿Cerrar esta asignación docente?')) return;
    this.portal.removerAsignacion(id).subscribe({
      next: () => {
        this.successMessage.set('Asignación cerrada exitosamente.');
        this.loadAsignaciones();
      },
      error: () => this.error.set('Error al remover asignación.')
    });
  }
}
