import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.username ?? 'Usuario';
  const displayRole = user?.roles?.[0] ?? 'Sin rol';

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 5,
    }}>
      <div>
        <h1 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
          Panel de Administración
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button className="icon-btn" aria-label="Notificaciones">
          <Bell size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <User size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{displayName}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{displayRole}</span>
          </div>
        </div>
        {isAuthenticated && (
          <button
            className="icon-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{ color: 'var(--status-error)' }}
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
