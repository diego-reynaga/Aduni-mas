import React, { useState, useEffect } from 'react';
import type { PersonalInstitucional } from '../../../types/persona';
import { personalApi } from '../../../services/personalApi';
import PersonalTable from '../../../components/personas/PersonalTable';

export default function PersonalPage() {
  const [personal, setPersonal] = useState<PersonalInstitucional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonal = async () => {
    try {
      setIsLoading(true);
      const { data } = await personalApi.listar();
      setPersonal(data);
    } catch (err) {
      setError('Error al cargar la lista de personal');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonal();
  }, []);

  const handleEdit = (p: PersonalInstitucional) => {
    alert(`Edición individual de personal en construcción. ID: ${p.id}`);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        Cargando personal...
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Directorio del Personal Institucional</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Listado de docentes, administrativos y directivos</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        <PersonalTable 
          personal={personal} 
          onEdit={handleEdit} 
        />
      </div>
    </div>
  );
}
