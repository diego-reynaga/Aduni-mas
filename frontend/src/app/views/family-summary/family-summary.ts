import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FamilyStudent } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, staggerRows } from '../../core/animations';

@Component({
  selector: 'app-family-summary',
  imports: [DecimalPipe],
  templateUrl: './family-summary.html',
  styleUrl: './family-summary.css',
  animations: [fadeIn, staggerRows],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilySummary {
  private readonly portal = inject(PortalService);
  private readonly router = inject(Router);

  readonly students = signal<FamilyStudent[]>([]);
  readonly error = signal('');
  
  readonly selectedCode = computed(() => this.portal.familySelectedCode());
  readonly selectedStudent = computed<FamilyStudent | null>(
    () => this.students().find((student) => student.codigo === this.selectedCode()) ?? null,
  );

  constructor() {
    if (!this.portal.familySelectedCode()) {
      this.router.navigate(['/familia/selector']);
      return;
    }

    this.portal.familyPortal().subscribe({
      next: (payload) => {
        this.students.set(payload.students);
      },
      error: () => this.error.set('No se pudo cargar el portal familiar.'),
    });
  }
}
