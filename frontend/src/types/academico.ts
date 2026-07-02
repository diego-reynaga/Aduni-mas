export interface Ciclo {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface CicloRequest {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface Turno {
  id: number;
  nombre: string;
  horaInicio: string;
  horaFin: string;
}

export interface TurnoRequest {
  nombre: string;
  horaInicio: string;
  horaFin: string;
}

export interface Materia {
  id: number;
  nombre: string;
  area: string;
}

export interface MateriaRequest {
  nombre: string;
  area: string;
}

export interface Seccion {
  id: number;
  cicloId: number;
  cicloNombre: string;
  turnoId: number;
  turnoNombre: string;
  nombre: string;
  cupoMaximo: number;
  cuposDisponibles: number;
  version: number;
}

export interface SeccionRequest {
  cicloId: number;
  turnoId: number;
  nombre: string;
  cupoMaximo: number;
}

export type EstadoMatricula = 'PRE_MATRICULADO' | 'ACTIVO' | 'RETIRADO' | 'SUSPENDIDO' | 'EGRESADO';

export interface Matricula {
  id: number;
  codigoMatricula: string;
  estudianteId: number;
  estudianteNombre: string;
  seccionId: number;
  seccionNombre: string;
  fechaMatricula: string;
  montoTotalPactado: number;
  estado: string;
}

export interface MatriculaRequest {
  estudianteId: number;
  seccionId: number;
  montoTotalPactado: number;
  fechaMatricula?: string;
}

export interface CambioEstadoRequest {
  estado: string;
}

export const TRANSICIONES_ESTADO: Record<string, string[]> = {
  PRE_MATRICULADO: ['ACTIVO', 'RETIRADO'],
  ACTIVO: ['RETIRADO', 'SUSPENDIDO', 'EGRESADO'],
  SUSPENDIDO: ['ACTIVO', 'RETIRADO'],
  RETIRADO: [],
  EGRESADO: [],
};

export const COLORES_ESTADO: Record<string, string> = {
  PRE_MATRICULADO: '#F59E0B',
  ACTIVO: '#10B981',
  RETIRADO: '#EF4444',
  SUSPENDIDO: '#F97316',
  EGRESADO: '#6366F1',
};
