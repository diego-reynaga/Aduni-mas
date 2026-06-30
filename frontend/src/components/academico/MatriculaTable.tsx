import { Ban } from 'lucide-react';
import type { Matricula } from '../../types/academico';

interface Props {
  matriculas: Matricula[];
  onRetirar: (id: number) => void;
}

export default function MatriculaTable({ matriculas, onRetirar }: Props) {
  if (!matriculas || matriculas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No hay matrículas registradas.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '1rem' }}>ID</th>
            <th style={{ padding: '1rem' }}>Estudiante</th>
            <th style={{ padding: '1rem' }}>Sección</th>
            <th style={{ padding: '1rem' }}>Fecha</th>
            <th style={{ padding: '1rem' }}>Monto</th>
            <th style={{ padding: '1rem' }}>Estado</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {matriculas.map((matricula) => (
            <tr key={matricula.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem' }}>{matricula.id}</td>
              <td style={{ padding: '1rem', fontWeight: 500 }}>{matricula.estudianteNombre}</td>
              <td style={{ padding: '1rem' }}>{matricula.seccionNombre}</td>
              <td style={{ padding: '1rem' }}>{matricula.fechaMatricula}</td>
              <td style={{ padding: '1rem' }}>S/ {matricula.montoTotalPactado}</td>
              <td style={{ padding: '1rem' }}>
                <span style={{ 
                  color: matricula.estado === 'Activo' ? 'var(--status-success)' : 'var(--status-error)',
                  fontWeight: 500 
                }}>
                  {matricula.estado}
                </span>
              </td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  {matricula.estado === 'Activo' && (
                    <button className="icon-btn" style={{ color: 'var(--status-error)' }} onClick={() => onRetirar(matricula.id)} title="Retirar">
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
