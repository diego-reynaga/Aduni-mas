import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { matriculaApi } from '../../../services/matriculaApi';
import type { Matricula, MatriculaRequest } from '../../../types/academico';
import MatriculaTable from '../../../components/academico/MatriculaTable';
import MatriculaWizard from '../../../components/academico/MatriculaWizard';

export default function MatriculasPage() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchMatriculas();
  }, []);

  const fetchMatriculas = async () => {
    try {
      setLoading(true);
      const response = await matriculaApi.getAll();
      setMatriculas(response);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('No se pudo cargar las matriculas.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = async (data: MatriculaRequest) => {
    try {
      setFormLoading(true);
      await matriculaApi.create(data);
      handleCloseModal();
      fetchMatriculas();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || err.response?.data?.title || 'Ocurrio un error al matricular.';
      alert(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCambiarEstado = async (id: number, estado: string) => {
    if (!window.confirm(Esta seguro de cambiar el estado de la matricula a ""?)) return;
    try {
      await matriculaApi.cambiarEstado(id, { estado });
      fetchMatriculas();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Error al cambiar estado');
    }
  };

  const handleRetirar = async (id: number) => {
    if (window.confirm('Esta seguro de retirar al estudiante de esta matricula? Esta accion liberara el cupo.')) {
      try {
        await matriculaApi.retirar(id);
        fetchMatriculas();
      } catch (err: any) {
        console.error(err);
        alert('Ocurrio un error al retirar.');
      }
    }
  };

  return (
    <>
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Gestion de Matriculas</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Administra las matriculas de los estudiantes.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenModal}>
          <Plus size={20} />
          Nueva Matricula
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando matriculas...</div>
        ) : (
          <MatriculaTable
            matriculas={matriculas}
            onRetirar={handleRetirar}
            onCambiarEstado={handleCambiarEstado}
          />
        )}
      </div>
    </div>

    {isModalOpen && (
      <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{
            maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Nueva Matricula</h2>
            <MatriculaWizard
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
