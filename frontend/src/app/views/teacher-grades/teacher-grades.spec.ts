import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { CompetencyConfig, GradeEntry, TeacherGradesPayload } from '../../core/models';
import { PortalService } from '../../core/portal.service';
import { UNIVERSAL_COMPETENCIES } from '../../core/competencies';
import { TeacherGrades } from './teacher-grades';

const competencies: CompetencyConfig[] = UNIVERSAL_COMPETENCIES.map((competency) => ({
  ...competency,
  capacidades: ['PRACTICA', 'EXAMEN', 'CUADERNO'].map((nombre, index) => ({ numero: index + 1, nombre })),
}));

const row: GradeEntry = {
  estudianteId: 'student-1',
  codigo: 'EST001',
  estudiante: 'APELLIDO, Nombre',
  competencias: competencies.map((item) => ({ numero: item.numero, notas: [null, null, null] })),
};

const payload: TeacherGradesPayload = {
  assignmentId: 'assignment-1',
  selectedCourse: {
    assignmentId: 'assignment-1',
    codigo: 'MAT-1',
    curso: 'Matemática',
    grado: 'Primero',
    seccion: 'A',
    periodo: 'I Trimestre',
    estudiantes: 1,
    evaluaciones: 0,
    avance: 0,
    estado: 'ACTIVA',
  },
  trimestre: 'I_TRIMESTRE',
  competencias: competencies,
  rows: [row],
  courses: [],
};

describe('TeacherGrades', () => {
  const saveTeacherGrades = vi.fn(() => of({ message: 'Guardado' }));

  beforeEach(async () => {
    saveTeacherGrades.mockClear();
    await TestBed.configureTestingModule({
      imports: [TeacherGrades],
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of({ get: () => 'assignment-1' }) },
        },
        {
          provide: PortalService,
          useValue: {
            teacherGrades: () => of(payload),
            saveTeacherGrades,
          },
        },
      ],
    }).compileComponents();
  });

  it('loads four competencies with three default capacities', () => {
    const fixture = TestBed.createComponent(TeacherGrades);
    fixture.detectChanges();

    expect(fixture.componentInstance.competencias()).toHaveLength(4);
    expect(fixture.componentInstance.activeCompetency()?.capacidades.map((item) => item.nombre))
      .toEqual(['PRACTICA', 'EXAMEN', 'CUADERNO']);
    expect(fixture.nativeElement.querySelectorAll('.competency-edit-button')).toHaveLength(0);
    expect(fixture.nativeElement.querySelectorAll('.achievement-badge')).toHaveLength(0);
  });

  it('adds capacities up to six and keeps a blank slot for every student', () => {
    const fixture = TestBed.createComponent(TeacherGrades);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.addCapacity();
    component.addCapacity();
    component.addCapacity();
    component.addCapacity();

    expect(component.activeCompetency()?.capacidades).toHaveLength(6);
    expect(component.rows()[0].competencias[0].notas).toEqual([null, null, null, null, null, null]);
  });

  it('calculates the competency and final averages while ignoring empty competencies', () => {
    const fixture = TestBed.createComponent(TeacherGrades);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.updateGrade(component.rows()[0], 0, 12);
    component.updateGrade(component.rows()[0], 1, 14);
    component.updateGrade(component.rows()[0], 2, 16);

    expect(component.competencyAverage(component.rows()[0])).toBe(14);
    expect(component.finalAverage(component.rows()[0])).toBe(14);
  });

  it('renames a capacity and sends all four competency matrices when saving', () => {
    const fixture = TestBed.createComponent(TeacherGrades);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.openCapacityEditor(1, 3);
    component.capacityNameDraft.set('Proyecto');
    component.saveCapacityName();
    component.save();

    expect(component.activeCompetency()?.capacidades[2].nombre).toBe('Proyecto');
    expect(saveTeacherGrades).toHaveBeenCalledWith('assignment-1', expect.objectContaining({
      trimestre: 'I_TRIMESTRE',
      competencias: expect.arrayContaining([expect.objectContaining({ numero: 1 })]),
      estudiantes: expect.arrayContaining([expect.objectContaining({ estudianteId: 'student-1' })]),
    }));
  });
});
