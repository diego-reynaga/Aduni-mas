import api from './usuarioApi';
import type { Estudiante } from '../types/persona';

const API_BASE = '/api/estudiantes';

export const estudianteApi = {
  listar: () => api.get<Estudiante[]>(API_BASE),
  obtener: (id: number) => api.get<Estudiante>(`${API_BASE}/${id}`),
  actualizar: (id: number, data: any) => api.put<Estudiante>(`${API_BASE}/${id}`, data),
  desactivar: (id: number) => api.patch<Estudiante>(`${API_BASE}/${id}/desactivar`),
};
