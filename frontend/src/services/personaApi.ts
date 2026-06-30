import api from './usuarioApi';
import type { Persona, PersonaRequest, PersonaConPerfiles, PersonaConPerfilesRequest } from '../types/persona';

const API_BASE = '/api/personas';

export const personaApi = {
  listar: () => api.get<Persona[]>(API_BASE),
  obtener: (id: number) => api.get<Persona>(`${API_BASE}/${id}`),
  crear: (data: PersonaRequest) => api.post<Persona>(API_BASE, data),
  actualizar: (id: number, data: PersonaRequest) => api.put<Persona>(`${API_BASE}/${id}`, data),
  eliminar: (id: number) => api.delete<void>(`${API_BASE}/${id}`),
  
  crearConPerfiles: (data: PersonaConPerfilesRequest) => api.post<PersonaConPerfiles>(`${API_BASE}/con-perfiles`, data),
  obtenerConPerfiles: (id: number) => api.get<PersonaConPerfiles>(`${API_BASE}/${id}/con-perfiles`),
};
