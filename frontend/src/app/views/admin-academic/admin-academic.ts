import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PortalService } from '../../core/portal.service';
import * as Academico from '../../core/academico.models';
import { fadeIn } from '../../core/animations';
import { EntityId } from '../../core/models';

type Tab = 'niveles' | 'grados' | 'materias' | 'oferta';

@Component({
  selector: 'app-admin-academic',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './admin-academic.html',
  styleUrl: './admin-academic.css',
  animations: [fadeIn],
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
  readonly editingNivelId = signal<EntityId | null>(null);

  // --- CLONAR ESTRUCTURA ---
  readonly gestiones = signal<Academico.GestionAcademicaResponse[]>([]);
  readonly isCloning = signal(false);
  readonly clonarForm = new FormGroup({
    gestionOrigenId: new FormControl<EntityId | null>(null, { validators: [Validators.required] }),
    gestionDestinoId: new FormControl<EntityId | null>(null, { validators: [Validators.required] }),
  });

  readonly nivelForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    turno: new FormControl('MANANA', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true }),
    activo: new FormControl(true, { nonNullable: true }),
    gestionAcademicaId: new FormControl<EntityId>('', { nonNullable: true, validators: [Validators.required] }),
  });

  // --- GRADOS (Tree View) ---
  readonly expandedNiveles = signal<Set<EntityId>>(new Set());
  readonly gradosPorNivel = signal<Map<EntityId, Academico.GradoResponse[]>>(new Map());
  readonly isAddingGrado = signal(false);
  readonly isEditingGrado = signal(false);
  readonly editingGradoId = signal<EntityId | null>(null);

  readonly gradoForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    paralelo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    capacidad: new FormControl(30, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    activo: new FormControl(true, { nonNullable: true }),
    nivelEducativoId: new FormControl<EntityId | null>(null, { validators: [Validators.required] }),
  });

  // --- MATERIAS ---
  readonly materias = signal<Academico.MateriaResponse[]>([]);
  readonly isAddingMateria = signal(false);
  readonly isEditingMateria = signal(false);
  readonly editingMateriaId = signal<EntityId | null>(null);
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
  readonly selectedNivelForOferta = signal<EntityId | null>(null);
  readonly gradosForOferta = signal<Academico.GradoResponse[]>([]);
  readonly selectedGradoForOferta = signal<EntityId | null>(null);
  readonly assignedMateriasIds = computed(() => new Set(this.cursos().map(c => c.materiaId)));
  // Checklist de asignación masiva
  selectedMateriasToAssign = signal<EntityId[]>([]);

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
    this.nivelForm.reset({ activo: true, gestionAcademicaId: this.gestiones()[0]?.id ?? '', turno: 'MANANA' });
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

  deleteNivel(id: EntityId) {
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
  toggleNivelExpansion(nivelId: EntityId) {
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

  loadGradosForNivel(nivelId: EntityId) {
    this.portal.getGrados(nivelId).subscribe({
      next: (data) => {
        const map = new Map(this.gradosPorNivel());
        map.set(nivelId, data);
        this.gradosPorNivel.set(map);
      },
      error: () => this.error.set('No se pudieron cargar los grados del nivel.')
    });
  }

  openAddGrado(nivelId: EntityId) {
    this.gradoForm.reset({ activo: true, capacidad: 30, nivelEducativoId: nivelId });
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

  deleteMateria(id: EntityId) {
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
    const id = (event.target as HTMLSelectElement).value;
    this.selectedNivelForOferta.set(id);
    this.selectedGradoForOferta.set(null);
    this.cursos.set([]);
    this.portal.getGrados(id).subscribe({
      next: (data) => this.gradosForOferta.set(data),
      error: () => this.error.set('No se pudieron cargar los grados del nivel.')
    });
  }

  onSelectGradoForOferta(event: Event) {
    const id = (event.target as HTMLSelectElement).value;
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

  toggleMateriaSelection(materiaId: EntityId) {
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

  removeCurso(id: EntityId) {
    if (!confirm('¿Remover esta materia del grado?')) return;
    this.portal.removerCurso(id).subscribe({
      next: () => {
        this.successMessage.set('Materia removida del grado.');
        this.loadCursos();
      },
      error: () => this.error.set('Error al remover materia.')
    });
  }
}
