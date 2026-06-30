import { useState, useEffect } from 'react';
import type { Turno, TurnoRequest } from '../../types/academico';

interface Props {
  initialData?: Turno | null;
  onSubmit: (data: TurnoRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function TurnoForm({ initialData, onSubmit, onCancel, isLoading }: Props) {
  const [formData, setFormData] = useState<TurnoRequest>({
    nombre: '',
    horaInicio: '',
    horaFin: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre,
        horaInicio: initialData.horaInicio,
        horaFin: initialData.horaFin,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group">
        <label className="form-label">Nombre del Turno</label>
        <select 
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          className="form-input"
        >
          <option value="" disabled>Seleccione un turno</option>
          <option value="Mañana">Mañana</option>
          <option value="Tarde">Tarde</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Hora de Inicio</label>
          <input 
            type="time" 
            name="horaInicio"
            value={formData.horaInicio}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Hora de Fin</label>
          <input 
            type="time" 
            name="horaFin"
            value={formData.horaFin}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
