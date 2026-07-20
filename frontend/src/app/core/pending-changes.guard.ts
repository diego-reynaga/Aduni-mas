import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmationService } from './confirmation.service';

export interface HasPendingChanges {
  hasPendingChanges(): boolean;
}

export const pendingChangesGuard: CanDeactivateFn<HasPendingChanges> = (component) => {
  if (!component.hasPendingChanges()) return true;
  if (typeof window === 'undefined') return true;
  return inject(ConfirmationService).confirm({
    title: 'Cambios sin guardar',
    message: 'Si sale ahora, se descartarán las modificaciones realizadas en el acta.',
    confirmLabel: 'Salir sin guardar',
    tone: 'danger',
  });
};
