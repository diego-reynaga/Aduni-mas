import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { EstudianteApoderadoResponse, PersonaResponse, PersonaRequest } from '../../core/models';
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
  readonly editingId = signal<number | null>(null);

  // --- UI State ---
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadingVinculos = signal(false);
  readonly showQuickCreate = signal(false);
  readonly savingQuick = signal(false);
  readonly confirmDelete = signal<EstudianteApoderadoResponse | null>(null);
  readonly searchVinculos = signal('');
  readonly studentSearch = signal('');
  readonly parentSearch = signal('');

  // --- Toasts ---
  readonly toasts = signal<{id: number, msg: string, type: 'success' | 'error'}[]>([]);
  private toastIdCounter = 0;

  // --- KPIs ---
  readonly totalEstudiantes = computed(() => this.estudiantes().length);
  readonly totalPadres = computed(() => this.padres().length);
  readonly totalVinculos = computed(() => this.vinculos().length);

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

  readonly filteredVinculos = computed(() => {
    const q = this.searchVinculos().toLowerCase();
    if (!q) return this.vinculos();
    return this.vinculos().filter(v =>
      v.padreNombreCompleto.toLowerCase().includes(q) ||
      v.parentesco.toLowerCase().includes(q) ||
      (v.padreDocumento || '').toLowerCase().includes(q) ||
      (v.padreTelefono || '').toLowerCase().includes(q) ||
      (v.padreCorreo || '').toLowerCase().includes(q)
    );
  });

  // --- Student info for display ---
  readonly selectedStudentInfo = computed(() => {
    const s = this.selectedStudent();
    if (!s) return null;
    return {
      id: s.id,
      nombre: `${s.apellidos}, ${s.nombres}`,
      codigo: s.codigo || '—',
      documento: s.documentoIdentidad,
      vinculosCount: this.vinculos().length,
    };
  });

  // --- Forms ---
  readonly form = new FormGroup({
    padreFamiliaId: new FormControl<number | null>(null, Validators.required),
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

  // --- Dropdown state ---
  readonly showStudentDropdown = signal(false);
  readonly showParentDropdown = signal(false);
  readonly studentHighlightIndex = signal(0);
  readonly parentHighlightIndex = signal(0);

  delayHideStudentDropdown() {
    setTimeout(() => this.showStudentDropdown.set(false), 200);
  }

  delayHideParentDropdown() {
    setTimeout(() => this.showParentDropdown.set(false), 200);
  }

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
        if (this.estudiantes().length > 0) {
          this.selectStudent(this.estudiantes()[0]);
        }
      },
      error: () => {
        this.showToast('No se pudo cargar el directorio.', 'error');
        this.loading.set(false);
      },
    });
  }

  // --- Student selection ---
  selectStudent(student: PersonaResponse | null) {
    this.selectedStudent.set(student);
    this.vinculos.set([]);
    this.cancelEdit();
    this.showStudentDropdown.set(false);
    this.studentSearch.set('');
    if (student) this.loadVinculos(student.id);
  }

  selectStudentById(id: number) {
    const student = this.estudiantes().find(e => e.id === id);
    if (student) this.selectStudent(student);
  }

  studentKeydown(event: KeyboardEvent) {
    const list = this.filteredEstudiantes();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.studentHighlightIndex.set(Math.min(this.studentHighlightIndex() + 1, list.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.studentHighlightIndex.set(Math.max(this.studentHighlightIndex() - 1, 0));
    } else if (event.key === 'Enter' && list.length > 0) {
      event.preventDefault();
      this.selectStudent(list[this.studentHighlightIndex()]);
    } else if (event.key === 'Escape') {
      this.showStudentDropdown.set(false);
    }
  }

  parentKeydown(event: KeyboardEvent) {
    const list = this.filteredPadres();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.parentHighlightIndex.set(Math.min(this.parentHighlightIndex() + 1, list.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.parentHighlightIndex.set(Math.max(this.parentHighlightIndex() - 1, 0));
    } else if (event.key === 'Enter' && list.length > 0) {
      event.preventDefault();
      this.selectParent(list[this.parentHighlightIndex()]);
    } else if (event.key === 'Escape') {
      this.showParentDropdown.set(false);
    }
  }

  selectParent(parent: PersonaResponse) {
    this.form.patchValue({ padreFamiliaId: parent.id });
    this.showParentDropdown.set(false);
    this.parentSearch.set(`${parent.apellidos}, ${parent.nombres} (${parent.documentoIdentidad})`);
  }

  clearParent() {
    this.form.patchValue({ padreFamiliaId: null });
    this.parentSearch.set('');
  }

  private loadVinculos(studentId: number) {
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
        this.selectParent(created);
        this.showQuickCreate.set(false);
        this.quickForm.reset({ nombres: '', apellidos: '', documentoIdentidad: '', telefono: '', correo: '', ocupacion: '' });
        this.showToast('Apoderado creado y vinculado.', 'success');
        this.savingQuick.set(false);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Error al crear apoderado.', 'error');
        this.savingQuick.set(false);
      },
    });
  }

  // --- CRUD vínculos ---
  save() {
    const studentId = this.selectedStudent()?.id;
    if (!studentId || this.form.invalid) return;
    this.saving.set(true);
    const request = { padreFamiliaId: this.form.value.padreFamiliaId!, parentesco: this.form.value.parentesco!, principal: this.form.value.principal! };
    const editId = this.editingId();
    const action = editId
      ? this.portal.actualizarApoderado(studentId, editId, request)
      : this.portal.asignarApoderado(studentId, request);
    action.subscribe({
      next: () => {
        this.showToast(editId ? 'Vínculo actualizado.' : 'Apoderado vinculado.', 'success');
        this.cancelEdit();
        this.loadVinculos(studentId);
        this.saving.set(false);
      },
      error: err => {
        this.showToast(err?.error?.message ?? 'Error al guardar.', 'error');
        this.saving.set(false);
      },
    });
  }

  edit(row: EstudianteApoderadoResponse) {
    this.editingId.set(row.id);
    this.form.setValue({ padreFamiliaId: row.padreFamiliaId, parentesco: row.parentesco, principal: row.principal });
    const parent = this.padres().find(p => p.id === row.padreFamiliaId);
    if (parent) this.parentSearch.set(`${parent.apellidos}, ${parent.nombres} (${parent.documentoIdentidad})`);
    this.showQuickCreate.set(false);
  }

  confirmRemove(row: EstudianteApoderadoResponse) {
    this.confirmDelete.set(row);
  }

  executeRemove() {
    const row = this.confirmDelete();
    const studentId = this.selectedStudent()?.id;
    if (!row || !studentId) return;
    this.saving.set(true);
    this.portal.removerApoderado(studentId, row.id).subscribe({
      next: () => {
        this.showToast('Vínculo eliminado.', 'success');
        this.loadVinculos(studentId);
        this.confirmDelete.set(null);
        this.saving.set(false);
      },
      error: err => {
        this.showToast(err?.error?.message ?? 'Error al eliminar.', 'error');
        this.saving.set(false);
      },
    });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form.reset({ padreFamiliaId: null, parentesco: 'MADRE', principal: false });
    this.parentSearch.set('');
  }

  // --- Toast ---
  showToast(msg: string, type: 'success' | 'error') {
    const id = this.toastIdCounter++;
    this.toasts.update(t => [...t, { id, msg, type }]);
    setTimeout(() => this.toasts.update(t => t.filter(toast => toast.id !== id)), 4000);
  }
}
