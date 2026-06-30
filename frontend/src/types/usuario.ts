export interface Usuario {
  id: number;
  username: string;
  activo: boolean;
  personaId: number;
  rolId: number;
  rolNombre: string;
}

export interface UsuarioRequest {
  username: string;
  password?: string;
  personaId: number;
  rolId: number;
}

export interface AuthUser {
  username: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  username: string;
  roles: string[];
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  username: string;
  roles: string[];
}

export const ROLE_HIERARCHY: Record<string, string[]> = {
  ADMINISTRADOR: ['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'DIRECCION_ADMINISTRATIVA', 'SECRETARIA', 'DOCENTE', 'ESTUDIANTE', 'PADRE_FAMILIA'],
  DIRECCION_ACADEMICA: ['DIRECCION_ACADEMICA', 'DOCENTE', 'ESTUDIANTE'],
  DIRECCION_ADMINISTRATIVA: ['DIRECCION_ADMINISTRATIVA', 'SECRETARIA'],
  SECRETARIA: ['SECRETARIA'],
  DOCENTE: ['DOCENTE', 'ESTUDIANTE'],
  ESTUDIANTE: ['ESTUDIANTE'],
  PADRE_FAMILIA: ['PADRE_FAMILIA'],
};

export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.some(r => (ROLE_HIERARCHY[r] ?? [r]).includes(requiredRole));
}

export function canAccess(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(r => hasRole(userRoles, r));
}
