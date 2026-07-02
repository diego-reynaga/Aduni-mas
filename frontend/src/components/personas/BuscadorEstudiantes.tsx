import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import type { EstudianteBuscarResponse } from '../../types/persona';
import { estudianteApi } from '../../services/estudianteApi';

interface Props {
  onSelect: (estudiante: EstudianteBuscarResponse) => void;
  selected: EstudianteBuscarResponse | null;
}

export default function BuscadorEstudiantes({ onSelect, selected }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EstudianteBuscarResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await estudianteApi.buscarActivos(value, 8);
        setResults(data);
        setShowDropdown(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div className="form-group" style={{ flex: 1, margin: 0 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nombres, apellidos, codigo o DNI..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
          />
        </div>
        <Search size={20} style={{ color: 'var(--text-secondary)' }} />
      </div>

      {selected && (
        <div style={{
          marginTop: '0.75rem', padding: '0.75rem 1rem',
          background: 'var(--color-surface-hover)', borderRadius: '0.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <strong>{selected.codigoEstudiante}</strong> &mdash; {selected.nombres} {selected.apellidos}
            <span style={{ marginLeft: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {selected.tipoDocumento}: {selected.numeroDocumento}
            </span>
          </div>
          <span style={{
            padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem',
            background: '#10B98120', color: '#10B981', fontWeight: 500
          }}>Regular</span>
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          marginTop: '0.25rem', borderRadius: '0.5rem',
          background: 'var(--color-surface)', border: '1px solid var(--border-color)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxHeight: '320px', overflowY: 'auto'
        }}>
          {results.map((est) => (
            <div
              key={est.id}
              onClick={() => { onSelect(est); setShowDropdown(false); setQuery(''); }}
              style={{
                padding: '0.75rem 1rem', cursor: 'pointer',
                borderBottom: '1px solid var(--border-color)',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontWeight: 500 }}>{est.nombres} {est.apellidos}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {est.codigoEstudiante} &middot; {est.tipoDocumento}: {est.numeroDocumento}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Buscando...
        </div>
      )}
    </div>
  );
}
