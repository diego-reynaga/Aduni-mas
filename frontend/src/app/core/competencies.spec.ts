import { UNIVERSAL_COMPETENCIES, UNIVERSAL_COMPETENCY_NAMES } from './competencies';

describe('competencias universales', () => {
  it('mantiene los cuatro nombres curriculares en el orden oficial', () => {
    expect(UNIVERSAL_COMPETENCIES.map((item) => item.nombre)).toEqual([
      'Resuelve problemas de cantidad',
      'Resuelve problemas de regularidad, equivalencia y cambio',
      'Resuelve problemas de forma, movimiento y localización',
      'Resuelve problemas de gestión de datos e incertidumbre',
    ]);
    expect(UNIVERSAL_COMPETENCY_NAMES[4]).toBe('Resuelve problemas de gestión de datos e incertidumbre');
  });
});
