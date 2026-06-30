import api from './usuarioApi';

export interface LogAuditoria {
  id: number;
  accion: string;
  modulo: string;
  usuario: string;
  detalles: string;
  idRegistroAfectado: number | null;
  ipOrigen: string | null;
  fecha: string;
}

export interface AuditoriaFiltros {
  usuario?: string;
  accion?: string;
  tabla?: string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const API_BASE = '/api/auditoria';

export const auditoriaApi = {
  listar: (filtros?: AuditoriaFiltros) =>
    api.get<PageResponse<LogAuditoria>>(API_BASE, { params: filtros }),
  ultimos: () =>
    api.get<LogAuditoria[]>(`${API_BASE}/ultimos`),
};
