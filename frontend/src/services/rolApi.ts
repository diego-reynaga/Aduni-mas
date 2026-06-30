import api from './usuarioApi';

export interface Rol {
  id: number;
  nombre: string;
}

export interface RolRequest {
  nombre: string;
}

const API_BASE = '/api/roles';

export const rolApi = {
  listar: () => api.get<Rol[]>(API_BASE),
  obtener: (id: number) => api.get<Rol>(`${API_BASE}/${id}`),
  crear: (data: RolRequest) => api.post<Rol>(API_BASE, data),
  actualizar: (id: number, data: RolRequest) => api.put<Rol>(`${API_BASE}/${id}`, data),
  eliminar: (id: number) => api.delete(`${API_BASE}/${id}`),
};
