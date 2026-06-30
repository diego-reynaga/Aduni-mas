import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/authApi';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/usuarios';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(username, password);
      const { token, refreshToken, username: resUsername, roles } = response.data;
      localStorage.setItem('refreshToken', refreshToken);
      login(token, resUsername, roles);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.response?.status === 429) {
        setIsBlocked(true);
        setError('Demasiados intentos. Cuenta bloqueada por 15 minutos.');
      } else {
        setError(err.response?.data?.message || 'Error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-background)',
      padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        padding: '2.5rem',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--color-surface)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Aduni+</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Ingresa tus credenciales para acceder</p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#FEF2F2',
            color: 'var(--status-error)',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isBlocked}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isBlocked}
              className="form-input"
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.875rem' }} disabled={loading || isBlocked}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
