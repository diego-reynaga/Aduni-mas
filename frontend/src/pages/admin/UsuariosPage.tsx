import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { usuarioApi } from '../../services/usuarioApi';
import type { Usuario, UsuarioRequest } from '../../types/usuario';
import UsuarioTable from '../../components/usuarios/UsuarioTable';
import UsuarioForm from '../../components/usuarios/UsuarioForm';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await usuarioApi.listar();
      setUsuarios(response.data);
      setError('');
    } catch (err: any) {
      console.error(err);
      // Fallback a datos mockeados si el backend no está corriendo, para previsualización
      setUsuarios([
        { id: 1, username: 'admin', activo: true, personaId: 1, rolId: 1, rolNombre: 'Administrador' },
        { id: 2, username: 'juan.perez', activo: true, personaId: 2, rolId: 2, rolNombre: 'Docente' },
      ]);
      setError('No se pudo conectar al servidor. Mostrando datos de prueba.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (usuario: Usuario | null = null) => {
    setEditingUser(usuario);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: UsuarioRequest) => {
    try {
      setFormLoading(true);
      if (editingUser) {
        await usuarioApi.actualizar(editingUser.id, data);
      } else {
        await usuarioApi.crear(data);
      }
      handleCloseModal();
      fetchUsuarios();
    } catch (err: any) {
      console.error(err);
      alert('Ocurrió un error al guardar. Ver la consola.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        await usuarioApi.eliminar(id);
        fetchUsuarios();
      } catch (err: any) {
        console.error(err);
        alert('Ocurrió un error al eliminar.');
      }
    }
  };

  return (
    <>
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Gestión de Usuarios</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Administra los usuarios del sistema y sus roles.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando usuarios...</div>
        ) : (
          <UsuarioTable usuarios={usuarios} onEdit={handleOpenModal} onDelete={handleDelete} />
        )}
      </div>
    </div>
    {isModalOpen && (
      <div className="modal-overlay">
        <div className="modal-content animate-fade-in" style={{
          maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          <UsuarioForm 
            initialData={editingUser} 
            onSubmit={handleSubmit} 
            onCancel={handleCloseModal}
            isLoading={formLoading}
          />
        </div>
      </div>
    )}
    </>
  );
}
