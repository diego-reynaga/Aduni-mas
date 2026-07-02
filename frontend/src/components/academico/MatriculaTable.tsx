import { Ban, ArrowUpDown } from 'lucide-react';
import type { Matricula, EstadoMatricula } from '../../types/academico';
import { COLORES_ESTADO, TRANSICIONES_ESTADO } from '../../types/academico';

interface Props {
  matriculas: Matricula[];
  onRetirar: (id: number) => void;
  onCambiarEstado: (id: number, estado: string) => void;
}

function EstadosPosibles(actual: string): string[] {
  return TRANSICIONES_ESTADO[actual] || [];
}

export default function MatriculaTable({ matriculas, onRetirar, onCambiarEstado }: Props) {
  if (!matriculas || matriculas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        No hay matriculas registradas.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '1rem' }}>Codigo</th>
            <th style={{ padding: '1rem' }}>Estudiante</th>
            <th style={{ padding: '1rem' }}>Seccion</th>
            <th style={{ padding: '1rem' }}>Fecha</th>
            <th style={{ padding: '1rem' }}>Monto</th>
            <th style={{ padding: '1rem' }}>Estado</th>
            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {matriculas.map((matricula) => {
            const color = COLORES_ESTADO[matricula.estado] || '#6B7280';
            const transiciones = EstadosPosibles(matricula.estado);
            return (
              <tr key={matricula.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: 500, fontSize: '0.875rem' }}>
                  {matricula.codigoMatricula || #}
                </td>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{matricula.estudianteNombre}</td>
                <td style={{ padding: '1rem' }}>{matricula.seccionNombre}</td>
                <td style={{ padding: '1rem' }}>{matricula.fechaMatricula}</td>
                <td style={{ padding: '1rem' }}>S/ {matricula.montoTotalPactado}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    color, fontWeight: 500,
                    padding: '0.25rem 0.75rem', borderRadius: '9999px',
                    background: ${color}15, fontSize: '0.875rem'
                  }}>
                    {matricula.estado}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    {transiciones.length > 0 && (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <select
                          style={{
                            padding: '0.375rem 0.75rem', borderRadius: '0.375rem',
                            border: '1px solid var(--border-color)',
                            background: 'var(--color-surface)', cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                          onChange={(e) => {
                            if (e.target.value) onCambiarEstado(matricula.id, e.target.value);
                            e.target.value = '';
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Cambiar estado</option>
                          {transiciones.map(est => (
                            <option key={est} value={est}>{est}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {matricula.estado === 'ACTIVO' && (
                      <button className="icon-btn" style={{ color: 'var(--status-error)' }}
                        onClick={() => onRetirar(matricula.id)} title="Retirar">
                        <Ban size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
