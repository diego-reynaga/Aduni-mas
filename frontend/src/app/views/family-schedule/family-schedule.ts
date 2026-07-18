import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FamilyStudent, HorarioEntry } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, staggerRows } from '../../core/animations';

@Component({
  selector: 'app-family-schedule',
  templateUrl: './family-schedule.html',
  styleUrl: '../student-schedule/student-schedule.css',
  animations: [fadeIn, staggerRows],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilySchedule implements OnInit, OnDestroy {
  private readonly portal = inject(PortalService);
  private readonly router = inject(Router);

  readonly students = signal<FamilyStudent[]>([]);
  readonly horarios = signal<HorarioEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  
  readonly selectedCode = computed(() => this.portal.familySelectedCode());
  readonly selectedStudent = computed<FamilyStudent | null>(
    () => this.students().find((student) => student.codigo === this.selectedCode()) ?? null,
  );

  readonly dias = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
  ];

  private intervalId: any;
  readonly currentTime = signal(new Date());

  constructor() {
    if (!this.portal.familySelectedCode()) {
      this.router.navigate(['/familia/selector']);
      return;
    }

    this.portal.familyPortal().subscribe({
      next: (payload) => {
        this.students.set(payload.students);
      },
      error: () => this.error.set('No se pudieron cargar los estudiantes.'),
    });

    effect(() => {
      const codigo = this.selectedCode();
      if (codigo) {
        this.cargarHorarios(codigo);
      }
    });
  }

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.currentTime.set(new Date());
    }, 60000); // Actualizar cada minuto
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private cargarHorarios(codigo: string) {
    this.loading.set(true);
    this.hasReceso.set(false);
    this.portal.getRecesoEstudiante(codigo).subscribe({
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

    this.portal.getHorarioEstudiante(codigo).subscribe({
      next: (data) => {
        this.horarios.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el horario de este estudiante.');
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
