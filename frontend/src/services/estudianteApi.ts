import api from './usuarioApi';
import type { Estudiante, EstudiantePaginadoResponse, EstudianteBuscarResponse, EstudianteExpedienteResponse } from '../types/persona';

const API_BASE = '/api/estudiantes';

export const estudianteApi = {
  listar: () => api.get<Estudiante[]>(API_BASE),
  obtener: (id: number) => api.get<Estudiante>(${API_BASE}/),
  actualizar: (id: number, data: any) => api.put<Estudiante>(${API_BASE}/, data),
  desactivar: (id: number) => api.patch<Estudiante>(${API_BASE}//desactivar),

  buscarPaginado: (params: { q?: string; estado?: string; pagina?: number; tamanio?: number }) =>
    api.get<EstudiantePaginadoResponse>(${API_BASE}/paginado, { params }),

  buscarActivos: (q: string, limite: number = 10) =>
    api.get<EstudianteBuscarResponse[]>(${API_BASE}/buscar, { params: { q, limite } }),

  obtenerExpediente: (id: number) =>
    api.get<EstudianteExpedienteResponse>(${API_BASE}//expediente),
};
