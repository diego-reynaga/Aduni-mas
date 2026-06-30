import api from './usuarioApi';
import type { Turno, TurnoRequest } from '../types/academico';

export const turnoApi = {
  getAll: async () => {
    const response = await api.get<Turno[]>('/api/turnos');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get<Turno>(`/api/turnos/${id}`);
    return response.data;
  },

  create: async (data: TurnoRequest) => {
    const response = await api.post<Turno>('/api/turnos', data);
    return response.data;
  },

  update: async (id: number, data: TurnoRequest) => {
    const response = await api.put<Turno>(`/api/turnos/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/turnos/${id}`);
  }
};
