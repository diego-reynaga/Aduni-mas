import { CanDeactivateFn } from '@angular/router';

export interface HasPendingChanges {
  hasPendingChanges(): boolean;
}

export const pendingChangesGuard: CanDeactivateFn<HasPendingChanges> = (component) => {
  if (!component.hasPendingChanges()) return true;
  if (typeof window === 'undefined') return true;
  return window.confirm('Tiene cambios sin guardar. ¿Desea salir y descartarlos?');
};
