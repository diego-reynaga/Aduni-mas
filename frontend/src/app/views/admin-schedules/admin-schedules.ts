import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, HostListener } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HorarioEntry, EntityId } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { fadeIn, slideInRight, staggerList } from '../../core/animations';

interface GradoInfo {
  id: EntityId;
  nivelEducativoNombre: string;
  nombreGrado: string;
  nombreCompleto: string;
}

interface CursoInfo {
  id: EntityId;
  materiaNombre: string;
}

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-schedules',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-schedules.html',
  styleUrl: './admin-schedules.css',
  animations: [fadeIn, slideInRight, staggerList],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSchedules implements OnInit {
  private readonly portal = inject(PortalService);
  private readonly fb = inject(FormBuilder);

  readonly grados = signal<GradoInfo[]>([]);
  readonly cursos = signal<CursoInfo[]>([]);
  readonly searchQuery = signal<string>('');
  
  readonly filteredCursos = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.cursos();
    return this.cursos().filter(c => c.materiaNombre.toLowerCase().includes(q));
  });
  readonly horarios = signal<HorarioEntry[]>([]);
  readonly horariosOriginales = signal<HorarioEntry[]>([]);
  
  readonly hasUnsavedChanges = computed(() => {
    return JSON.stringify(this.horarios()) !== JSON.stringify(this.horariosOriginales());
  });
  
  readonly selectedGradoId = signal<EntityId | null>(null);
  
  readonly loading = signal(false);
  readonly loadingCursos = signal(false);
  readonly saving = signal(false);
  readonly showEditModal = signal(false);
  readonly editingId = signal<EntityId | null>(null);
  
  // Drag to Resize State
  readonly isResizing = signal(false);
  readonly resizeState = signal<{ id: string; originalFin: string; startY: number } | null>(null);

  // === Calendar Config (configurable) ===
  readonly calendarStartHour = signal(8);   // 08:00
  readonly calendarEndHour   = signal(15);  // 15:00
  readonly intervalMinutes   = signal(60);  // 1h slots
  readonly showConfig        = signal(false);

  // Detalle
  readonly selectedHorarioDetail = signal<HorarioEntry | null>(null);

  // Receso Config
  readonly hasReceso = signal(false);
  readonly recesoStart = signal('10:30');
  readonly recesoEnd = signal('11:00');

  // Derived constants from signals
  // Each grid row is always 90px tall visually.
  // ppm scales inversely so a 1h block always spans (60/interval) rows.
  get PIXELS_PER_MINUTE(): number { return 90 / this.intervalMinutes(); }

  get CALENDAR_START_MINUTES() { return this.calendarStartHour() * 60; }
  get CALENDAR_END_MINUTES()   { return this.calendarEndHour() * 60; }
  
  readonly toasts = signal<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

  readonly dias = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' }
  ];

  readonly horasUnicas = computed(() => {
    const horas = new Set<string>();
    
    // Añadir cuadrícula base (08:00 a 15:00 en intervalos de 1 hora)
    const base = [
      '08:00-09:00', '09:00-10:00', '10:00-11:00', 
      '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00'
    ];
    base.forEach(h => horas.add(h));

    // Añadir horarios dinámicos extraídos de la BD (ej. bloques especiales)
    this.horarios().forEach(h => horas.add(`${h.horaInicio}-${h.horaFin}`));
    return Array.from(horas).sort();
  });

  readonly form = this.fb.group({
    cursoId: ['', Validators.required],
    diaSemana: [1, [Validators.required, Validators.min(1), Validators.max(7)]],
    horaInicio: ['', Validators.required],
    horaFin: ['', Validators.required],
    aula: [''],
  });

  ngOnInit() {
    this.cargarGrados();
  }

  // --- Calendar Math ---
  timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  getTop(horaInicio: string): string {
    const startMins = this.timeToMinutes(horaInicio);
    const offset = startMins - this.CALENDAR_START_MINUTES;
    return `${Math.max(0, offset * this.PIXELS_PER_MINUTE)}px`;
  }

  getHeight(horaInicio: string, horaFin: string): string {
    const durationMins = this.timeToMinutes(horaFin) - this.timeToMinutes(horaInicio);
    return `${Math.max(20, durationMins * this.PIXELS_PER_MINUTE)}px`; // min height 20px
  }

  getGridRows(): string[] {
    const rows: string[] = [];
    for (let m = this.CALENDAR_START_MINUTES; m <= this.CALENDAR_END_MINUTES; m += this.intervalMinutes()) {
      rows.push(this.minutesToTime(m));
    }
    return rows;
  }

  // === Calendar Config Handlers ===
  get calendarBodyHeight(): string {
    const totalMins = this.CALENDAR_END_MINUTES - this.CALENDAR_START_MINUTES;
    return `${totalMins * this.PIXELS_PER_MINUTE}px`;
  }

  setStartHour(val: string) {
    const h = parseInt(val, 10);
    if (!isNaN(h) && h >= 0 && h < this.calendarEndHour()) {
      this.calendarStartHour.set(h);
    }
  }

  setEndHour(val: string) {
    const h = parseInt(val, 10);
    if (!isNaN(h) && h > this.calendarStartHour() && h <= 23) {
      this.calendarEndHour.set(h);
    }
  }

  setInterval(mins: number) {
    this.intervalMinutes.set(mins);
    // PIXELS_PER_MINUTE re-scales automatically via the getter.
    // Real block durations (horaFin) are preserved — visual sizes change automatically.
  }

  toggleReceso() {
    this.hasReceso.update(v => !v);
    this.saveRecesoConfig();
  }

  setRecesoStart(time: string) {
    this.recesoStart.set(time);
    this.saveRecesoConfig();
  }

  setRecesoEnd(time: string) {
    this.recesoEnd.set(time);
    this.saveRecesoConfig();
  }

  private saveRecesoConfig() {
    const gradoId = this.selectedGradoId();
    if (!gradoId) return;
    const inicio = this.hasReceso() ? this.recesoStart() : null;
    const fin = this.hasReceso() ? this.recesoEnd() : null;
    this.portal.updateGradoReceso(gradoId, inicio, fin).subscribe();
  }

  toggleConfig() {
    this.showConfig.update(v => !v);
  }

  /** Height (px) that a dropped block will have for the current interval */
  get chipHeight(): string {
    const px = this.intervalMinutes() * this.PIXELS_PER_MINUTE;
    return `${Math.max(36, px)}px`;
  }
  // ----------------------

  private cargarGrados() {
    this.loading.set(true);
    this.portal.getNiveles().subscribe({
      next: (niveles) => {
        this.fetchTodosLosGrados(niveles.map(n => n.id));
      },
      error: () => {
        this.showToast('Error al cargar la estructura académica', 'error');
        this.loading.set(false);
      }
    });
  }

  private fetchTodosLosGrados(nivelesIds: string[]) {
    let gradosCargados: GradoInfo[] = [];
    let pending = nivelesIds.length;
    
    if (pending === 0) {
      this.loading.set(false);
      return;
    }

    nivelesIds.forEach(id => {
      this.portal.getGrados(id).subscribe({
        next: (grados) => {
          grados.forEach(g => {
            gradosCargados.push({
              id: g.id,
              nivelEducativoNombre: g.nivelEducativoNombre,
              nombreGrado: `${g.nombre} ${g.paralelo}`,
              nombreCompleto: `${g.nivelEducativoNombre} - ${g.nombre} ${g.paralelo}`
            });
          });
          pending--;
          if (pending === 0) {
            this.grados.set(gradosCargados.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto)));
            if (this.groupedGrados().length > 0) {
              this.selectedNivelTab.set(this.groupedGrados()[0].nivel);
            }
            this.loading.set(false);
          }
        },
        error: () => {
          pending--;
          if (pending === 0) {
            this.grados.set(gradosCargados);
            if (this.groupedGrados().length > 0) {
              this.selectedNivelTab.set(this.groupedGrados()[0].nivel);
            }
            this.loading.set(false);
          }
        }
      });
    });
  }

  readonly isGradoSelectorOpen = signal(false);
  readonly gradoSearchQuery = signal('');

  readonly filteredGrados = computed(() => {
    const q = this.gradoSearchQuery().toLowerCase();
    if (!q) return this.grados();
    return this.grados().filter(g => g.nombreCompleto.toLowerCase().includes(q));
  });

  readonly groupedGrados = computed(() => {
    const filtered = this.filteredGrados();
    const groups = new Map<string, GradoInfo[]>();
    for (const g of filtered) {
      if (!groups.has(g.nivelEducativoNombre)) {
        groups.set(g.nivelEducativoNombre, []);
      }
      groups.get(g.nivelEducativoNombre)!.push(g);
    }
    return Array.from(groups.entries()).map(([nivel, grados]) => ({
      nivel,
      grados
    }));
  });

  readonly selectedNivelTab = signal<string | null>(null);

  readonly selectedGradoName = computed(() => {
    const id = this.selectedGradoId();
    if (!id) return 'Selecciona un Grado...';
    const grado = this.grados().find(g => g.id === id);
    return grado ? grado.nombreCompleto : 'Selecciona un Grado...';
  });

  selectGrado(id: EntityId) {
    if (id) {
      this.selectedGradoId.set(id);
      this.loading.set(true);
      this.hasReceso.set(false);

      this.portal.getGradoReceso(id).subscribe({
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

      this.cargarHorarios(id);
      this.cargarCursos(id);
      this.showEditModal.set(false);
    } else {
      this.selectedGradoId.set(null);
      this.horarios.set([]);
      this.horariosOriginales.set([]);
      this.cursos.set([]);
      this.showEditModal.set(false);
    }
    this.isGradoSelectorOpen.set(false);
    this.gradoSearchQuery.set('');
  }

  toggleGradoSelector() {
    this.isGradoSelectorOpen.update(v => !v);
    if (!this.isGradoSelectorOpen()) {
      this.gradoSearchQuery.set('');
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-grado-selector')) {
      this.isGradoSelectorOpen.set(false);
      this.gradoSearchQuery.set('');
    }
  }

  private cargarHorarios(gradoId: EntityId) {
    this.loading.set(true);
    this.portal.getHorariosPorGrado(gradoId).subscribe({
      next: (data) => {
        this.horarios.set(JSON.parse(JSON.stringify(data)));
        this.horariosOriginales.set(JSON.parse(JSON.stringify(data)));
        this.loading.set(false);
      },
      error: () => {
        this.showToast('Error al cargar horarios', 'error');
        this.loading.set(false);
      }
    });
  }

  private cargarCursos(gradoId: EntityId) {
    this.loadingCursos.set(true);
    this.portal.getCursos(gradoId).subscribe({
      next: (cursos) => {
        this.cursos.set(cursos.map(c => ({ id: c.id, materiaNombre: c.materiaNombre })));
        this.loadingCursos.set(false);
      },
      error: () => {
        this.loadingCursos.set(false);
      }
    });
  }

  getCursoEnCelda(diaIndex: number, horaRange: string): HorarioEntry | undefined {
    return this.horarios().find(h => 
      h.diaSemana === diaIndex && 
      `${h.horaInicio}-${h.horaFin}` === horaRange
    );
  }

  getHorarioById(id: EntityId): HorarioEntry | undefined {
    return this.horarios().find(h => h.id === id);
  }

  abrirModalNuevoCon(diaSemana: number, horaRango: string) {
    const [horaInicio, horaFin] = horaRango.split('-');
    this.form.reset({ 
      diaSemana,
      horaInicio,
      horaFin
    });
    this.editingId.set(null);
    this.showEditModal.set(true);
  }

  abrirModalNuevo() {
    this.form.reset({ diaSemana: 1 });
    this.editingId.set(null);
    this.showEditModal.set(true);
  }

  abrirPanelParaCurso(cursoId: EntityId) {
    this.form.reset({ diaSemana: 1, cursoId });
    this.editingId.set(null);
    this.showEditModal.set(true);
  }

  abrirPanelParaCursoYCelda(cursoId: EntityId, diaSemana: number, horaRango: string) {
    const [horaInicio, horaFin] = horaRango.split('-');
    this.form.reset({ 
      cursoId,
      diaSemana,
      horaInicio,
      horaFin
    });
    this.editingId.set(null);
    this.showEditModal.set(true);
  }

  // --- Drag and Drop Logic ---
  onDragStart(event: DragEvent, cursoId: EntityId) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify({ type: 'new', cursoId }));
      event.dataTransfer.effectAllowed = 'copy';
      if (event.target instanceof HTMLElement) {
        event.target.style.opacity = '0.5';
      }
    }
  }

  onDragEnd(event: DragEvent) {
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '1';
    }
  }

  onDragStartExisting(event: DragEvent, h: HorarioEntry) {
    if (this.isResizing()) {
      event.preventDefault();
      return;
    }
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify({ type: 'move', id: h.id }));
      event.dataTransfer.effectAllowed = 'move';
      if (event.target instanceof HTMLElement) {
        event.target.style.opacity = '0.5';
      }
    }
  }

  // --- Pointer Events for Resize / Move ---
  startResize(event: MouseEvent, h: HorarioEntry) {
    event.stopPropagation();
    event.preventDefault();
    this.isResizing.set(true);
    this.resizeState.set({
      id: h.id,
      originalFin: h.horaFin,
      startY: event.clientY
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isResizing() && this.resizeState()) {
      event.preventDefault();
      const state = this.resizeState()!;
      const deltaY = event.clientY - state.startY;
      const snap = this.intervalMinutes();
      const deltaMinutes = Math.round(deltaY / this.PIXELS_PER_MINUTE / snap) * snap;
      
      if (deltaMinutes !== 0) {
        const items = this.horarios();
        const index = items.findIndex(x => x.id === state.id);
        if (index > -1) {
          const originalMins = this.timeToMinutes(state.originalFin);
          let newMins = originalMins + deltaMinutes;
          const startMins = this.timeToMinutes(items[index].horaInicio);
          if (newMins <= startMins) newMins = startMins + snap;
          if (newMins > this.CALENDAR_END_MINUTES) newMins = this.CALENDAR_END_MINUTES;
          
          items[index].horaFin = this.minutesToTime(newMins);
          this.horarios.set([...items]);
        }
      }
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isResizing()) {
      this.isResizing.set(false);
      this.resizeState.set(null);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) event.currentTarget.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) event.currentTarget.classList.remove('drag-over');
  }

  onDrop(event: DragEvent, dia: number) {
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) event.currentTarget.classList.remove('drag-over');
    
    if (event.dataTransfer) {
      let dataStr = event.dataTransfer.getData('application/json');
      // Fallback para cursos arrastrados si usaban text/plain antes
      if (!dataStr) {
        const plain = event.dataTransfer.getData('text/plain');
        if (plain) dataStr = JSON.stringify({ type: 'new', cursoId: plain });
      }
      
      if (dataStr) {
        const data = JSON.parse(dataStr);
        let horaInicioStr = '08:00';
        let horaFinStr = '09:00';
        
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const containerOffsetY = event.clientY - rect.top;
        
        const snap = this.intervalMinutes();
        const startMins = this.CALENDAR_START_MINUTES + Math.floor(containerOffsetY / this.PIXELS_PER_MINUTE / snap) * snap;
        horaInicioStr = this.minutesToTime(startMins);
        horaFinStr = this.minutesToTime(Math.min(this.CALENDAR_END_MINUTES, startMins + snap));

        if (data.type === 'new') {
          const curso = this.cursos().find(c => c.id === data.cursoId);
          if (curso) {
            const tempId = 'temp_' + Math.random().toString(36).substring(2, 11);
            const newItem: HorarioEntry = {
              id: tempId,
              gradoId: this.selectedGradoId()!,
              cursoId: curso.id,
              curso: curso.materiaNombre,
              materia: curso.materiaNombre,
              diaSemana: dia,
              diaNombre: this.dias.find(d => d.value === dia)?.label || '',
              horaInicio: horaInicioStr,
              horaFin: horaFinStr,
              aula: ''
            };
            this.horarios.update(h => [...h, newItem]);
          }
        } else if (data.type === 'move') {
          const items = [...this.horarios()];
          const index = items.findIndex(x => x.id === data.id);
          if (index > -1) {
            const duration = this.timeToMinutes(items[index].horaFin) - this.timeToMinutes(items[index].horaInicio);
            let newStartMins = this.CALENDAR_START_MINUTES + Math.floor(containerOffsetY / this.PIXELS_PER_MINUTE / snap) * snap;
            if (newStartMins + duration > this.CALENDAR_END_MINUTES) {
               newStartMins = this.CALENDAR_END_MINUTES - duration;
            }
            items[index].diaSemana = dia;
            items[index].diaNombre = this.dias.find(d => d.value === dia)?.label || '';
            items[index].horaInicio = this.minutesToTime(newStartMins);
            items[index].horaFin = this.minutesToTime(newStartMins + duration);
            this.horarios.set(items);
          }
        }
      }
    }
  }

  contarHoras(cursoId: EntityId): number {
    const curso = this.cursos().find(c => c.id === cursoId);
    if (!curso) return 0;
    return this.horarios().filter(h => h.materia === curso.materiaNombre).length;
  }

  getMateriaColorClass(materia: string): string {
    if (!materia) return 'grad-1';
    const hash = materia.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['grad-1', 'grad-2', 'grad-3', 'grad-4', 'grad-5', 'grad-6', 'grad-7', 'grad-8', 'grad-9', 'grad-10'];
    return colors[hash % colors.length];
  }

  abrirModalEditar(h: HorarioEntry) {
    this.editingId.set(h.id);
    this.form.patchValue({
      cursoId: h.cursoId,
      diaSemana: h.diaSemana,
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
      aula: h.aula || ''
    });
    this.showEditModal.set(true);
  }

  verDetalle(h: HorarioEntry) {
    this.selectedHorarioDetail.set(h);
  }

  cerrarDetalle() {
    this.selectedHorarioDetail.set(null);
  }

  cerrarPanel() {
    this.showEditModal.set(false);
    this.editingId.set(null);
    this.form.reset({ diaSemana: 1, horaInicio: '08:00', horaFin: '09:00', aula: '' });
  }

  guardar() {
    if (this.form.invalid) return;

    const v = this.form.value;
    const gradoId = this.selectedGradoId();
    if (!gradoId) return;

    const hasCollision = this.horarios().some(h => {
      if (this.editingId() && h.id === this.editingId()) return false;
      if (h.diaSemana !== v.diaSemana) return false;
      
      const pStart = this.timeToMinutes(v.horaInicio!);
      const pEnd = this.timeToMinutes(v.horaFin!);
      const eStart = this.timeToMinutes(h.horaInicio);
      const eEnd = this.timeToMinutes(h.horaFin);
      
      return pStart < eEnd && pEnd > eStart;
    });

    if (hasCollision) {
      this.showToast('Cruce de horario detectado.', 'error');
      return;
    }

    const items = [...this.horarios()];
    if (this.editingId()) {
      const index = items.findIndex(x => x.id === this.editingId());
      if (index > -1) {
        items[index] = { 
          ...items[index], 
          diaSemana: v.diaSemana!, 
          horaInicio: v.horaInicio!, 
          horaFin: v.horaFin!, 
          aula: v.aula || '' 
        };
      }
    } else {
      const curso = this.cursos().find(c => c.id === v.cursoId);
      if (curso) {
        const tempId = 'temp_' + Math.random().toString(36).substring(2, 11);
        items.push({
          id: tempId,
          gradoId: gradoId,
          cursoId: curso.id,
          curso: curso.materiaNombre,
          materia: curso.materiaNombre,
          diaSemana: v.diaSemana!,
          diaNombre: this.dias.find(d => d.value === v.diaSemana)?.label || '',
          horaInicio: v.horaInicio!,
          horaFin: v.horaFin!,
          aula: v.aula || ''
        });
      }
    }
    
    this.horarios.set(items);
    this.cerrarPanel();
  }

  eliminar(id: EntityId) {
    if (confirm('¿Remover este bloque del borrador?')) {
      this.horarios.update(h => h.filter(x => x.id !== id));
      this.cerrarPanel();
    }
  }

  async guardarTodo() {
    if (!this.hasUnsavedChanges()) return;
    
    this.saving.set(true);
    const originales = this.horariosOriginales();
    const actuales = this.horarios();
    const gradoId = this.selectedGradoId();
    
    const toDelete = originales.filter(o => !actuales.find(a => a.id === o.id));
    const toUpdate = actuales.filter(a => {
      if (a.id.toString().startsWith('temp_')) return false;
      const origin = originales.find(o => o.id === a.id);
      return JSON.stringify(a) !== JSON.stringify(origin);
    });
    const toCreate = actuales.filter(a => a.id.toString().startsWith('temp_'));

    try {
      for (const d of toDelete) {
        await firstValueFrom(this.portal.eliminarHorario(d.id));
      }
      for (const u of toUpdate) {
        await firstValueFrom(this.portal.actualizarHorario(u.id, u));
      }
      for (const c of toCreate) {
        const { id, ...data } = c as any;
        await firstValueFrom(this.portal.crearHorario(data));
      }

      this.showToast('¡Horarios publicados correctamente!', 'success');
      if (gradoId) this.cargarHorarios(gradoId);
      this.saving.set(false);
    } catch (e) {
      this.showToast('Error guardando los cambios', 'error');
      this.saving.set(false);
    }
  }

  private showToast(message: string, type: 'success' | 'error') {
    const id = Date.now();
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.removeToast(id), 3000);
  }

  removeToast(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
