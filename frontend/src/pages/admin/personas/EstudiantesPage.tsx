import { useState, useEffect } from 'react';
import type { EstudianteBuscarResponse, EstudiantePaginadoResponse } from '../../../types/persona';
import { estudianteApi } from '../../../services/estudianteApi';
import { Search, Eye, Edit2, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import ExpedienteEstudiante from '../../../components/personas/ExpedienteEstudiante';

export default function EstudiantesPage() {
  const [data, setData] = useState<EstudiantePaginadoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [pagina, setPagina] = useState(0);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [expedienteId, setExpedienteId] = useState<number | null>(null);

  const fetchEstudiantes = async (q: string, est: string, p: number) => {
    try {
      setIsLoading(true);
      const { data: result } = await estudianteApi.buscarPaginado({
        q: q || undefined,
        estado: est || undefined,
        pagina: p,
        tamanio: 15
      });
      setData(result);
      setError(null);
    } catch (err) {
      setError('Error al cargar la lista de estudiantes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstudiantes(query, estadoFiltro, pagina);
  }, [pagina, estadoFiltro]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setPagina(0);
      fetchEstudiantes(value, estadoFiltro, 0);
    }, 400);
    setDebounceTimer(timer);
  };

  const handleEdit = (est: EstudianteBuscarResponse) => {
    alert(Edicion avanzada disponible en la ficha del estudiante. Abriendo expediente de: );
  };

  const handleDeactivate = async (est: EstudianteBuscarResponse) => {
    if (window.confirm(Esta seguro de retirar al estudiante ?)) {
      try {
        await estudianteApi.desactivar(est.id);
        fetchEstudiantes(query, estadoFiltro, pagina);
      } catch (err) {
        alert('Error al desactivar al estudiante');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Directorio de Estudiantes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Listado de alumnos y gestion de sus expedientes</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ flex: 1, margin: 0, position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por nombres, apellidos, codigo o DNI..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          </div>
          <div className="form-group" style={{ width: '200px', margin: 0 }}>
            <select className="form-input" value={estadoFiltro} onChange={(e) => { setEstadoFiltro(e.target.value); setPagina(0); }}>
              <option value="">Todos los estados</option>
              <option value="Regular">Regular</option>
              <option value="Condicional">Condicional</option>
              <option value="Retirado">Retirado</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando estudiantes...</div>
        ) : !data || data.contenido.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No se encontraron estudiantes.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '1rem' }}>Codigo</th>
                    <th style={{ padding: '1rem' }}>Nombres y Apellidos</th>
                    <th style={{ padding: '1rem' }}>Documento</th>
                    <th style={{ padding: '1rem' }}>Estado</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contenido.map((est) => (
                    <tr key={est.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500, fontSize: '0.875rem' }}>{est.codigoEstudiante}</td>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>
                        {est.nombres} {est.apellidos}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {est.tipoDocumento}: {est.numeroDocumento}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '9999px',
                          fontSize: '0.875rem', fontWeight: 500,
                          backgroundColor: est.estadoAcademico === 'Regular' ? '#10B98115' : est.estadoAcademico === 'Condicional' ? '#F59E0B15' : '#EF444415',
                          color: est.estadoAcademico === 'Regular' ? '#10B981' : est.estadoAcademico === 'Condicional' ? '#F59E0B' : '#EF4444'
                        }}>
                          {est.estadoAcademico}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button className="icon-btn" onClick={() => setExpedienteId(est.id)} title="Ver Ficha">
                            <Eye size={18} />
                          </button>
                          <button className="icon-btn" onClick={() => handleEdit(est)} title="Editar">
                            <Edit2 size={18} />
                          </button>
                          {est.estadoAcademico !== 'Retirado' && (
                            <button className="icon-btn" style={{ color: 'var(--status-error)' }}
                              onClick={() => handleDeactivate(est)} title="Retirar">
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span>
                Mostrando {data.contenido.length} de {data.totalElementos} estudiantes
                {data.totalElementos > 0 &&  - Pagina  de }
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-secondary"
                  disabled={data.pagina === 0}
                  onClick={() => setPagina(p => Math.max(0, p - 1))}
                  style={{ padding: '0.5rem 0.75rem' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="btn-secondary"
                  disabled={data.pagina >= data.totalPaginas - 1}
                  onClick={() => setPagina(p => p + 1)}
                  style={{ padding: '0.5rem 0.75rem' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {expedienteId !== null && (
        <ExpedienteEstudiante
          estudianteId={expedienteId}
          onClose={() => setExpedienteId(null)}
        />
      )}
    </div>
  );
}
