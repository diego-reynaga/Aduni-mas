import api from './usuarioApi';
import type { Matricula, MatriculaRequest } from '../types/academico';

export const matriculaApi = {
  getAll: async () => {
    const response = await api.get<Matricula[]>('/api/matriculas');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get<Matricula>(`/api/matriculas/${id}`);
    return response.data;
  },

  getByEstudiante: async (estudianteId: number) => {
    const response = await api.get<Matricula[]>(`/api/matriculas/estudiante/${estudianteId}`);
    return response.data;
  },

  create: async (data: MatriculaRequest) => {
    const response = await api.post<Matricula>('/api/matriculas', data);
    return response.data;
  },

  retirar: async (id: number) => {
    const response = await api.put<void>(`/api/matriculas/${id}/retirar`);
    return response.data;
  }
};
