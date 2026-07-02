import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Search } from 'lucide-react';
import type { EstudianteBuscarResponse } from '../../types/persona';
import type { Seccion, MatriculaRequest } from '../../types/academico';
import { estudianteApi } from '../../services/estudianteApi';
import { seccionApi } from '../../services/seccionApi';
import { cicloApi } from '../../services/cicloApi';
import type { Ciclo } from '../../types/academico';
import BuscadorEstudiantes from '../personas/BuscadorEstudiantes';

interface Props {
  onSubmit: (data: MatriculaRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function MatriculaWizard({ onSubmit, onCancel, isLoading }: Props) {
  const [paso, setPaso] = useState(1);
  const [estudianteSel, setEstudianteSel] = useState<EstudianteBuscarResponse | null>(null);
  const [seccionSel, setSeccionSel] = useState<Seccion | null>(null);
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [cicloId, setCicloId] = useState<number | ''>('');
  const [turnoId, setTurnoId] = useState<number | ''>('');
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [seccionesLoading, setSeccionesLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cicloApi.getAll().then(({ data }) => setCiclos(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (cicloId !== '' || turnoId !== '') {
      setSeccionesLoading(true);
      setSeccionSel(null);
      seccionApi.getDisponibles(cicloId || undefined, turnoId || undefined)
        .then(setSecciones)
        .catch(() => setSecciones([]))
        .finally(() => setSeccionesLoading(false));
    }
  }, [cicloId, turnoId]);

  const handleSubmit = () => {
    if (!estudianteSel || !seccionSel || !monto) return;
    setError('');
    onSubmit({
      estudianteId: estudianteSel.id,
      seccionId: seccionSel.id,
      montoTotalPactado: Number(monto),
      fechaMatricula: fecha,
    });
  };

  const pasos = [
    { num: 1, label: 'Estudiante' },
    { num: 2, label: 'Aula / Seccion' },
    { num: 3, label: 'Confirmacion' },
  ];

  return (
    <div className="animate-fade-in">
      {error && (
        <div style={{
          padding: '0.75rem', borderRadius: '0.5rem',
          backgroundColor: '#fee2e2', color: '#991b1b',
          border: '1px solid #f87171', marginBottom: '1rem'
        }}>{error}</div>
      )}

      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '2rem',
        alignItems: 'center', justifyContent: 'center'
      }}>
        {pasos.map((p, i) => (
          <div key={p.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '0.875rem',
              background: paso >= p.num ? 'var(--color-primary)' : 'var(--color-surface-hover)',
              color: paso >= p.num ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}>{p.num}</div>
            <span style={{
              fontSize: '0.875rem', fontWeight: paso === p.num ? 600 : 400,
              color: paso >= p.num ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}>{p.label}</span>
            {i < pasos.length - 1 && (
              <div style={{
                width: '40px', height: '2px',
                background: paso > p.num ? 'var(--color-primary)' : 'var(--border-color)',
                margin: '0 0.25rem'
              }} />
            )}
          </div>
        ))}
      </div>

      {/* PASO 1 */}
      {paso === 1 && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Seleccionar Estudiante</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Busque al estudiante por nombre, codigo o documento. Solo se muestran estudiantes activos.
          </p>
          <BuscadorEstudiantes onSelect={setEstudianteSel} selected={estudianteSel} />
        </div>
      )}

      {/* PASO 2 */}
      {paso === 2 && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Seleccionar Aula / Seccion</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Seleccione el ciclo academico, turno, y luego la seccion disponible.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label">Ciclo Academico</label>
              <select className="form-input" value={cicloId} onChange={(e) => setCicloId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Todos los ciclos</option>
                {ciclos.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label">Turno</label>
              <select className="form-input" value={turnoId} onChange={(e) => setTurnoId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Todos los turnos</option>
                <option value={1}>Manana</option>
                <option value={2}>Tarde</option>
              </select>
            </div>
          </div>

          {seccionesLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando secciones...</p>}

          {!seccionesLoading && secciones.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No se encontraron secciones disponibles con los filtros seleccionados.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
            {secciones.filter(s => s.cuposDisponibles > 0).map(s => {
              const pct = s.cuposDisponibles / s.cupoMaximo;
              const isSelected = seccionSel?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSeccionSel(s)}
                  style={{
                    padding: '0.875rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--color-primary-light, #EEF2FF)' : 'transparent',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{s.cicloNombre}</strong> &mdash; {s.nombre}
                      <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        ({s.turnoNombre})
                      </span>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: pct > 0.3 ? '#10B981' : pct > 0.1 ? '#F59E0B' : '#EF4444'
                    }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {s.cuposDisponibles}/{s.cupoMaximo} disp.
                      </span>
                      {isSelected && <Check size={18} />}
                    </div>
                  </div>
                  <div style={{
                    marginTop: '0.375rem', height: '4px', borderRadius: '2px',
                    background: 'var(--color-surface-hover)', overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '2px', transition: 'width 0.3s',
                      width: ${(1 - pct) * 100}%,
                      background: pct > 0.3 ? '#10B981' : pct > 0.1 ? '#F59E0B' : '#EF4444'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PASO 3 */}
      {paso === 3 && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Confirmar Matricula</h3>
          <div style={{
            padding: '1.25rem', borderRadius: '0.75rem',
            background: 'var(--color-surface-hover)', marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Estudiante</label>
                <div style={{ fontWeight: 500 }}>{estudianteSel?.nombres} {estudianteSel?.apellidos}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{estudianteSel?.codigoEstudiante}</div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Seccion</label>
                <div style={{ fontWeight: 500 }}>{seccionSel?.cicloNombre} - {seccionSel?.nombre}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Turno: {seccionSel?.turnoNombre}</div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Vacantes</label>
                <div style={{ fontWeight: 500, color: '#10B981' }}>
                  {seccionSel?.cuposDisponibles} de {seccionSel?.cupoMaximo} disponibles
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Estado</label>
                <div style={{ fontWeight: 500 }}>ACTIVO</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label">Fecha de Matricula</label>
              <input type="date" className="form-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label">Monto Total Pactado (S/)</label>
              <input
                type="number" className="form-input" step="0.01" min="0"
                placeholder="0.00"
                value={monto} onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{
            padding: '0.75rem', borderRadius: '0.5rem',
            background: '#F59E0B15', color: '#92400E',
            border: '1px solid #FCD34D', fontSize: '0.875rem'
          }}>
            Al confirmar se validara el cupo disponible y se registrara la matricula.
            Una vez registrada, no se podra modificar el aula.
          </div>
        </div>
      )}

      {/* BOTONES DE NAVEGACION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <div>
          {paso > 1 ? (
            <button className="btn-secondary" onClick={() => setPaso(p => p - 1)} disabled={isLoading}>
              <ArrowLeft size={18} /> Atras
            </button>
          ) : (
            <button className="btn-secondary" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </button>
          )}
        </div>
        <div>
          {paso < 3 ? (
            <button
              className="btn-primary"
              onClick={() => {
                if (paso === 1 && !estudianteSel) { setError('Debe seleccionar un estudiante'); return; }
                if (paso === 2 && !seccionSel) { setError('Debe seleccionar una seccion'); return; }
                setError('');
                setPaso(p => p + 1);
              }}
            >
              Siguiente <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={isLoading || !monto || Number(monto) <= 0}
            >
              {isLoading ? 'Registrando...' : 'Confirmar Matricula'} <Check size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
