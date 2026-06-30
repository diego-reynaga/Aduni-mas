import { useState, useEffect } from 'react';
import type { Materia, MateriaRequest } from '../../types/academico';

interface Props {
  initialData?: Materia | null;
  onSubmit: (data: MateriaRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function MateriaForm({ initialData, onSubmit, onCancel, isLoading }: Props) {
  const [formData, setFormData] = useState<MateriaRequest>({
    nombre: '',
    area: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre,
        area: initialData.area,
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
        <label className="form-label">Nombre de la Materia</label>
        <input 
          type="text" 
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Área</label>
        <select 
          name="area"
          value={formData.area}
          onChange={handleChange}
          required
          className="form-input"
        >
          <option value="" disabled>Seleccione un área</option>
          <option value="Ingeniería">Ingeniería</option>
          <option value="Letras">Letras</option>
        </select>
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
