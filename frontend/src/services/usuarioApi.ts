import axios from 'axios';
import type { Usuario, UsuarioRequest } from '../types/usuario';

const API_BASE = '/api/usuarios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('http://localhost:8080/api/auth/refresh', {
          refreshToken,
        });

        const { token } = response.data;
        localStorage.setItem('token', token);

        pendingRequests.forEach((cb) => cb(token));
        pendingRequests = [];

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const usuarioApi = {
  listar: () => api.get<Usuario[]>(API_BASE),
  obtener: (id: number) => api.get<Usuario>(`${API_BASE}/${id}`),
  crear: (data: UsuarioRequest) => api.post<Usuario>(API_BASE, data),
  actualizar: (id: number, data: UsuarioRequest) => api.put<Usuario>(`${API_BASE}/${id}`, data),
  eliminar: (id: number) => api.delete(`${API_BASE}/${id}`),
};

export default api;
