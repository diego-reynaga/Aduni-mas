import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstudianteApoderadoResponse, PersonaResponse } from '../../core/models';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-admin-family-links',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-family-links.html',
  styleUrl: './admin-family-links.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFamilyLinks {
  private readonly portal = inject(PortalService);
  readonly estudiantes = signal<PersonaResponse[]>([]);
  readonly padres = signal<PersonaResponse[]>([]);
  readonly vinculos = signal<EstudianteApoderadoResponse[]>([]);
  readonly selectedStudentId = signal<number | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly error = signal('');
  readonly success = signal('');

  readonly form = new FormGroup({
    padreFamiliaId: new FormControl<number | null>(null, Validators.required),
    parentesco: new FormControl('MADRE', { nonNullable: true, validators: [Validators.required] }),
    principal: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    this.portal.getPersonas().subscribe({
      next: people => {
        this.estudiantes.set(people.filter(person => person.tipoPersona === 'ESTUDIANTE'));
        this.padres.set(people.filter(person => person.tipoPersona === 'PADRE_FAMILIA'));
        const firstStudent = this.estudiantes()[0]?.id ?? null;
        this.selectedStudentId.set(firstStudent);
        if (firstStudent) this.loadLinks(firstStudent);
      },
      error: () => this.error.set('No se pudo cargar el directorio de estudiantes y apoderados.'),
    });
  }

  selectStudent(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.selectedStudentId.set(id);
    this.vinculos.set([]);
    this.cancelEdit();
    if (id) this.loadLinks(id);
  }

  save(): void {
    const studentId = this.selectedStudentId();
    if (!studentId || this.form.invalid) return;
    const request = this.form.getRawValue() as { padreFamiliaId: number; parentesco: string; principal: boolean };
    const editId = this.editingId();
    const action = editId
      ? this.portal.actualizarApoderado(studentId, editId, request)
      : this.portal.asignarApoderado(studentId, request);
    action.subscribe({
      next: () => {
        this.success.set(editId ? 'Vínculo familiar actualizado.' : 'Apoderado vinculado correctamente.');
        this.cancelEdit();
        this.loadLinks(studentId);
      },
      error: err => this.error.set(err?.error?.message ?? 'No se pudo guardar el vínculo familiar.'),
    });
  }

  edit(row: EstudianteApoderadoResponse): void {
    this.editingId.set(row.id);
    this.form.setValue({ padreFamiliaId: row.padreFamiliaId, parentesco: row.parentesco, principal: row.principal });
  }

  remove(row: EstudianteApoderadoResponse): void {
    const studentId = this.selectedStudentId();
    if (!studentId || !confirm(`¿Desvincular a ${row.padreNombreCompleto}?`)) return;
    this.portal.removerApoderado(studentId, row.id).subscribe({
      next: () => { this.success.set('Vínculo eliminado.'); this.loadLinks(studentId); },
      error: err => this.error.set(err?.error?.message ?? 'No se pudo eliminar el vínculo.'),
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ padreFamiliaId: null, parentesco: 'MADRE', principal: false });
  }

  private loadLinks(studentId: number): void {
    this.portal.getApoderados(studentId).subscribe({
      next: rows => this.vinculos.set(rows),
      error: () => this.error.set('No se pudieron cargar los vínculos del estudiante.'),
    });
  }
}
