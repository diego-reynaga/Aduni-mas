import { useState, useEffect } from 'react';
import type { Ciclo, CicloRequest } from '../../types/academico';

interface Props {
  initialData?: Ciclo | null;
  onSubmit: (data: CicloRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function CicloForm({ initialData, onSubmit, onCancel, isLoading }: Props) {
  const [formData, setFormData] = useState<CicloRequest>({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre,
        fechaInicio: initialData.fechaInicio,
        fechaFin: initialData.fechaFin,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <label className="form-label">Nombre del Ciclo</label>
        <input 
          type="text" 
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Fecha de Inicio</label>
          <input 
            type="date" 
            name="fechaInicio"
            value={formData.fechaInicio}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Fecha de Fin</label>
          <input 
            type="date" 
            name="fechaFin"
            value={formData.fechaFin}
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
