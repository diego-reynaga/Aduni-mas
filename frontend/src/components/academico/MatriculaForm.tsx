import { useState, useEffect } from 'react';
import type { MatriculaRequest, Seccion } from '../../types/academico';
import { seccionApi } from '../../services/seccionApi';

interface Props {
  onSubmit: (data: MatriculaRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function MatriculaForm({ onSubmit, onCancel, isLoading }: Props) {
  const [formData, setFormData] = useState<MatriculaRequest>({
    estudianteId: 0,
    seccionId: 0,
    montoTotalPactado: 0,
  });

  const [secciones, setSecciones] = useState<Seccion[]>([]);

  useEffect(() => {
    seccionApi.getAll().then(setSecciones).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: Number(value) 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group">
        <label className="form-label">ID del Estudiante</label>
        <input 
          type="number" 
          name="estudianteId"
          value={formData.estudianteId || ''}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Sección</label>
        <select 
          name="seccionId"
          value={formData.seccionId || ''}
          onChange={handleChange}
          required
          className="form-input"
        >
          <option value="" disabled>Seleccione una sección</option>
          {secciones.map(s => (
            <option key={s.id} value={s.id}>
              {s.cicloNombre} - {s.nombre} ({s.turnoNombre}) - Disp: {s.cuposDisponibles}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Monto Total Pactado (S/)</label>
        <input 
          type="number" 
          name="montoTotalPactado"
          value={formData.montoTotalPactado || ''}
          onChange={handleChange}
          required
          step="0.01"
          min="0"
          className="form-input"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Registrando...' : 'Registrar'}
        </button>
      </div>
    </form>
  );
}
