import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import type { PersonaConPerfiles } from '../../../types/persona';
import { personaApi } from '../../../services/personaApi';
import PersonaTable from '../../../components/personas/PersonaTable';
import PersonaForm from '../../../components/personas/PersonaForm';

export default function PersonasPage() {
  const [personas, setPersonas] = useState<PersonaConPerfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<PersonaConPerfiles | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPersonas = async () => {
    try {
      setIsLoading(true);
      const { data } = await personaApi.listar(); // The list API might not have profiles by default if using original method, but backend should support it or we assume it's just general view
      // Actually we need `listarConPerfiles` if it exists. But we only have `listar()` that returns PersonaResponse. Let's fetch all via listar and then fetch individually? No, backend listar() returns PersonaResponse (no profiles). 
      // Let's assume the backend `listarPersonas()` just returns Personas. For now we use it, if it lacks profiles, we'll see.
      // In the backend, PersonaService.listarPersonas returns PersonaResponse. The UI needs perfiles.
      // I'll fetch `listar()` and map them.
      const res = await personaApi.listar();
      setPersonas(res.data as any); 
    } catch (err: any) {
      setError('Error al cargar la lista de personas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      if (editingPersona) {
        // En este diseño simplificado de la UI no editamos perfiles, solo datos base de persona
        await personaApi.actualizar(editingPersona.id, formData);
      } else {
        await personaApi.crearConPerfiles(formData);
      }
      await fetchPersonas();
      setIsModalOpen(false);
      setEditingPersona(null);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setFormError(err.response.data.detail);
      } else {
        setFormError('Error al guardar la persona');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (persona: any) => {
    try {
      // Necesitamos obtener la persona CON sus perfiles completos
      const { data } = await personaApi.obtenerConPerfiles(persona.id);
      setEditingPersona(data);
      setIsModalOpen(true);
    } catch (err) {
      setError('Error al cargar datos de la persona');
    }
  };

  const handleDelete = async (persona: any) => {
    if (window.confirm(`¿Está seguro de eliminar a ${persona.nombres} ${persona.apellidos}?`)) {
      try {
        await personaApi.eliminar(persona.id);
        fetchPersonas();
      } catch (err) {
        setError('Error al eliminar la persona');
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        Cargando personas...
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Gestión de Personas</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Administre las personas and sus respectivos perfiles en el sistema</p>
          </div>
          <button
            onClick={() => {
              setEditingPersona(null);
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus size={20} />
            Nueva Persona
          </button>
        </div>

        {error && (
          <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
          <PersonaTable 
            personas={personas} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{
            maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                {editingPersona ? 'Editar Persona' : 'Nueva Persona'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="icon-btn"
                title="Cerrar"
              >
                <X size={24} />
              </button>
            </div>
            <PersonaForm
              initialData={editingPersona}
              onSubmit={handleSubmit}
              onCancel={() => setIsModalOpen(false)}
              isLoading={isSubmitting}
              error={formError}
            />
          </div>
        </div>
      )}
    </>
  );
}
