import { EntityId } from './models';

export interface NivelEducativoResponse {
  id: EntityId;
  nombre: string;
  turno: string;
  descripcion: string;
  activo: boolean;
  gestionAcademicaId: EntityId;
}

export interface NivelEducativoRequest {
  nombre: string;
  turno: string;
  descripcion: string;
  activo: boolean;
  gestionAcademicaId: EntityId;
}

export interface GradoResponse {
  id: EntityId;
  nombre: string;
  paralelo: string;
  capacidad: number;
  activo: boolean;
  nivelEducativoId: EntityId;
  nivelEducativoNombre: string;
  inscritos?: number;
}

export interface GradoRequest {
  nombre: string;
  paralelo: string;
  capacidad: number;
  activo: boolean;
  nivelEducativoId: EntityId;
}

export interface MateriaResponse {
  id: EntityId;
  codigo: string;
  nombre: string;
  area: string;
  activa: boolean;
}

export interface MateriaRequest {
  codigo: string;
  nombre: string;
  area: string;
  activa: boolean;
}

export interface CursoResponse {
  id: EntityId;
  gradoId: EntityId;
  gradoNombre: string;
  paralelo: string;
  materiaId: EntityId;
  materiaCodigo: string;
  materiaNombre: string;
  area: string;
  activo: boolean;
}

export interface CursoAsignacionMasivaRequest {
  gradoId: EntityId;
  materiasIds: EntityId[];
}

export interface GestionAcademicaResponse {
  id: EntityId;
  anio: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

export interface GestionAcademicaRequest {
  anio: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

export interface PeriodoAcademicoResponse {
  id: EntityId;
  nombre: string;
  orden: number;
  fechaInicio: string;
  fechaFin: string;
  cerrado: boolean;
  gestionAcademicaId: EntityId;
}

export interface PeriodoAcademicoRequest {
  nombre: string;
  orden: number;
  fechaInicio: string;
  fechaFin: string;
  cerrado: boolean;
  gestionAcademicaId: EntityId;
}

export interface AsignacionDocenteResponse {
  id: EntityId;
  docenteId: EntityId;
  docenteCodigo: string;
  docenteNombre: string;
  cursoId: EntityId;
  materia: string;
  grado: string;
  seccion: string;
  periodoAcademicoId: EntityId;
  periodo: string;
  fechaAsignacion: string;
  estado: 'ACTIVA' | 'CERRADA';
}

export interface AsignacionDocenteRequest {
  docenteId: EntityId;
  cursoId: EntityId;
  periodoAcademicoId: EntityId;
  estado: 'ACTIVA' | 'CERRADA';
}
