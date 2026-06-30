import api from './usuarioApi';
import type { PersonalInstitucional } from '../types/persona';

const API_BASE = '/api/personal-institucional';

export const personalApi = {
  listar: () => api.get<PersonalInstitucional[]>(API_BASE),
  obtener: (id: number) => api.get<PersonalInstitucional>(`${API_BASE}/${id}`),
  actualizar: (id: number, data: any) => api.put<PersonalInstitucional>(`${API_BASE}/${id}`, data),
};
