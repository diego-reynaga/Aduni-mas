import { useEffect, useState } from 'react';
import { X, User, Phone, Mail, MapPin, BookOpen } from 'lucide-react';
import type { EstudianteExpedienteResponse } from '../../types/persona';
import { estudianteApi } from '../../services/estudianteApi';
import { COLORES_ESTADO } from '../../types/academico';

interface Props {
  estudianteId: number;
  onClose: () => void;
}

export default function ExpedienteEstudiante({ estudianteId, onClose }: Props) {
  const [expediente, setExpediente] = useState<EstudianteExpedienteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    estudianteApi.obtenerExpediente(estudianteId)
      .then(({ data }) => setExpediente(data))
      .catch(() => setError('Error al cargar expediente'))
      .finally(() => setLoading(false));
  }, [estudianteId]);

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '640px' }}>
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando expediente...</p>
      </div>
    </div>
  );

  if (error || !expediente) return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '640px' }}>
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--status-error)' }}>{error || 'Sin datos'}</p>
        <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>Cerrar</button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Ficha del Estudiante</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{
          padding: '1.25rem', borderRadius: '0.75rem',
          background: 'var(--color-surface-hover)', marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--color-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 700, flexShrink: 0
            }}>
              {expediente.nombres[0]}{expediente.apellidos[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h3 style={{ margin: 0 }}>{expediente.nombres} {expediente.apellidos}</h3>
                <span style={{
                  padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500,
                  background: ${COLORES_ESTADO[expediente.estadoAcademico] || '#6B7280'}20,
                  color: COLORES_ESTADO[expediente.estadoAcademico] || '#6B7280'
                }}>{expediente.estadoAcademico}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <strong>{expediente.codigoEstudiante}</strong>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <User size={14} /> Documento
            </label>
            <div style={{ padding: '0.5rem 0.75rem', background: 'var(--color-surface-hover)', borderRadius: '0.375rem' }}>
              {expediente.tipoDocumento}: {expediente.numeroDocumento}
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Mail size={14} /> Correo
            </label>
            <div style={{ padding: '0.5rem 0.75rem', background: 'var(--color-surface-hover)', borderRadius: '0.375rem' }}>
              {expediente.correo || '--'}
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Phone size={14} /> Telefono
            </label>
            <div style={{ padding: '0.5rem 0.75rem', background: 'var(--color-surface-hover)', borderRadius: '0.375rem' }}>
              {expediente.telefono || '--'}
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <MapPin size={14} /> Direccion
            </label>
            <div style={{ padding: '0.5rem 0.75rem', background: 'var(--color-surface-hover)', borderRadius: '0.375rem' }}>
              {expediente.direccion || '--'}
            </div>
          </div>
        </div>

        <div style={{
          padding: '1rem', borderRadius: '0.75rem',
          background: 'var(--color-surface-hover)', marginBottom: '1.5rem'
        }}>
          <div style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <User size={16} /> Apoderado
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {expediente.apoderadoNombre
              ? ${expediente.apoderadoNombre} ()
              : 'No asignado'}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 500, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <BookOpen size={16} /> Historial de Matriculas
          </div>
          {expediente.historialMatriculas.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem 0' }}>
              Sin matriculas registradas
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Codigo</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Seccion</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Fecha</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {expediente.historialMatriculas.map((m: any) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{m.codigoMatricula || m.id}</td>
                      <td style={{ padding: '0.5rem' }}>{m.seccionNombre}</td>
                      <td style={{ padding: '0.5rem' }}>{m.fechaMatricula}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem',
                          background: ${COLORES_ESTADO[m.estado] || '#6B7280'}20,
                          color: COLORES_ESTADO[m.estado] || '#6B7280'
                        }}>{m.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
