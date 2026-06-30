import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { matriculaApi } from '../../../services/matriculaApi';
import type { Matricula, MatriculaRequest } from '../../../types/academico';
import MatriculaTable from '../../../components/academico/MatriculaTable';
import MatriculaForm from '../../../components/academico/MatriculaForm';

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
      setError('No se pudo cargar las matrículas.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: MatriculaRequest) => {
    try {
      setFormLoading(true);
      await matriculaApi.create(data);
      handleCloseModal();
      fetchMatriculas();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.errorCode === 'CONCURRENCIA_CUPO') {
        alert(err.response.data.detail);
      } else {
        alert('Ocurrió un error al matricular. Ver la consola.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleRetirar = async (id: number) => {
    if (window.confirm('¿Está seguro de retirar al estudiante de esta matrícula? Esta acción liberará el cupo.')) {
      try {
        await matriculaApi.retirar(id);
        fetchMatriculas();
      } catch (err: any) {
        console.error(err);
        alert('Ocurrió un error al retirar.');
      }
    }
  };

  return (
    <>
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Gestión de Matrículas</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Administra las matrículas de los estudiantes.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenModal}>
          <Plus size={20} />
          Nueva Matrícula
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando matrículas...</div>
        ) : (
          <MatriculaTable matriculas={matriculas} onRetirar={handleRetirar} />
        )}
      </div>

    </div>
    {isModalOpen && (
      <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{
            maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Nueva Matrícula</h2>
            <MatriculaForm 
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
