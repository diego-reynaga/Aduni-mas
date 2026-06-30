import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { PersonaConPerfiles } from '../../types/persona';

interface PersonaTableProps {
  personas: PersonaConPerfiles[];
  onEdit: (persona: PersonaConPerfiles) => void;
  onDelete: (persona: PersonaConPerfiles) => void;
}

export default function PersonaTable({ personas, onEdit, onDelete }: PersonaTableProps) {
  if (!personas || personas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No se encontraron personas registradas.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '1rem' }}>ID</th>
            <th style={{ padding: '1rem' }}>Documento</th>
            <th style={{ padding: '1rem' }}>Nombres y Apellidos</th>
            <th style={{ padding: '1rem' }}>Perfiles</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {personas.map((persona) => (
            <tr key={persona.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>#{persona.id}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{persona.tipoDocumento}</span>
                {persona.numeroDocumento}
              </td>
              <td style={{ padding: '1rem', fontWeight: 500 }}>
                {persona.nombres} {persona.apellidos}
              </td>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {persona.perfiles?.map((p, index) => (
                    <span key={index} style={{ 
                      backgroundColor: 'var(--color-surface-hover)', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px',
                      fontSize: '0.75rem'
                    }}>
                      {p.tipo.replace('_', ' ')}
                    </span>
                  ))}
                  {(!persona.perfiles || persona.perfiles.length === 0) && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sin perfiles</span>
                  )}
                </div>
              </td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    onClick={() => onEdit(persona)}
                    className="icon-btn"
                    title="Editar Persona"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(persona)}
                    className="icon-btn" style={{ color: 'var(--status-error)' }}
                    title="Eliminar Persona"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
