import { useState, useEffect } from 'react';
import type { Seccion, SeccionRequest, Ciclo, Turno } from '../../types/academico';
import { cicloApi } from '../../services/cicloApi';
import { turnoApi } from '../../services/turnoApi';

interface Props {
  initialData?: Seccion | null;
  onSubmit: (data: SeccionRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function SeccionForm({ initialData, onSubmit, onCancel, isLoading }: Props) {
  const [formData, setFormData] = useState<SeccionRequest>({
    cicloId: 0,
    turnoId: 0,
    nombre: '',
    cupoMaximo: 30,
  });

  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);

  useEffect(() => {
    cicloApi.getAll().then(setCiclos).catch(console.error);
    turnoApi.getAll().then(setTurnos).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        cicloId: initialData.cicloId,
        turnoId: initialData.turnoId,
        nombre: initialData.nombre,
        cupoMaximo: initialData.cupoMaximo,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'cicloId' || name === 'turnoId' || name === 'cupoMaximo') ? Number(value) : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Ciclo Académico</label>
          <select 
            name="cicloId"
            value={formData.cicloId || ''}
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="" disabled>Seleccione un ciclo</option>
            {ciclos.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Turno</label>
          <select 
            name="turnoId"
            value={formData.turnoId || ''}
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="" disabled>Seleccione un turno</option>
            {turnos.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Nombre de Sección (ej. A)</label>
          <input 
            type="text" 
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            maxLength={10}
            className="form-input"
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Cupo Máximo</label>
          <input 
            type="number" 
            name="cupoMaximo"
            value={formData.cupoMaximo}
            onChange={handleChange}
            required
            min={1}
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
