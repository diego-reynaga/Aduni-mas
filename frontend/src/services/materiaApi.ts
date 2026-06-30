import api from './usuarioApi';
import type { Materia, MateriaRequest } from '../types/academico';

export const materiaApi = {
  getAll: async () => {
    const response = await api.get<Materia[]>('/api/materias');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get<Materia>(`/api/materias/${id}`);
    return response.data;
  },

  create: async (data: MateriaRequest) => {
    const response = await api.post<Materia>('/api/materias', data);
    return response.data;
  },

  update: async (id: number, data: MateriaRequest) => {
    const response = await api.put<Materia>(`/api/materias/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/materias/${id}`);
  }
};
