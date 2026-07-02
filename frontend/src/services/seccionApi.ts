import api from './usuarioApi';
import type { Seccion, SeccionRequest } from '../types/academico';

export const seccionApi = {
  getAll: async () => {
    const response = await api.get<Seccion[]>('/api/secciones');
    return response.data;
  },

  getDisponibles: async (cicloId?: number, turnoId?: number) => {
    const params: Record<string, number> = {};
    if (cicloId !== undefined) params.cicloId = cicloId;
    if (turnoId !== undefined) params.turnoId = turnoId;
    const response = await api.get<Seccion[]>('/api/secciones/disponibles', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Seccion>(/api/secciones/);
    return response.data;
  },

  create: async (data: SeccionRequest) => {
    const response = await api.post<Seccion>('/api/secciones', data);
    return response.data;
  },

  update: async (id: number, data: SeccionRequest) => {
    const response = await api.put<Seccion>(/api/secciones/, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(/api/secciones/);
  }
};
