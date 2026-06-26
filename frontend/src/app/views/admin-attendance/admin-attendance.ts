import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { PortalService } from '../../core/portal.service';
import * as Academico from '../../core/academico.models';

type Tab = 'estudiantes' | 'docentes' | 'reportes';

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-attendance.html',
  styleUrl: './admin-attendance.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAttendance {
  private readonly portal = inject(PortalService);

  readonly activeTab = signal<Tab>('estudiantes');
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly loading = signal(false);

  // Tab: Asistencia Estudiantes
  readonly periodos = signal<Academico.PeriodoAcademicoResponse[]>([]);
  readonly asignaciones = signal<any[]>([]);
  readonly selectedPeriodoId = signal<number | null>(null);
  readonly selectedAsignacionId = signal<number | null>(null);
  readonly selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly estudiantesAsistencia = signal<any[]>([]);

  // Mapa de estados: key = personaId, value = { estado, observacion }
  readonly registrosForm = signal<Record<number, { estado: string; observacion: string }>>({});

  // Tab: Asistencia Docentes
  readonly docentesAsistencia = signal<any[]>([]);
  readonly docDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly registrosDocentes = signal<Record<number, { estado: string; observacion: string }>>({});

  // Tab: Reportes
  readonly reporteEstudiantes = signal<any[]>([]);
  readonly reportDateDesde = signal<string>('');
  readonly reportDateHasta = signal<string>('');
  readonly reportAsignacionId = signal<number | null>(null);

  readonly ESTADOS = ['PRESENTE', 'TARDANZA', 'FALTA', 'JUSTIFICADO'];

  constructor() {
    this.loadPeriodos();
  }

  setTab(tab: Tab) { this.activeTab.set(tab); }

  loadPeriodos() {
    this.portal.getGestiones().subscribe({
      next: (gestiones) => {
        const activa = gestiones.find(g => g.activa);
        if (activa) {
          this.portal.getPeriodos(activa.id).subscribe({
            next: (ps) => this.periodos.set(ps),
            error: () => this.error.set('Error al cargar periodos.')
          });
        }
      },
      error: () => this.error.set('Error al cargar gestiones.')
    });
  }

  onPeriodoChange(periodoId: number) {
    this.selectedPeriodoId.set(periodoId);
    this.loadAsignaciones(periodoId);
  }

  loadAsignaciones(periodoId: number) {
    this.portal.getAsignaciones(periodoId).subscribe({
      next: (res) => this.asignaciones.set(res),
      error: () => this.error.set('Error al cargar asignaciones.')
    });
  }

  loadEstudiantesAsistencia() {
    const adId = this.selectedAsignacionId();
    const fecha = this.selectedDate();
    if (!adId || !fecha) return;
    this.loading.set(true);
    this.portal.getAsistenciasCurso(adId, fecha).subscribe({
      next: (res) => {
        this.estudiantesAsistencia.set(res);
        const registros: Record<number, { estado: string; observacion: string }> = {};
        for (const est of res) {
          registros[est.personaId] = {
            estado: est.estado || 'PRESENTE',
            observacion: est.observacion || ''
          };
        }
        this.registrosForm.set(registros);
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar asistencias.'); this.loading.set(false); }
    });
  }

  guardarAsistenciaEstudiantes() {
    const adId = this.selectedAsignacionId();
    const fecha = this.selectedDate();
    if (!adId || !fecha) return;
    this.loading.set(true);
    const registros = Object.entries(this.registrosForm()).map(([personaId, val]) => ({
      estudianteId: Number(personaId),
      estado: val.estado as any,
      observacion: val.observacion || undefined
    }));
    this.portal.guardarAsistenciaBatch({ asignacionDocenteId: adId, fecha, registros }).subscribe({
      next: () => {
        this.successMessage.set('Asistencia guardada correctamente.');
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al guardar asistencia.'); this.loading.set(false); }
    });
  }

  // --- Docentes ---
  loadDocentesAsistencia() {
    const fecha = this.docDate();
    if (!fecha) return;
    this.loading.set(true);
    this.portal.getAsistenciasDocentes(fecha).subscribe({
      next: (res) => {
        this.docentesAsistencia.set(res);
        const registros: Record<number, { estado: string; observacion: string }> = {};
        for (const d of res) {
          registros[d.personaId] = {
            estado: d.estado || 'PRESENTE',
            observacion: d.observacion || ''
          };
        }
        this.registrosDocentes.set(registros);
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar asistencia de docentes.'); this.loading.set(false); }
    });
  }

  guardarAsistenciaDocentes() {
    const fecha = this.docDate();
    if (!fecha) return;
    this.loading.set(true);
    const registros = Object.entries(this.registrosDocentes()).map(([personaId, val]) => ({
      estudianteId: Number(personaId),
      estado: val.estado as any,
      observacion: val.observacion || undefined
    }));
    this.portal.guardarAsistenciaDocentes({ fecha, registros }).subscribe({
      next: () => {
        this.successMessage.set('Asistencia de docentes guardada.');
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al guardar.'); this.loading.set(false); }
    });
  }

  // --- Reportes ---
  generarReporte() {
    const adId = this.reportAsignacionId();
    const desde = this.reportDateDesde();
    const hasta = this.reportDateHasta();
    if (!adId || !desde || !hasta) return;
    this.loading.set(true);
    this.portal.getReporteAsistenciaCurso(adId, desde, hasta).subscribe({
      next: (res) => {
        this.reporteEstudiantes.set(res);
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al generar reporte.'); this.loading.set(false); }
    });
  }

  getBadgeClass(estado: string | null): string {
    switch (estado) {
      case 'PRESENTE': return 'badge-success';
      case 'TARDANZA': return 'badge-warning';
      case 'FALTA': return 'badge-danger';
      case 'JUSTIFICADO': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  }

  getPorcentajeColor(pct: number): string {
    if (pct >= 90) return 'color: green';
    if (pct >= 75) return 'color: orange';
    return 'color: red';
  }
}
