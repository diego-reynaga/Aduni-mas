import { Edit, Trash2 } from 'lucide-react';
import type { Usuario } from '../../types/usuario';

interface Props {
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onDelete: (id: number) => void;
}

export default function UsuarioTable({ usuarios, onEdit, onDelete }: Props) {
  if (!usuarios || usuarios.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No hay usuarios registrados.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '1rem' }}>ID</th>
            <th style={{ padding: '1rem' }}>Usuario</th>
            <th style={{ padding: '1rem' }}>Rol</th>
            <th style={{ padding: '1rem' }}>Estado</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem' }}>{user.id}</td>
              <td style={{ padding: '1rem', fontWeight: 500 }}>{user.username}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{ 
                  backgroundColor: 'var(--color-surface-hover)', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px',
                  fontSize: '0.875rem'
                }}>
                  {user.rolNombre}
                </span>
              </td>
              <td style={{ padding: '1rem' }}>
                <span style={{ 
                  color: user.activo ? 'var(--status-success)' : 'var(--status-error)',
                  fontWeight: 500 
                }}>
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="icon-btn" onClick={() => onEdit(user)} title="Editar">
                    <Edit size={18} />
                  </button>
                  <button className="icon-btn" style={{ color: 'var(--status-error)' }} onClick={() => onDelete(user.id)} title="Eliminar">
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
