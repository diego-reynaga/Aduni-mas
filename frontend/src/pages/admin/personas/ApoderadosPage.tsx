import React, { useState, useEffect } from 'react';
import type { Apoderado } from '../../../types/persona';
import { apoderadoApi } from '../../../services/apoderadoApi';
import ApoderadoTable from '../../../components/personas/ApoderadoTable';

export default function ApoderadosPage() {
  const [apoderados, setApoderados] = useState<Apoderado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApoderados = async () => {
    try {
      setIsLoading(true);
      const { data } = await apoderadoApi.listar();
      setApoderados(data);
    } catch (err) {
      setError('Error al cargar la lista de apoderados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApoderados();
  }, []);

  const handleEdit = (apoderado: Apoderado) => {
    alert(`La edición individual de apoderados se habilitará en la próxima versión. ID: ${apoderado.id}`);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        Cargando apoderados...
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Directorio de Apoderados</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Listado de representantes y tutores de los estudiantes</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        <ApoderadoTable 
          apoderados={apoderados} 
          onEdit={handleEdit} 
        />
      </div>
    </div>
  );
}
