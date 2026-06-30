import { useState, useEffect, useCallback } from 'react';
import { Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { auditoriaApi } from '../../services/auditoriaApi';
import type { LogAuditoria, PageResponse } from '../../services/auditoriaApi';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroTabla, setFiltroTabla] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await auditoriaApi.listar({
        usuario: filtroUsuario || undefined,
        accion: filtroAccion || undefined,
        tabla: filtroTabla || undefined,
        page,
        size: 20,
      });
      const data: PageResponse<LogAuditoria> = response.data;
      setLogs(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setError('');
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || err.message;
      setError('Error al cargar registros: ' + backendMessage);
    } finally {
      setLoading(false);
    }
  }, [page, filtroUsuario, filtroAccion, filtroTabla]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-PE');
  };

  const colorPorAccion = (accion: string) => {
    const colores: Record<string, string> = {
      'Insercion': 'var(--status-success)',
      'Modificacion': 'var(--status-warning)',
      'Eliminacion': 'var(--status-error)',
      'Inicio Sesion': 'var(--color-primary)',
      'Intento Fallido': 'var(--status-error)',
    };
    return colores[accion] || 'var(--text-secondary)';
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Auditoría del Sistema</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Registro de actividades de los usuarios en el sistema.</p>
      </div>

      <form onSubmit={handleSearch} style={{
        display: 'flex', gap: '1rem', marginBottom: '1.5rem',
        flexWrap: 'wrap', alignItems: 'flex-end'
      }}>
        <div className="form-group" style={{ flex: 1, minWidth: '150px', gap: '0.25rem' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Usuario</label>
          <input
            type="text"
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
            placeholder="Filtrar por usuario..."
            className="form-input"
            style={{ padding: '0.5rem 0.75rem' }}
          />
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: '150px', gap: '0.25rem' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Acción</label>
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="form-input"
            style={{ padding: '0.5rem 0.75rem' }}
          >
            <option value="">Todas</option>
            <option value="Insercion">Inserción</option>
            <option value="Modificacion">Modificación</option>
            <option value="Eliminacion">Eliminación</option>
            <option value="Inicio Sesion">Inicio Sesión</option>
            <option value="Intento Fallido">Intento Fallido</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: '150px', gap: '0.25rem' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Módulo</label>
          <input
            type="text"
            value={filtroTabla}
            onChange={(e) => setFiltroTabla(e.target.value)}
            placeholder="Filtrar por módulo..."
            className="form-input"
            style={{ padding: '0.5rem 0.75rem' }}
          />
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.25rem', height: '2.4rem' }}>
          <Search size={16} />
          Buscar
        </button>
      </form>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando registros...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem' }}>ID</th>
                    <th style={{ padding: '0.75rem' }}>Fecha</th>
                    <th style={{ padding: '0.75rem' }}>Usuario</th>
                    <th style={{ padding: '0.75rem' }}>Acción</th>
                    <th style={{ padding: '0.75rem' }}>Módulo</th>
                    <th style={{ padding: '0.75rem' }}>ID Registro</th>
                    <th style={{ padding: '0.75rem' }}>IP</th>
                    <th style={{ padding: '0.75rem' }}>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem' }}>{log.id}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={14} />
                          {formatearFecha(log.fecha)}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 500 }}>{log.usuario}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          backgroundColor: `${colorPorAccion(log.accion)}20`,
                          color: colorPorAccion(log.accion),
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {log.accion}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{log.modulo}</td>
                      <td style={{ padding: '0.75rem' }}>{log.idRegistroAfectado ?? '-'}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>{log.ipOrigen ?? '-'}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.detalles}>
                        {log.detalles}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No se encontraron registros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem 0 0', borderTop: '1px solid var(--border-color)', marginTop: '1rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {totalElements} registros - Página {page + 1} de {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-secondary"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
