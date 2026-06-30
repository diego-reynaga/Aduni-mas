import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

interface Props {
  requiredRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({ requiredRoles, children, fallback }: Props) {
  const { hasAnyRole } = useAuth();

  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return fallback ?? (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Acceso Denegado</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          No tienes permisos para acceder a esta sección.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
