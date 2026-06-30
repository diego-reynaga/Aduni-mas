import { Edit, Trash2 } from 'lucide-react';
import type { Seccion } from '../../types/academico';

interface Props {
  secciones: Seccion[];
  onEdit: (seccion: Seccion) => void;
  onDelete: (id: number) => void;
}

export default function SeccionTable({ secciones, onEdit, onDelete }: Props) {
  if (!secciones || secciones.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No hay secciones registradas.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '1rem' }}>ID</th>
            <th style={{ padding: '1rem' }}>Ciclo</th>
            <th style={{ padding: '1rem' }}>Turno</th>
            <th style={{ padding: '1rem' }}>Sección</th>
            <th style={{ padding: '1rem' }}>Cupos Disponibles</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {secciones.map((seccion) => (
            <tr key={seccion.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem' }}>{seccion.id}</td>
              <td style={{ padding: '1rem', fontWeight: 500 }}>{seccion.cicloNombre}</td>
              <td style={{ padding: '1rem' }}>{seccion.turnoNombre}</td>
              <td style={{ padding: '1rem', fontWeight: 'bold' }}>{seccion.nombre}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{ 
                  color: seccion.cuposDisponibles <= 5 ? 'var(--status-error)' : 'var(--status-success)',
                  fontWeight: 500 
                }}>
                  {seccion.cuposDisponibles} / {seccion.cupoMaximo}
                </span>
              </td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="icon-btn" onClick={() => onEdit(seccion)} title="Editar">
                    <Edit size={18} />
                  </button>
                  <button className="icon-btn" style={{ color: 'var(--status-error)' }} onClick={() => onDelete(seccion.id)} title="Eliminar">
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
