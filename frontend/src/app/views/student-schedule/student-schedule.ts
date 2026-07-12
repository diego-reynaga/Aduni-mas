import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { HorarioEntry } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, staggerRows } from '../../core/animations';

@Component({
  selector: 'app-student-schedule',
  templateUrl: './student-schedule.html',
  styleUrl: './student-schedule.css',
  animations: [fadeIn, staggerRows],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentSchedule implements OnInit {
  private readonly portal = inject(PortalService);
  
  readonly horarios = signal<HorarioEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly dias = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
  ];

  readonly horasUnicas = computed(() => {
    const horas = new Set<string>();
    
    // Añadir cuadrícula base (08:00 a 15:00 en intervalos de 1 hora)
    const base = [
      '08:00-09:00', '09:00-10:00', '10:00-11:00', 
      '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00'
    ];
    base.forEach(h => horas.add(h));

    this.horarios().forEach(h => horas.add(`${h.horaInicio}-${h.horaFin}`));
    return Array.from(horas).sort();
  });

  private intervalId: any;
  readonly currentTime = signal(new Date());

  ngOnInit() {
    this.cargarHorarios();
    this.intervalId = setInterval(() => {
      this.currentTime.set(new Date());
    }, 60000); // Actualizar cada minuto
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private cargarHorarios() {
    this.hasReceso.set(false);
    this.portal.getMiReceso().subscribe({
      next: (res) => {
        if (res.recesoInicio && res.recesoFin) {
          this.hasReceso.set(true);
          this.recesoStart.set(res.recesoInicio);
          this.recesoEnd.set(res.recesoFin);
        } else {
          this.hasReceso.set(false);
        }
      }
    });

    this.portal.getMiHorario().subscribe({
      next: (data) => {
        this.horarios.set(data);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e.message || 'No se pudo cargar el horario');
        this.loading.set(false);
      }
    });
  }

  // === Calendar Config ===
  readonly calendarStartHour = signal(8);   // 08:00
  readonly calendarEndHour   = signal(15);  // 15:00
  readonly intervalMinutes   = signal(60);  // 1h slots visually

  // --- Receso (Break) ---
  readonly hasReceso = signal(false);
  readonly recesoStart = signal('10:30');
  readonly recesoEnd = signal('11:00');

  // --- Modal Detalles ---
  readonly selectedHorarioDetail = signal<HorarioEntry | null>(null);

  verDetalle(h: HorarioEntry) {
    this.selectedHorarioDetail.set(h);
  }

  cerrarDetalle() {
    this.selectedHorarioDetail.set(null);
  }

  get PIXELS_PER_MINUTE(): number { return 90 / this.intervalMinutes(); }
  get CALENDAR_START_MINUTES() { return this.calendarStartHour() * 60; }
  get CALENDAR_END_MINUTES()   { return this.calendarEndHour() * 60; }

  get timeLabels(): string[] {
    const labels = [];
    const end = this.calendarEndHour();
    for (let h = this.calendarStartHour(); h <= end; h++) {
      labels.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return labels;
  }

  getGridRows(): string[] {
    return this.timeLabels;
  }

  get calendarBodyHeight(): string {
    const totalMinutes = this.CALENDAR_END_MINUTES - this.CALENDAR_START_MINUTES;
    return `${totalMinutes * this.PIXELS_PER_MINUTE}px`;
  }

  timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  getTop(horaInicio: string): string {
    const mins = this.timeToMinutes(horaInicio);
    const offset = mins - this.CALENDAR_START_MINUTES;
    return `${offset * this.PIXELS_PER_MINUTE}px`;
  }

  getHeight(horaInicio: string, horaFin: string): string {
    const start = this.timeToMinutes(horaInicio);
    const end = this.timeToMinutes(horaFin);
    return `${(end - start) * this.PIXELS_PER_MINUTE}px`;
  }

  getMateriaColorClass(materia: string): string {
    if (!materia) return 'grad-1';
    const hash = materia.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['grad-1', 'grad-2', 'grad-3', 'grad-4', 'grad-5', 'grad-6', 'grad-7', 'grad-8', 'grad-9', 'grad-10'];
    return colors[hash % colors.length];
  }

  esClaseActual(h: HorarioEntry): boolean {
    const now = this.currentTime();
    let currentDay = now.getDay();
    if (currentDay === 0) currentDay = 7;
    if (h.diaSemana !== currentDay) return false;
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    return timeStr >= h.horaInicio && timeStr < h.horaFin;
  }
}
