import api from './usuarioApi';
import type { Matricula, MatriculaRequest, CambioEstadoRequest } from '../types/academico';

export const matriculaApi = {
  getAll: async () => {
    const response = await api.get<Matricula[]>('/api/matriculas');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Matricula>(/api/matriculas/);
    return response.data;
  },

  getByEstudiante: async (estudianteId: number) => {
    const response = await api.get<Matricula[]>(/api/matriculas/estudiante/);
    return response.data;
  },

  create: async (data: MatriculaRequest) => {
    const response = await api.post<Matricula>('/api/matriculas', data);
    return response.data;
  },

  cambiarEstado: async (id: number, data: CambioEstadoRequest) => {
    const response = await api.put<Matricula>(/api/matriculas//estado, data);
    return response.data;
  },

  retirar: async (id: number) => {
    const response = await api.put<void>(/api/matriculas//retirar);
    return response.data;
  }
};
