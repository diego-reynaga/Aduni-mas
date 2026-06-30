import React from 'react';
import { Edit2 } from 'lucide-react';
import type { PersonalInstitucional } from '../../types/persona';

interface PersonalTableProps {
  personal: PersonalInstitucional[];
  onEdit: (personal: PersonalInstitucional) => void;
}

export default function PersonalTable({ personal, onEdit }: PersonalTableProps) {
  if (!personal || personal.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No se encontró personal institucional registrado.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '1rem' }}>ID</th>
            <th style={{ padding: '1rem' }}>Nombres y Apellidos</th>
            <th style={{ padding: '1rem' }}>Cargo</th>
            <th style={{ padding: '1rem' }}>Fecha de Ingreso</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {personal.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>#{p.id}</td>
              <td style={{ padding: '1rem', fontWeight: 500 }}>
                {p.persona.nombres} {p.persona.apellidos}
              </td>
              <td style={{ padding: '1rem' }}>
                <span style={{ 
                  backgroundColor: 'var(--color-surface-hover)', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px',
                  fontSize: '0.875rem'
                }}>
                  {p.cargo}
                </span>
              </td>
              <td style={{ padding: '1rem' }}>{new Date(p.fechaIngreso).toLocaleDateString()}</td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    onClick={() => onEdit(p)}
                    className="icon-btn"
                    title="Editar Personal"
                  >
                    <Edit2 size={18} />
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
