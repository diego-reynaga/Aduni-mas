import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  requiredRoles?: string[];
}

export default function ProtectedRoute({ requiredRoles }: Props = {}) {
  const { isAuthenticated, hasAnyRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Acceso Denegado</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          No tienes permisos para acceder a esta sección.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
