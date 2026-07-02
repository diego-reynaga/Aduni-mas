export interface NivelEducativoResponse {
  id: number;
  nombre: string;
  turno: string;
  descripcion: string;
  activo: boolean;
  gestionAcademicaId: number;
}

export interface NivelEducativoRequest {
  nombre: string;
  turno: string;
  descripcion: string;
  activo: boolean;
  gestionAcademicaId: number;
}

export interface GradoResponse {
  id: number;
  nombre: string;
  paralelo: string;
  capacidad: number;
  activo: boolean;
  nivelEducativoId: number;
  nivelEducativoNombre: string;
}

export interface GradoRequest {
  nombre: string;
  paralelo: string;
  capacidad: number;
  activo: boolean;
  nivelEducativoId: number;
}

export interface MateriaResponse {
  id: number;
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
  id: number;
  gradoId: number;
  gradoNombre: string;
  paralelo: string;
  materiaId: number;
  materiaCodigo: string;
  materiaNombre: string;
  area: string;
  activo: boolean;
}

export interface CursoAsignacionMasivaRequest {
  gradoId: number;
  materiasIds: number[];
}

export interface GestionAcademicaResponse {
  id: number;
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
  id: number;
  nombre: string;
  orden: number;
  fechaInicio: string;
  fechaFin: string;
  cerrado: boolean;
  gestionAcademicaId: number;
}

export interface PeriodoAcademicoRequest {
  nombre: string;
  orden: number;
  fechaInicio: string;
  fechaFin: string;
  cerrado: boolean;
  gestionAcademicaId: number;
}

export interface AsignacionDocenteResponse {
  id: number;
  docenteId: number;
  docenteCodigo: string;
  docenteNombre: string;
  cursoId: number;
  materia: string;
  grado: string;
  seccion: string;
  periodoAcademicoId: number;
  periodo: string;
  fechaAsignacion: string;
  estado: 'ACTIVA' | 'CERRADA';
}

export interface AsignacionDocenteRequest {
  docenteId: number;
  cursoId: number;
  periodoAcademicoId: number;
  estado: 'ACTIVA' | 'CERRADA';
}
