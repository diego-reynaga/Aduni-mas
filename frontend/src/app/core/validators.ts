import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const inicio = control.get('fechaInicio')?.value;
  const fin = control.get('fechaFin')?.value;
  if (inicio && fin && new Date(inicio) > new Date(fin)) {
    return { dateRangeInvalid: true };
  }
  return null;
};

export const passwordStrengthValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value || '';
  if (!value) return null;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSymbol = /[@$!%*?&]/.test(value);
  if (value.length >= 8 && hasUpper && hasLower && hasDigit && hasSymbol) return null;
  return { passwordWeak: true };
};
