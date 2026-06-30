import { Edit, Trash2 } from 'lucide-react';
import type { Turno } from '../../types/academico';

interface Props {
  turnos: Turno[];
  onEdit: (turno: Turno) => void;
  onDelete: (id: number) => void;
}

export default function TurnoTable({ turnos, onEdit, onDelete }: Props) {
  if (!turnos || turnos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No hay turnos registrados.
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
            <th style={{ padding: '1rem' }}>Hora Inicio</th>
            <th style={{ padding: '1rem' }}>Hora Fin</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {turnos.map((turno) => (
            <tr key={turno.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem' }}>{turno.id}</td>
              <td style={{ padding: '1rem', fontWeight: 500 }}>{turno.nombre}</td>
              <td style={{ padding: '1rem' }}>{turno.horaInicio}</td>
              <td style={{ padding: '1rem' }}>{turno.horaFin}</td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="icon-btn" onClick={() => onEdit(turno)} title="Editar">
                    <Edit size={18} />
                  </button>
                  <button className="icon-btn" style={{ color: 'var(--status-error)' }} onClick={() => onDelete(turno.id)} title="Eliminar">
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
