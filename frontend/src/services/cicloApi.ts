import api from './usuarioApi';
import type { Ciclo, CicloRequest } from '../types/academico';

export const cicloApi = {
  getAll: async () => {
    const response = await api.get<Ciclo[]>('/api/ciclos-academicos');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get<Ciclo>(`/api/ciclos-academicos/${id}`);
    return response.data;
  },

  create: async (data: CicloRequest) => {
    const response = await api.post<Ciclo>('/api/ciclos-academicos', data);
    return response.data;
  },

  update: async (id: number, data: CicloRequest) => {
    const response = await api.put<Ciclo>(`/api/ciclos-academicos/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/ciclos-academicos/${id}`);
  }
};
