import { Edit, Trash2 } from 'lucide-react';
import type { Ciclo } from '../../types/academico';

interface Props {
  ciclos: Ciclo[];
  onEdit: (ciclo: Ciclo) => void;
  onDelete: (id: number) => void;
}

export default function CicloTable({ ciclos, onEdit, onDelete }: Props) {
  if (!ciclos || ciclos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No hay ciclos registrados.
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
            <th style={{ padding: '1rem' }}>Fecha Inicio</th>
            <th style={{ padding: '1rem' }}>Fecha Fin</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ciclos.map((ciclo) => (
            <tr key={ciclo.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem' }}>{ciclo.id}</td>
              <td style={{ padding: '1rem', fontWeight: 500 }}>{ciclo.nombre}</td>
              <td style={{ padding: '1rem' }}>{ciclo.fechaInicio}</td>
              <td style={{ padding: '1rem' }}>{ciclo.fechaFin}</td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="icon-btn" onClick={() => onEdit(ciclo)} title="Editar">
                    <Edit size={18} />
                  </button>
                  <button className="icon-btn" style={{ color: 'var(--status-error)' }} onClick={() => onDelete(ciclo.id)} title="Eliminar">
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
