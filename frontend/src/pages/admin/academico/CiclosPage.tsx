import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { cicloApi } from '../../../services/cicloApi';
import type { Ciclo, CicloRequest } from '../../../types/academico';
import CicloTable from '../../../components/academico/CicloTable';
import CicloForm from '../../../components/academico/CicloForm';

export default function CiclosPage() {
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCiclo, setEditingCiclo] = useState<Ciclo | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchCiclos();
  }, []);

  const fetchCiclos = async () => {
    try {
      setLoading(true);
      const response = await cicloApi.getAll();
      setCiclos(response);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('No se pudo cargar los ciclos.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ciclo: Ciclo | null = null) => {
    setEditingCiclo(ciclo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCiclo(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: CicloRequest) => {
    try {
      setFormLoading(true);
      if (editingCiclo) {
        await cicloApi.update(editingCiclo.id, data);
      } else {
        await cicloApi.create(data);
      }
      handleCloseModal();
      fetchCiclos();
    } catch (err: any) {
      console.error(err);
      alert('Ocurrió un error al guardar.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este ciclo?')) {
      try {
        await cicloApi.delete(id);
        fetchCiclos();
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
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Gestión de Ciclos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Administra los ciclos académicos.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Nuevo Ciclo
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando ciclos...</div>
        ) : (
          <CicloTable ciclos={ciclos} onEdit={handleOpenModal} onDelete={handleDelete} />
        )}
      </div>

    </div>
    {isModalOpen && (
      <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{
            maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingCiclo ? 'Editar Ciclo' : 'Nuevo Ciclo'}</h2>
            <CicloForm 
              initialData={editingCiclo} 
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
