import api from './usuarioApi';
import type { Apoderado, Estudiante } from '../types/persona';

const API_BASE = '/api/apoderados';

export const apoderadoApi = {
  listar: () => api.get<Apoderado[]>(API_BASE),
  obtener: (id: number) => api.get<Apoderado>(`${API_BASE}/${id}`),
  actualizar: (id: number, data: any) => api.put<Apoderado>(`${API_BASE}/${id}`, data),
  listarEstudiantes: (id: number) => api.get<Estudiante[]>(`${API_BASE}/${id}/estudiantes`),
};
