import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortalService } from '../../core/portal.service';
import { 
  CronogramaResponse, 
  PagoResponse, 
  ConceptoCobroResponse, 
  MetodoPago, 
  PagoRequest, 
  CronogramaRequest,
  CuotaProgramadaRequest
} from '../../core/models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-pagos.html',
  styleUrl: './admin-pagos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPagosComponent implements OnInit {
  private portal = inject(PortalService);

  activeTab = signal<'dashboard' | 'cronogramas' | 'registrar' | 'historial'>('dashboard');

  // --- State ---
  conceptos = signal<ConceptoCobroResponse[]>([]);
  cronogramas = signal<CronogramaResponse[]>([]);
  pagos = signal<PagoResponse[]>([]);

  // --- Forms State ---
  searchEstudianteId = signal<number | null>(null);

  // Nuevo Cronograma
  ncEstudianteId = signal<number>(0);
  ncObservacion = signal<string>('');
  ncCuotas = signal<CuotaProgramadaRequest[]>([]);
  
  // Registrar Pago
  rpEstudianteId = signal<number>(0);
  rpMonto = signal<number>(0);
  rpMetodo = signal<MetodoPago>('EFECTIVO');
  rpConceptoId = signal<number | null>(null);
  rpFecha = signal<string>(new Date().toISOString().split('T')[0]);
  rpComprobante = signal<string>('');
  rpObservacion = signal<string>('');

  async ngOnInit() {
    await this.loadConceptos();
    await this.loadPagos();
  }

  async loadConceptos() {
    const res = await firstValueFrom(this.portal.getConceptosCobro());
    this.conceptos.set(res);
  }

  async loadPagos() {
    const res = await firstValueFrom(this.portal.getPagos());
    this.pagos.set(res);
  }

  async loadCronogramas() {
    const res = await firstValueFrom(this.portal.getCronogramas());
    this.cronogramas.set(res);
  }

  setTab(tab: 'dashboard' | 'cronogramas' | 'registrar' | 'historial') {
    this.activeTab.set(tab);
    if (tab === 'cronogramas' && this.cronogramas().length === 0) {
      this.loadCronogramas();
    }
  }

  // --- Actions ---
  addCuotaRow() {
    this.ncCuotas.update(c => [...c, {
      numeroCuota: c.length + 1,
      conceptoCobroId: this.conceptos()[0]?.id || 0,
      fechaVencimiento: new Date().toISOString().split('T')[0],
      montoProgramado: 0
    }]);
  }

  removeCuotaRow(index: number) {
    this.ncCuotas.update(c => c.filter((_, i) => i !== index));
  }

  async createCronograma() {
    if (!this.ncEstudianteId() || this.ncCuotas().length === 0) return;
    
    const req: CronogramaRequest = {
      estudianteId: this.ncEstudianteId(),
      cuotas: this.ncCuotas(),
      observacion: this.ncObservacion()
    };

    await firstValueFrom(this.portal.crearCronograma(req));
    this.ncEstudianteId.set(0);
    this.ncCuotas.set([]);
    this.ncObservacion.set('');
    await this.loadCronogramas();
    alert('Cronograma creado exitosamente');
  }

  async registrarPago() {
    if (!this.rpEstudianteId() || !this.rpMonto()) return;

    const req: PagoRequest = {
      estudianteId: this.rpEstudianteId(),
      montoPagado: this.rpMonto(),
      fechaPago: this.rpFecha(),
      metodoPago: this.rpMetodo(),
      numeroComprobante: this.rpComprobante() || undefined,
      observacion: this.rpObservacion() || undefined
    };

    await firstValueFrom(this.portal.registrarPago(req));
    this.rpEstudianteId.set(0);
    this.rpMonto.set(0);
    this.rpComprobante.set('');
    this.rpObservacion.set('');
    await this.loadPagos();
    alert('Pago registrado exitosamente');
    this.setTab('historial');
  }

  async anularPago(id: number) {
    const motivo = prompt('Motivo de anulación:');
    if (!motivo) return;
    await firstValueFrom(this.portal.anularPago(id, { motivo }));
    await this.loadPagos();
  }

  async descargarRecibo(pago: PagoResponse) {
    if (!pago.reciboGenerado) {
      // generate first
      await firstValueFrom(this.portal.generarRecibo(pago.id));
      await this.loadPagos();
    }
    
    const url = this.portal.obtenerPdfUrl(pago.id);
    window.open(url, '_blank');
  }

  // --- Computed for Dashboard ---
  totalRecaudado = computed(() => {
    return this.pagos().filter(p => !p.anulado).reduce((acc, p) => acc + p.montoPagado, 0);
  });
}
