import { useState, useEffect } from 'react';
import type { Usuario, UsuarioRequest } from '../../types/usuario';

interface Props {
  initialData?: Usuario | null;
  onSubmit: (data: UsuarioRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function UsuarioForm({ initialData, onSubmit, onCancel, isLoading }: Props) {
  const [formData, setFormData] = useState<UsuarioRequest>({
    username: '',
    password: '',
    personaId: 0,
    rolId: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username,
        password: '', // Password usually left empty on edit unless changing
        personaId: initialData.personaId,
        rolId: initialData.rolId,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'personaId' || name === 'rolId' ? Number(value) : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group">
        <label className="form-label">Nombre de Usuario</label>
        <input 
          type="text" 
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Contraseña {initialData && '(Opcional)'}</label>
        <input 
          type="password" 
          name="password"
          value={formData.password}
          onChange={handleChange}
          required={!initialData}
          className="form-input"
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">ID Persona</label>
          <input 
            type="number" 
            name="personaId"
            value={formData.personaId || ''}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Rol (ID)</label>
          <select 
            name="rolId"
            value={formData.rolId || ''}
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="" disabled>Seleccionar Rol</option>
            <option value="1">Administrador</option>
            <option value="2">Docente</option>
            <option value="3">Estudiante</option>
            <option value="4">Apoderado</option>
          </select>
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
