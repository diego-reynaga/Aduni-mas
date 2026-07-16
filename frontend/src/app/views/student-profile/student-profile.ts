import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudentProfileData } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn } from '../../core/animations';

@Component({
  selector: 'app-student-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './student-profile.html',
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentProfile {
  private readonly portal = inject(PortalService);
  private readonly fb = inject(FormBuilder);

  readonly profile = signal<StudentProfileData | null>(null);
  readonly error = signal('');
  readonly success = signal('');
  readonly isSaving = signal(false);

  readonly form = this.fb.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    fechaNacimiento: [''],
    genero: [''],
    telefono: [''],
    direccion: [''],
    correo: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.portal.studentProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.form.patchValue({
          nombres: data.nombres,
          apellidos: data.apellidos,
          fechaNacimiento: data.fechaNacimiento ? data.fechaNacimiento.split('T')[0] : '',
          genero: data.genero,
          telefono: data.telefono,
          direccion: data.direccion,
          correo: data.correo,
        });
      },
      error: () => this.error.set('No se pudo cargar el perfil.'),
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.error.set('');
    this.success.set('');
    this.portal.updateStudentProfile(this.form.value as Partial<StudentProfileData>).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.success.set('Perfil actualizado exitosamente.');
        this.isSaving.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al guardar el perfil.');
        this.isSaving.set(false);
      },
    });
  }
}
