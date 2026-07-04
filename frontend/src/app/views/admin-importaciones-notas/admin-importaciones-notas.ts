import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ErrorImportacionNotas, ImportacionNotasDetalle, ImportacionNotasHistorial } from '../../core/models';
import { NotasService } from '../../core/notas.service';
import { fadeIn } from '../../core/animations';

@Component({
  selector: 'app-admin-importaciones-notas',
  templateUrl: './admin-importaciones-notas.html',
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminImportacionesNotas {
  private readonly notasService = inject(NotasService);

  readonly history = signal<ImportacionNotasHistorial[]>([]);
  readonly selected = signal<ImportacionNotasDetalle | null>(null);
  readonly errors = signal<ErrorImportacionNotas[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.loadHistory();
  }

  selectImport(row: ImportacionNotasHistorial): void {
    this.error.set('');
    this.notasService.obtenerImportacionNotas(row.idImportacion).subscribe({
      next: (detail) => this.selected.set(detail),
      error: (error) => this.error.set(error?.error?.message ?? 'No se pudo cargar el detalle de importación.'),
    });
    this.notasService.listarErroresImportacionNotas(row.idImportacion).subscribe({
      next: (items) => this.errors.set(items),
      error: () => this.errors.set([]),
    });
  }

  statusClass(status: string): string {
    if (status === 'PROCESADA') {
      return 'status-pill is-good';
    }
    if (status === 'FALLIDA') {
      return 'status-pill is-danger';
    }
    return 'status-pill is-warning';
  }

  downloadErrors(): void {
    const errors = this.errors();
    if (errors.length === 0 || !this.selected()) {
      return;
    }
    const header = ['Fila', 'Estudiante', 'Campo', 'Descripcion'];
    const body = errors.map((item) => [
      item.filaExcel ?? '',
      item.estudianteTexto ?? '',
      item.campo,
      item.descripcionError,
    ]);
    const csv = [header, ...body]
      .map((columns) => columns.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `errores-importacion-${this.selected()?.idImportacion}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private loadHistory(): void {
    this.loading.set(true);
    this.notasService.listarImportacionesNotas().subscribe({
      next: (rows) => {
        this.loading.set(false);
        this.history.set(rows);
        if (rows.length > 0) {
          this.selectImport(rows[0]);
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error?.error?.message ?? 'No se pudo cargar el historial de importaciones.');
      },
    });
  }
}
