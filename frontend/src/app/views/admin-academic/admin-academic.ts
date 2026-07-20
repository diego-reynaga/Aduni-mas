import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PortalService } from '../../core/portal.service';
import * as Academico from '../../core/academico.models';
import {
  fadeIn, staggerRows, slideInRight, slideAlert,
  scaleInModal, tabTransition, counterAnimate, expandCollapse
} from '../../core/animations';
import { EntityId } from '../../core/models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfirmationService } from '../../core/confirmation.service';

type Tab = 'resumen' | 'niveles' | 'grados' | 'materias';

export interface GrupoGrado {
  nombreGrado: string;
  paralelos: Academico.GradoResponse[];
}

@Component({
  selector: 'app-admin-academic',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './admin-academic.html',
  styleUrl: './admin-academic.css',
  animations: [fadeIn, staggerRows, slideInRight, slideAlert, scaleInModal, tabTransition, counterAnimate, expandCollapse],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAcademic {
  private readonly portal = inject(PortalService);
  private readonly confirmation = inject(ConfirmationService);

  readonly activeTab = signal<Tab>('resumen');
  readonly error = signal('');
  readonly successMessage = signal('');

  // --- KPIs ---
  readonly totalNiveles = computed(() => this.niveles().length);
  readonly totalGrados = computed(() => Array.from(this.gradosPorNivel().values()).reduce((acc, curr) => acc + curr.length, 0));
  readonly totalMaterias = computed(() => this.materias().length);
  readonly materiasActivas = computed(() => this.materias().filter(m => m.activa).length);

  // --- NIVELES EDUCATIVOS ---
  readonly niveles = signal<Academico.NivelEducativoResponse[]>([]);
  readonly isAddingNivel = signal(false);
  readonly isEditingNivel = signal(false);
  readonly editingNivelId = signal<EntityId | null>(null);

  readonly gestiones = signal<Academico.GestionAcademicaResponse[]>([]);

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
  
  readonly gradosAgrupadosPorNivel = computed(() => {
    const map = this.gradosPorNivel();
    const result = new Map<EntityId, GrupoGrado[]>();
    
    // Diccionario de orden lógico escolar
    const ordenAcademico: Record<string, number> = {
      'INICIAL': 0, 'PREKINDER': 1, 'KINDER': 2,
      'PRIMERO': 3, 'SEGUNDO': 4, 'TERCERO': 5, 'CUARTO': 6,
      'QUINTO': 7, 'SEXTO': 8, 'SEPTIMO': 9, 'SÉPTIMO': 9, 'OCTAVO': 10, 'NOVENO': 11, 'DECIMO': 12, 'DÉCIMO': 12
    };

    const getOrder = (nombre: string): number => {
      const key = nombre.toUpperCase();
      // Si empieza con un número (ej. "1ro", "2do"), intentamos usar ese número
      const match = key.match(/^(\d+)/);
      if (match) return parseInt(match[1]);
      return ordenAcademico[key] ?? 99; // 99 para grados desconocidos (van al final)
    };
    
    map.forEach((grados, nivelId) => {
      const groupsMap = new Map<string, Academico.GradoResponse[]>();
      
      grados.forEach(g => {
        // Limpieza mágica: Quitar espacios al inicio y final
        const cleanName = g.nombre.trim();
        // Capitalizar de forma bonita: "TERCERO " -> "Tercero"
        const displayKey = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
        
        const arr = groupsMap.get(displayKey) || [];
        arr.push(g);
        groupsMap.set(displayKey, arr);
      });
      
      const grupos = Array.from(groupsMap.entries()).map(([nombreGrado, paralelos]) => ({
        nombreGrado,
        paralelos: paralelos.sort((a, b) => a.paralelo.localeCompare(b.paralelo))
      })).sort((a, b) => {
        const orderA = getOrder(a.nombreGrado);
        const orderB = getOrder(b.nombreGrado);
        
        if (orderA !== orderB) return orderA - orderB;
        // Si no están en el diccionario (ambos son 99), se ordenan alfabéticamente
        return a.nombreGrado.localeCompare(b.nombreGrado);
      });
      
      result.set(nivelId, grupos);
    });
    return result;
  });

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
  readonly selectedArea = signal<string>('');
  readonly areas = computed(() => Array.from(new Set(this.materias().map(m => m.area))));

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

  // --- DRAWER PLAN DE ESTUDIOS (OFERTA ACADÉMICA MASIVA) ---
  readonly isOfertaDrawerOpen = signal(false);
  readonly selectedGrupoGradoForDrawer = signal<GrupoGrado | null>(null);
  readonly drawerSelectedMaterias = signal<Set<EntityId>>(new Set()); // UI state
  private oldMateriaIdsForDrawer = signal<Set<EntityId>>(new Set()); // Para saber qué se quitó/añadió

  constructor() {
    this.loadGestiones();
    this.loadNiveles();
    this.loadMaterias();
  }

  loadGestiones() {
    this.portal.getGestiones().subscribe({
      next: (data) => this.gestiones.set(data),
      error: () => this.showError('No se pudieron cargar las gestiones académicas.')
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
        data.forEach(nivel => this.loadGradosForNivel(nivel.id));
      },
      error: () => this.showError('No se pudieron cargar los niveles educativos.')
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
    if (this.isEditingNivel() && this.editingNivelId()) {
      this.portal.updateNivel(this.editingNivelId()!, req).subscribe({
        next: () => { this.showSuccess('Nivel actualizado'); this.closeNivelModal(); this.loadNiveles(); },
        error: () => this.showError('Error al actualizar nivel')
      });
    } else {
      this.portal.createNivel(req).subscribe({
        next: () => { this.showSuccess('Nivel creado'); this.closeNivelModal(); this.loadNiveles(); },
        error: () => this.showError('Error al crear nivel')
      });
    }
  }

  async deleteNivel(id: EntityId): Promise<void> {
    if (!await this.confirmation.confirm({ title: 'Desactivar nivel', message: 'El nivel dejará de estar disponible para nuevas operaciones.', confirmLabel: 'Desactivar', tone: 'danger' })) return;
    this.portal.deleteNivel(id).subscribe({
      next: () => { this.showSuccess('Nivel desactivado'); this.loadNiveles(); },
      error: () => this.showError('Error al desactivar nivel')
    });
  }

  // --- LÓGICA GRADOS ---
  toggleNivelExpansion(nivelId: EntityId) {
    const current = new Set(this.expandedNiveles());
    if (current.has(nivelId)) current.delete(nivelId);
    else current.add(nivelId);
    this.expandedNiveles.set(current);
  }

  loadGradosForNivel(nivelId: EntityId) {
    this.portal.getGrados(nivelId).subscribe({
      next: (data) => {
        const map = new Map(this.gradosPorNivel());
        map.set(nivelId, data);
        this.gradosPorNivel.set(map);
      }
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
    if (this.isEditingGrado() && this.editingGradoId()) {
      this.portal.updateGrado(this.editingGradoId()!, req).subscribe({
        next: () => { this.showSuccess('Grado actualizado'); this.closeGradoModal(); this.loadGradosForNivel(req.nivelEducativoId); },
        error: () => this.showError('Error al actualizar grado')
      });
    } else {
      this.portal.createGrado(req).subscribe({
        next: () => { this.showSuccess('Grado creado'); this.closeGradoModal(); this.loadGradosForNivel(req.nivelEducativoId); },
        error: () => this.showError('Error al crear grado')
      });
    }
  }

  async deleteGrado(grado: Academico.GradoResponse): Promise<void> {
    if (!await this.confirmation.confirm({ title: 'Desactivar grado', message: 'El grado dejará de estar disponible para nuevas operaciones.', confirmLabel: 'Desactivar', tone: 'danger' })) return;
    this.portal.deleteGrado(grado.id).subscribe({
      next: () => { this.showSuccess('Grado desactivado'); this.loadGradosForNivel(grado.nivelEducativoId); },
      error: () => this.showError('Error al desactivar grado')
    });
  }

  // --- DRAWER PLAN DE ESTUDIOS (GROUPED) ---
  openPlanEstudios(grupo: GrupoGrado, event: Event) {
    event.stopPropagation();
    this.selectedGrupoGradoForDrawer.set(grupo);
    this.isOfertaDrawerOpen.set(true);
    this.drawerSelectedMaterias.set(new Set());
    this.oldMateriaIdsForDrawer.set(new Set());
    
    // Load currently assigned materias for the FIRST paralelo to prefill the UI
    if (grupo.paralelos.length > 0) {
      const firstParaleloId = grupo.paralelos[0].id;
      this.portal.getCursos(firstParaleloId).subscribe({
        next: (cursos) => {
          const assignedIds = new Set(cursos.map(c => c.materiaId));
          this.drawerSelectedMaterias.set(assignedIds);
          this.oldMateriaIdsForDrawer.set(new Set(assignedIds)); // Clonamos para referencia
        },
        error: () => this.showError('No se pudieron cargar las materias asignadas.')
      });
    }
  }

  closePlanEstudios() {
    this.isOfertaDrawerOpen.set(false);
    this.selectedGrupoGradoForDrawer.set(null);
  }

  toggleDrawerMateria(materiaId: EntityId) {
    const current = new Set(this.drawerSelectedMaterias());
    if (current.has(materiaId)) {
      current.delete(materiaId);
    } else {
      current.add(materiaId);
    }
    this.drawerSelectedMaterias.set(current);
  }

  savePlanEstudios() {
    const grupo = this.selectedGrupoGradoForDrawer();
    if (!grupo) return;

    const oldMateriaIds = this.oldMateriaIdsForDrawer();
    const newMateriaIds = this.drawerSelectedMaterias();

    // 1. Find added materias
    const addedIds = Array.from(newMateriaIds).filter(id => !oldMateriaIds.has(id));
    
    // 2. Find removed materias
    const removedIds = Array.from(oldMateriaIds).filter(id => !newMateriaIds.has(id));

    const requests: any[] = [];

    // For EACH paralelo in the group, apply the changes
    for (const paralelo of grupo.paralelos) {
      if (addedIds.length > 0) {
        requests.push(this.portal.asignarCursosMasivo({ gradoId: paralelo.id, materiasIds: addedIds }));
      }
      if (removedIds.length > 0) {
        requests.push(this.portal.removerCursosMasivo(paralelo.id, removedIds).pipe(catchError(e => of(null))));
      }
    }

    if (requests.length === 0) {
      this.closePlanEstudios();
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.showSuccess(`Plan de estudios aplicado a todos los paralelos de ${grupo.nombreGrado}.`);
        this.closePlanEstudios();
      },
      error: () => this.showError('Ocurrió un error al guardar los cambios del plan de estudios masivo.')
    });
  }

  // --- LÓGICA MATERIAS ---
  loadMaterias() {
    this.portal.getMaterias().subscribe({
      next: (data) => this.materias.set(data),
      error: () => this.showError('No se pudieron cargar las materias.')
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
    if (this.isEditingMateria() && this.editingMateriaId()) {
      this.portal.updateMateria(this.editingMateriaId()!, req).subscribe({
        next: () => { this.showSuccess('Materia actualizada'); this.closeMateriaModal(); this.loadMaterias(); },
        error: () => this.showError('Error al actualizar materia')
      });
    } else {
      this.portal.createMateria(req).subscribe({
        next: () => { this.showSuccess('Materia creada'); this.closeMateriaModal(); this.loadMaterias(); },
        error: () => this.showError('Error al crear materia')
      });
    }
  }

  async deleteMateria(id: EntityId): Promise<void> {
    if (!await this.confirmation.confirm({ title: 'Desactivar materia', message: 'La materia dejará de estar disponible para nuevas operaciones.', confirmLabel: 'Desactivar', tone: 'danger' })) return;
    this.portal.deleteMateria(id).subscribe({
      next: () => { this.showSuccess('Materia desactivada'); this.loadMaterias(); },
      error: () => this.showError('Error al desactivar materia')
    });
  }

  private showError(msg: string) {
    this.error.set(msg);
    setTimeout(() => this.error.set(''), 4000);
  }

  private showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }
}
