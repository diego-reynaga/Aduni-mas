import axios from 'axios';
import type { LoginResponse } from '../types/usuario';

const AUTH_BASE = 'http://localhost:8080/api/auth';

export const authApi = {
  login: (username: string, password: string) =>
    axios.post<LoginResponse>(`${AUTH_BASE}/login`, { username, password }),

  refresh: (refreshToken: string) =>
    axios.post<LoginResponse>(`${AUTH_BASE}/refresh`, { refreshToken }),

  logout: (token: string) =>
    axios.post(`${AUTH_BASE}/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
