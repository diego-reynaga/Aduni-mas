import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { seccionApi } from '../../../services/seccionApi';
import type { Seccion, SeccionRequest } from '../../../types/academico';
import SeccionTable from '../../../components/academico/SeccionTable';
import SeccionForm from '../../../components/academico/SeccionForm';

export default function SeccionesPage() {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeccion, setEditingSeccion] = useState<Seccion | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchSecciones();
  }, []);

  const fetchSecciones = async () => {
    try {
      setLoading(true);
      const response = await seccionApi.getAll();
      setSecciones(response);
      setError('');
    } catch (err: any) {
      console.error(err);
      const backendMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Error desconocido';
      setError(`No se pudo cargar las secciones. Detalle técnico: ${backendMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (seccion: Seccion | null = null) => {
    setEditingSeccion(seccion);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingSeccion(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: SeccionRequest) => {
    try {
      setFormLoading(true);
      if (editingSeccion) {
        await seccionApi.update(editingSeccion.id, data);
      } else {
        await seccionApi.create(data);
      }
      handleCloseModal();
      fetchSecciones();
    } catch (err: any) {
      console.error(err);
      const backendMessage = err.response?.data?.detail || err.response?.data?.message || JSON.stringify(err.response?.data?.errors) || err.message || 'Error desconocido';
      alert(`Ocurrió un error al guardar. Detalle técnico: ${backendMessage}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta sección?')) {
      try {
        await seccionApi.delete(id);
        fetchSecciones();
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
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Gestión de Secciones</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Administra las secciones de clase y sus cupos.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Nueva Sección
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando secciones...</div>
        ) : (
          <SeccionTable secciones={secciones} onEdit={handleOpenModal} onDelete={handleDelete} />
        )}
      </div>

    </div>
    {isModalOpen && (
      <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{
            maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingSeccion ? 'Editar Sección' : 'Nueva Sección'}</h2>
            <SeccionForm 
              initialData={editingSeccion} 
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
