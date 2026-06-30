import React, { useState, useEffect } from 'react';
import type { Estudiante } from '../../../types/persona';
import { estudianteApi } from '../../../services/estudianteApi';
import EstudianteTable from '../../../components/personas/EstudianteTable';

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstudiantes = async () => {
    try {
      setIsLoading(true);
      const { data } = await estudianteApi.listar();
      setEstudiantes(data);
    } catch (err) {
      setError('Error al cargar la lista de estudiantes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstudiantes();
  }, []);

  const handleEdit = (estudiante: Estudiante) => {
    alert(`Edición de perfiles avanzada será implementada pronto. Editando estudiante: ${estudiante.codigoEstudiante}`);
  };

  const handleDeactivate = async (estudiante: Estudiante) => {
    if (window.confirm(`¿Está seguro de retirar al estudiante ${estudiante.persona.nombres}?`)) {
      try {
        await estudianteApi.desactivar(estudiante.id);
        fetchEstudiantes();
      } catch (err) {
        alert('Error al desactivar al estudiante');
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        Cargando estudiantes...
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Directorio de Estudiantes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Listado de alumnos matriculados y sus estados académicos</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        <EstudianteTable 
          estudiantes={estudiantes} 
          onEdit={handleEdit} 
          onDeactivate={handleDeactivate} 
        />
      </div>
    </div>
  );
}
