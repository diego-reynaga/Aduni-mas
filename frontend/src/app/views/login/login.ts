import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { supabase } from '../../core/supabase.client';
import { ROLE_HOME } from '../../core/models';
import { fadeIn } from '../../core/animations';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);

  readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)],
    }),
  });

  submit(): void {
    this.error.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Ingrese correo y contraseña institucional.');
      return;
    }

    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (session) => {
        this.loading.set(false);
        void this.router.navigate([ROLE_HOME[session.preferredRole]]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'No se pudo iniciar sesión. Verifique sus credenciales.');
        supabase.rpc('registrar_intento_login_fallido', {
          p_email: this.form.getRawValue().username,
          p_detalle: { error: err.message || 'Error de login' }
        }).then(
          (res) => { if (res.error) console.error('Error registrando login fallido:', res.error); },
          (e: unknown) => console.error('Excepción en rpc:', e)
        );
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }
}
