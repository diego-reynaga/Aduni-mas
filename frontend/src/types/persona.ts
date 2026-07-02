export interface Persona {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
}

export interface PersonaRequest {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
}

export interface Estudiante {
  id: number;
  persona: Persona;
  apoderado: { id: number; nombres: string; apellidos: string } | null;
  codigoEstudiante: string;
  estadoAcademico: string;
}

export interface EstudianteBuscarResponse {
  id: number;
  codigoEstudiante: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  estadoAcademico: string;
}

export interface EstudiantePaginadoResponse {
  contenido: EstudianteBuscarResponse[];
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
  tamanioPagina: number;
}

export interface EstudianteExpedienteResponse {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  codigoEstudiante: string;
  estadoAcademico: string;
  apoderadoNombre: string | null;
  relacionParentesco: string | null;
  historialMatriculas: any[];
}

export interface Apoderado {
  id: number;
  persona: Persona;
  relacionParentesco: string;
}

export interface PersonalInstitucional {
  id: number;
  persona: Persona;
  cargo: string;
  fechaIngreso: string;
}

export interface PerfilData {
  tipo: 'ESTUDIANTE' | 'APODERADO' | 'PERSONAL_INSTITUCIONAL';
  datos: Record<string, any>;
}

export interface PersonaConPerfiles {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  perfiles: PerfilData[];
}

export interface PersonaConPerfilesRequest extends PersonaRequest {
  perfiles: string[];
  estudiante?: {
    codigoEstudiante?: string;
    estadoAcademico?: string;
    idApoderado?: number | null;
  };
  apoderado?: {
    relacionParentesco: string;
  };
  personalInstitucional?: {
    cargo: string;
    fechaIngreso: string;
  };
}
