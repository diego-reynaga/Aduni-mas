import {
  excelAverage,
  formatExcelAverage,
  formatGrade,
  gradeValue,
  hasInvalidGrade,
} from './grade-calculation';

describe('grade-calculation con semántica de Excel', () => {
  it('devuelve null cuando las seis capacidades están vacías', () => {
    expect(excelAverage([null, null, null, null, null, null])).toBeNull();
  });

  it('promedia solo las tres capacidades registradas de un máximo de seis', () => {
    expect(excelAverage([12, 14, 16, null, null, null])).toBe(14);
  });

  it('cuenta la nota cero como un valor registrado', () => {
    expect(excelAverage([0, 10, null, null, null, null])).toBe(5);
  });

  it('conserva la precisión del promedio sin redondearlo', () => {
    expect(excelAverage([10, 10, 11, null, null, null])).toBe(31 / 3);
  });

  it('acepta los límites de 0 a 20 y valores con coma decimal', () => {
    expect(hasInvalidGrade(0)).toBe(false);
    expect(hasInvalidGrade(20)).toBe(false);
    expect(hasInvalidGrade(null)).toBe(false);
    expect(hasInvalidGrade('')).toBe(false);
    expect(hasInvalidGrade('12,5')).toBe(false);
    expect(gradeValue('12,5')).toBe(12.5);
  });

  it('rechaza valores fuera de rango y entradas no numéricas', () => {
    for (const value of [-0.01, 20.01, Number.NaN, Number.POSITIVE_INFINITY, 'abc']) {
      expect(hasInvalidGrade(value)).toBe(true);
      expect(gradeValue(value)).toBeNull();
    }

    expect(excelAverage([12, 20.01, null, null, null, null])).toBeNull();
  });

  it('calcula el promedio final de cuatro competencias ignorando las vacías', () => {
    const capacitiesByCompetence = [
      [12, 14, 16, null, null, null],
      [null, null, null, null, null, null],
      [18, 18, null, null, null, null],
      [8, 10, 12, null, null, null],
    ];
    const competenceAverages = capacitiesByCompetence.map((capacities) => excelAverage(capacities));

    expect(competenceAverages).toEqual([14, null, 18, 10]);
    expect(excelAverage(competenceAverages)).toBe(14);
  });

  it('presenta las notas con un máximo de dos decimales', () => {
    expect(formatGrade(null)).toBe('-');
    expect(formatGrade(14)).toBe('14');
    expect(formatGrade(13.5)).toBe('13.5');
    expect(formatGrade(11.333333333333334)).toBe('11.33');
  });

  it('muestra los promedios sin decimales como el formato 00 del Excel', () => {
    expect(formatExcelAverage(null)).toBe('-');
    expect(formatExcelAverage(11.333333333333334)).toBe('11');
    expect(formatExcelAverage(12.666666666666668)).toBe('13');
    expect(formatExcelAverage(14)).toBe('14');
  });
});
