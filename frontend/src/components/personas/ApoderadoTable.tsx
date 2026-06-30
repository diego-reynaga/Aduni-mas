import React from 'react';
import { Edit2 } from 'lucide-react';
import type { Apoderado } from '../../types/persona';

interface ApoderadoTableProps {
  apoderados: Apoderado[];
  onEdit: (apoderado: Apoderado) => void;
}

export default function ApoderadoTable({ apoderados, onEdit }: ApoderadoTableProps) {
  if (!apoderados || apoderados.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No se encontraron apoderados registrados.
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
            <th style={{ padding: '1rem' }}>Parentesco</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {apoderados.map((apoderado) => (
            <tr key={apoderado.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>#{apoderado.id}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{apoderado.persona.tipoDocumento}</span>
                {apoderado.persona.numeroDocumento}
              </td>
              <td style={{ padding: '1rem', fontWeight: 500 }}>
                {apoderado.persona.nombres} {apoderado.persona.apellidos}
              </td>
              <td style={{ padding: '1rem' }}>
                <span style={{ 
                  backgroundColor: 'var(--color-surface-hover)', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px',
                  fontSize: '0.875rem'
                }}>
                  {apoderado.relacionParentesco}
                </span>
              </td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    onClick={() => onEdit(apoderado)}
                    className="icon-btn"
                    title="Editar Apoderado"
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
