import { CompetencyNumber } from './models';

export const UNIVERSAL_COMPETENCIES: ReadonlyArray<{
  numero: CompetencyNumber;
  nombre: string;
}> = [
  { numero: 1, nombre: 'Resuelve problemas de cantidad' },
  { numero: 2, nombre: 'Resuelve problemas de regularidad, equivalencia y cambio' },
  { numero: 3, nombre: 'Resuelve problemas de forma, movimiento y localización' },
  { numero: 4, nombre: 'Resuelve problemas de gestión de datos e incertidumbre' },
];

export const UNIVERSAL_COMPETENCY_NAMES: Record<CompetencyNumber, string> =
  Object.fromEntries(UNIVERSAL_COMPETENCIES.map((item) => [item.numero, item.nombre])) as Record<CompetencyNumber, string>;
