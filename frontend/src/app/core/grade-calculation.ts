export const MINIMUM_GRADE = 0;
export const MAXIMUM_GRADE = 20;

export type GradeValue = number | null;

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function finiteGrade(value: unknown): number | null {
  if (isBlank(value)) return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasInvalidGrade(value: unknown): boolean {
  if (isBlank(value)) return false;
  const grade = finiteGrade(value);
  return grade === null || grade < MINIMUM_GRADE || grade > MAXIMUM_GRADE;
}

export function gradeValue(value: unknown): GradeValue {
  if (hasInvalidGrade(value)) return null;
  return finiteGrade(value);
}

export function excelAverage(values: readonly GradeValue[]): GradeValue {
  if (values.some(hasInvalidGrade)) return null;
  const recorded = values.filter((value): value is number => value !== null);
  return recorded.length ? recorded.reduce((sum, value) => sum + value, 0) / recorded.length : null;
}

export function excelAchievement(value: number | null | undefined): 'C' | 'B' | 'A' | 'AD' | '-' {
  if (value == null || !Number.isFinite(value)) return '-';
  const val = Math.round(value);
  if (val >= 18) return 'AD';
  if (val >= 14) return 'A';
  if (val >= 11) return 'B';
  return 'C';
}

export function getAchievementInfo(value: number | null | undefined): { letter: string; cssClass: string; label: string; name: string } {
  const letter = excelAchievement(value);
  switch (letter) {
    case 'AD': return { letter: 'AD', cssClass: 'level-ad', label: 'Logro Destacado (18-20)', name: 'Logro Destacado' };
    case 'A':  return { letter: 'A',  cssClass: 'level-a',  label: 'Logro Previsto (14-17)', name: 'Logro Previsto' };
    case 'B':  return { letter: 'B',  cssClass: 'level-b',  label: 'En Proceso (11-13)', name: 'En Proceso' };
    case 'C':  return { letter: 'C',  cssClass: 'level-c',  label: 'En Inicio (0-10)', name: 'En Inicio' };
    default:   return { letter: '-',  cssClass: 'level-none', label: 'Sin Nota', name: 'Sin Nota' };
  }
}

export function formatGrade(value: GradeValue | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

// The official workbook stores the full formula result but displays its
// calculated averages with the `00` number format (no decimal places).
export function formatExcelAverage(value: GradeValue | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return value.toFixed(0);
}
