import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { turnoApi } from '../../../services/turnoApi';
import type { Turno, TurnoRequest } from '../../../types/academico';
import TurnoTable from '../../../components/academico/TurnoTable';
import TurnoForm from '../../../components/academico/TurnoForm';

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchTurnos();
  }, []);

  const fetchTurnos = async () => {
    try {
      setLoading(true);
      const response = await turnoApi.getAll();
      setTurnos(response);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('No se pudo cargar los turnos.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (turno: Turno | null = null) => {
    setEditingTurno(turno);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTurno(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: TurnoRequest) => {
    try {
      setFormLoading(true);
      if (editingTurno) {
        await turnoApi.update(editingTurno.id, data);
      } else {
        await turnoApi.create(data);
      }
      handleCloseModal();
      fetchTurnos();
    } catch (err: any) {
      console.error(err);
      alert('Ocurrió un error al guardar.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este turno?')) {
      try {
        await turnoApi.delete(id);
        fetchTurnos();
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
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Gestión de Turnos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Administra los turnos de clase.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Nuevo Turno
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando turnos...</div>
        ) : (
          <TurnoTable turnos={turnos} onEdit={handleOpenModal} onDelete={handleDelete} />
        )}
      </div>

    </div>
    {isModalOpen && (
      <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{
            maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingTurno ? 'Editar Turno' : 'Nuevo Turno'}</h2>
            <TurnoForm 
              initialData={editingTurno} 
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
