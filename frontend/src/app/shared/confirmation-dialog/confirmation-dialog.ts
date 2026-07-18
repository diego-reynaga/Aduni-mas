import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, effect, inject } from '@angular/core';
import { ConfirmationService } from '../../core/confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialog {
  readonly confirmation = inject(ConfirmationService);
  private readonly document = inject(DOCUMENT);

  @ViewChild('cancelButton') private cancelButton?: ElementRef<HTMLButtonElement>;

  constructor() {
    effect(() => {
      if (!this.confirmation.pending()) return;
      queueMicrotask(() => this.cancelButton?.nativeElement.focus());
    });
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.confirmation.pending()) this.confirmation.cancel();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const dialog = this.document.getElementById('confirmation-dialog');
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (focusable.length < 2) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
