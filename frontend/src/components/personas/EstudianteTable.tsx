import React from 'react';
import { Edit2, Ban } from 'lucide-react';
import type { Estudiante } from '../../types/persona';

interface EstudianteTableProps {
  estudiantes: Estudiante[];
  onEdit: (estudiante: Estudiante) => void;
  onDeactivate: (estudiante: Estudiante) => void;
}

export default function EstudianteTable({ estudiantes, onEdit, onDeactivate }: EstudianteTableProps) {
  if (!estudiantes || estudiantes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No se encontraron estudiantes registrados.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '1rem' }}>Código</th>
            <th style={{ padding: '1rem' }}>Nombres y Apellidos</th>
            <th style={{ padding: '1rem' }}>Apoderado</th>
            <th style={{ padding: '1rem' }}>Estado</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {estudiantes.map((estudiante) => (
            <tr key={estudiante.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem', fontWeight: 500 }}>{estudiante.codigoEstudiante}</td>
              <td style={{ padding: '1rem' }}>
                {estudiante.persona.nombres} {estudiante.persona.apellidos}
              </td>
              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                {estudiante.apoderado ? (
                  `${estudiante.apoderado.nombres} ${estudiante.apoderado.apellidos}`
                ) : (
                  <span style={{ fontStyle: 'italic' }}>No asignado</span>
                )}
              </td>
              <td style={{ padding: '1rem' }}>
                <span style={{ 
                  backgroundColor: 'var(--color-surface-hover)', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px',
                  fontSize: '0.875rem'
                }}>
                  {estudiante.estadoAcademico}
                </span>
              </td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    onClick={() => onEdit(estudiante)}
                    className="icon-btn"
                    title="Editar Estudiante"
                  >
                    <Edit2 size={18} />
                  </button>
                  {estudiante.estadoAcademico !== 'Retirado' && (
                    <button
                      onClick={() => onDeactivate(estudiante)}
                      className="icon-btn" style={{ color: 'var(--status-error)' }}
                      title="Desactivar/Retirar Estudiante"
                    >
                      <Ban size={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
