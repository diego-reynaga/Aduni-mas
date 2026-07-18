import { Injectable, signal } from '@angular/core';

export type ConfirmationTone = 'danger' | 'primary';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: ConfirmationTone;
}

type PendingConfirmation = Required<ConfirmationOptions> & {
  resolve: (confirmed: boolean) => void;
};

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  readonly pending = signal<PendingConfirmation | null>(null);

  confirm(options: ConfirmationOptions): Promise<boolean> {
    this.dismiss(false);
    return new Promise<boolean>((resolve) => {
      this.pending.set({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        tone: options.tone ?? 'danger',
        resolve,
      });
    });
  }

  accept(): void {
    this.dismiss(true);
  }

  cancel(): void {
    this.dismiss(false);
  }

  private dismiss(confirmed: boolean): void {
    const current = this.pending();
    if (!current) return;
    this.pending.set(null);
    current.resolve(confirmed);
  }
}
