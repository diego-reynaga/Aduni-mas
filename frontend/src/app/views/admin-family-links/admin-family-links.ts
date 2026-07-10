import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { EntityId, EstudianteApoderadoResponse, PersonaResponse, PersonaRequest } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, staggerRows, slideAlert } from '../../core/animations';

@Component({
  selector: 'app-admin-family-links',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-family-links.html',
  styleUrl: './admin-family-links.css',
  animations: [fadeIn, staggerRows, slideAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFamilyLinks {
  private readonly portal = inject(PortalService);

  // --- Data ---
  readonly estudiantes = signal<PersonaResponse[]>([]);
  readonly padres = signal<PersonaResponse[]>([]);
  readonly vinculos = signal<EstudianteApoderadoResponse[]>([]);
  readonly selectedStudent = signal<PersonaResponse | null>(null);

  // --- UI State ---
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadingVinculos = signal(false);
  readonly showQuickCreate = signal(false);
  readonly savingQuick = signal(false);
  readonly confirmDelete = signal<EstudianteApoderadoResponse | null>(null);
  readonly confirmAssign = signal<PersonaResponse | null>(null);
  
  readonly studentSearch = signal('');
  readonly parentSearch = signal('');

  // --- Toasts ---
  readonly toasts = signal<{id: number, msg: string, type: 'success' | 'error'}[]>([]);
  private toastIdCounter = 0;

  // --- Filtered lists ---
  readonly filteredEstudiantes = computed(() => {
    const q = this.studentSearch().toLowerCase();
    if (!q) return this.estudiantes();
    return this.estudiantes().filter(e =>
      e.nombres.toLowerCase().includes(q) ||
      e.apellidos.toLowerCase().includes(q) ||
      e.documentoIdentidad.toLowerCase().includes(q) ||
      (e.codigo || '').toLowerCase().includes(q)
    );
  });

  readonly filteredPadres = computed(() => {
    const q = this.parentSearch().toLowerCase();
    if (!q) return this.padres();
    return this.padres().filter(p =>
      p.nombres.toLowerCase().includes(q) ||
      p.apellidos.toLowerCase().includes(q) ||
      p.documentoIdentidad.toLowerCase().includes(q) ||
      (p.telefono || '').toLowerCase().includes(q) ||
      (p.correo || '').toLowerCase().includes(q)
    );
  });

  readonly assignedParentIds = computed(() => {
    return this.vinculos().map(v => v.padreFamiliaId);
  });

  // --- Forms ---
  readonly assignForm = new FormGroup({
    parentesco: new FormControl('MADRE', { nonNullable: true, validators: [Validators.required] }),
    principal: new FormControl(false, { nonNullable: true }),
  });

  readonly quickForm = new FormGroup({
    nombres: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellidos: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    documentoIdentidad: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    telefono: new FormControl(''),
    correo: new FormControl('', [Validators.email]),
    ocupacion: new FormControl(''),
  });

  constructor() {
    this.loadPersonas();
  }

  private loadPersonas() {
    this.loading.set(true);
    this.portal.getPersonas().subscribe({
      next: people => {
        this.estudiantes.set(people.filter(p => p.tipoPersona === 'ESTUDIANTE'));
        this.padres.set(people.filter(p => p.tipoPersona === 'PADRE_FAMILIA'));
        this.loading.set(false);
      },
      error: () => {
        this.showToast('No se pudo cargar el directorio.', 'error');
        this.loading.set(false);
      },
    });
  }

  // --- Student selection ---
  selectStudent(student: PersonaResponse) {
    if (this.selectedStudent()?.id === student.id) return;
    this.selectedStudent.set(student);
    this.vinculos.set([]);
    if (student.subtypeId) {
      this.loadVinculos(student.subtypeId);
    }
  }

  private loadVinculos(studentId: EntityId) {
    this.loadingVinculos.set(true);
    this.portal.getApoderados(studentId).subscribe({
      next: rows => {
        this.vinculos.set(rows);
        this.loadingVinculos.set(false);
      },
      error: () => {
        this.showToast('No se pudieron cargar los vínculos.', 'error');
        this.loadingVinculos.set(false);
      },
    });
  }

  // --- Assignment ---
  openAssignModal(parent: PersonaResponse) {
    this.confirmAssign.set(parent);
    this.assignForm.reset({ parentesco: 'MADRE', principal: false });
  }

  closeAssignModal() {
    this.confirmAssign.set(null);
  }

  executeAssign() {
    const studentSubtypeId = this.selectedStudent()?.subtypeId;
    const parent = this.confirmAssign();
    if (!studentSubtypeId || !parent?.subtypeId || this.assignForm.invalid) return;

    this.saving.set(true);
    const request = { 
      padreFamiliaId: parent.subtypeId, 
      parentesco: this.assignForm.value.parentesco!, 
      principal: this.assignForm.value.principal! 
    };

    this.portal.asignarApoderado(studentSubtypeId, request).subscribe({
      next: () => {
        this.showToast('Apoderado vinculado con éxito.', 'success');
        this.loadVinculos(studentSubtypeId);
        this.closeAssignModal();
        this.saving.set(false);
      },
      error: err => {
        this.showToast(err?.message || err?.error?.message || 'Error al vincular.', 'error');
        this.saving.set(false);
      },
    });
  }

  // --- Remove Link ---
  confirmRemove(row: EstudianteApoderadoResponse) {
    this.confirmDelete.set(row);
  }

  executeRemove() {
    const row = this.confirmDelete();
    const studentSubtypeId = this.selectedStudent()?.subtypeId;
    if (!row || !studentSubtypeId) return;
    
    this.saving.set(true);
    this.portal.removerApoderado(studentSubtypeId, row.id).subscribe({
      next: () => {
        this.showToast('Vínculo eliminado.', 'success');
        this.loadVinculos(studentSubtypeId);
        this.confirmDelete.set(null);
        this.saving.set(false);
      },
      error: err => {
        this.showToast(err?.message || err?.error?.message || 'Error al eliminar.', 'error');
        this.saving.set(false);
      },
    });
  }

  // --- Quick create parent ---
  toggleQuickCreate() {
    this.showQuickCreate.update(v => !v);
    if (!this.showQuickCreate()) {
      this.quickForm.reset({ nombres: '', apellidos: '', documentoIdentidad: '', telefono: '', correo: '', ocupacion: '' });
    }
  }

  saveQuickParent() {
    if (this.quickForm.invalid) {
      this.quickForm.markAllAsTouched();
      return;
    }
    this.savingQuick.set(true);
    const val = this.quickForm.value;
    const req: PersonaRequest = {
      tipoPersona: 'PADRE_FAMILIA',
      nombres: val.nombres!,
      apellidos: val.apellidos!,
      documentoIdentidad: val.documentoIdentidad!,
      telefono: val.telefono || undefined,
      correo: val.correo || undefined,
      ocupacion: val.ocupacion || undefined,
    };
    
    this.portal.createPersona(req).subscribe({
      next: (created) => {
        this.padres.update(list => [...list, created].sort((a, b) => a.apellidos.localeCompare(b.apellidos)));
        this.showQuickCreate.set(false);
        this.quickForm.reset({ nombres: '', apellidos: '', documentoIdentidad: '', telefono: '', correo: '', ocupacion: '' });
        this.showToast('Apoderado creado. Ahora puede vincularlo.', 'success');
        
        if (this.selectedStudent()) {
          this.openAssignModal(created);
        }
        this.savingQuick.set(false);
      },
      error: (err) => {
        this.showToast(err?.message || err?.error?.message || 'Error al crear apoderado.', 'error');
        this.savingQuick.set(false);
      },
    });
  }

  // --- Toast ---
  showToast(msg: string, type: 'success' | 'error') {
    const id = this.toastIdCounter++;
    this.toasts.update(t => [...t, { id, msg, type }]);
    setTimeout(() => this.toasts.update(t => t.filter(toast => toast.id !== id)), 4000);
  }
}
