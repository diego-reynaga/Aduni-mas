import { Edit, Trash2 } from 'lucide-react';
import type { Materia } from '../../types/academico';

interface Props {
  materias: Materia[];
  onEdit: (materia: Materia) => void;
  onDelete: (id: number) => void;
}

export default function MateriaTable({ materias, onEdit, onDelete }: Props) {
  if (!materias || materias.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No hay materias registradas.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '1rem' }}>ID</th>
            <th style={{ padding: '1rem' }}>Nombre</th>
            <th style={{ padding: '1rem' }}>Área</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {materias.map((materia) => (
            <tr key={materia.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem' }}>{materia.id}</td>
              <td style={{ padding: '1rem', fontWeight: 500 }}>{materia.nombre}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{ 
                  backgroundColor: 'var(--color-surface-hover)', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px',
                  fontSize: '0.875rem'
                }}>
                  {materia.area}
                </span>
              </td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="icon-btn" onClick={() => onEdit(materia)} title="Editar">
                    <Edit size={18} />
                  </button>
                  <button className="icon-btn" style={{ color: 'var(--status-error)' }} onClick={() => onDelete(materia.id)} title="Eliminar">
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
