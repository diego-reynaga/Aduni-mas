import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { materiaApi } from '../../../services/materiaApi';
import type { Materia, MateriaRequest } from '../../../types/academico';
import MateriaTable from '../../../components/academico/MateriaTable';
import MateriaForm from '../../../components/academico/MateriaForm';

export default function MateriasPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchMaterias();
  }, []);

  const fetchMaterias = async () => {
    try {
      setLoading(true);
      const response = await materiaApi.getAll();
      setMaterias(response);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('No se pudo cargar las materias.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (materia: Materia | null = null) => {
    setEditingMateria(materia);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingMateria(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: MateriaRequest) => {
    try {
      setFormLoading(true);
      if (editingMateria) {
        await materiaApi.update(editingMateria.id, data);
      } else {
        await materiaApi.create(data);
      }
      handleCloseModal();
      fetchMaterias();
    } catch (err: any) {
      console.error(err);
      alert('Ocurrió un error al guardar.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta materia?')) {
      try {
        await materiaApi.delete(id);
        fetchMaterias();
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
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Gestión de Materias</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Administra las materias o cursos del sistema.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Nueva Materia
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando materias...</div>
        ) : (
          <MateriaTable materias={materias} onEdit={handleOpenModal} onDelete={handleDelete} />
        )}
      </div>

    </div>
    {isModalOpen && (
      <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{
            maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingMateria ? 'Editar Materia' : 'Nueva Materia'}</h2>
            <MateriaForm 
              initialData={editingMateria} 
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
