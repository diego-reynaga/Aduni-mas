import React, { useState, useEffect } from 'react';
import type { PersonaConPerfilesRequest, Apoderado } from '../../types/persona';
import { apoderadoApi } from '../../services/apoderadoApi';

interface PersonaFormProps {
  initialData?: any;
  onSubmit: (data: PersonaConPerfilesRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
}

export default function PersonaForm({ initialData, onSubmit, onCancel, isLoading, error }: PersonaFormProps) {
  const [formData, setFormData] = useState<PersonaConPerfilesRequest>({
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    direccion: '',
    perfiles: [],
    estudiante: {
      codigoEstudiante: '',
      estadoAcademico: 'Regular',
      idApoderado: null
    },
    apoderado: {
      relacionParentesco: ''
    },
    personalInstitucional: {
      cargo: '',
      fechaIngreso: new Date().toISOString().split('T')[0]
    }
  });

  const [apoderadosDisponibles, setApoderadosDisponibles] = useState<Apoderado[]>([]);

  useEffect(() => {
    if (initialData) {
      const perfilesActivos = initialData.perfiles?.map((p: any) => p.tipo) || [];
      
      const getPerfilData = (tipo: string) => {
        return initialData.perfiles?.find((p: any) => p.tipo === tipo)?.datos || {};
      };

      setFormData({
        ...initialData,
        perfiles: perfilesActivos,
        estudiante: {
          codigoEstudiante: getPerfilData('ESTUDIANTE').codigoEstudiante || '',
          estadoAcademico: getPerfilData('ESTUDIANTE').estadoAcademico || 'Regular',
          idApoderado: getPerfilData('ESTUDIANTE').idApoderado || null
        },
        apoderado: {
          relacionParentesco: getPerfilData('APODERADO').relacionParentesco || ''
        },
        personalInstitucional: {
          cargo: getPerfilData('PERSONAL_INSTITUCIONAL').cargo || '',
          fechaIngreso: getPerfilData('PERSONAL_INSTITUCIONAL').fechaIngreso || new Date().toISOString().split('T')[0]
        }
      });
    }

    // Cargar apoderados para el select de estudiante
    apoderadoApi.listar().then(res => setApoderadosDisponibles(res.data)).catch(console.error);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePerfilToggle = (perfil: string) => {
    setFormData(prev => {
      const perfiles = prev.perfiles.includes(perfil)
        ? prev.perfiles.filter(p => p !== perfil)
        : [...prev.perfiles, perfil];
      return { ...prev, perfiles };
    });
  };

  const handleNestedChange = (section: 'estudiante' | 'apoderado' | 'personalInstitucional', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as any),
        [field]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {error && (
        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Tipo Documento</label>
          <select name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange} required className="form-input">
            <option value="DNI">DNI</option>
            <option value="CE">Carnet de Extranjería</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Número de Documento</label>
          <input type="text" name="numeroDocumento" value={formData.numeroDocumento} onChange={handleChange} required className="form-input" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Nombres</label>
          <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required className="form-input" />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Apellidos</label>
          <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required className="form-input" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Correo Electrónico</label>
          <input type="email" name="correo" value={formData.correo || ''} onChange={handleChange} className="form-input" />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Teléfono</label>
          <input type="tel" name="telefono" value={formData.telefono || ''} onChange={handleChange} className="form-input" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Dirección</label>
        <input type="text" name="direccion" value={formData.direccion || ''} onChange={handleChange} className="form-input" />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

      <div>
        <label className="form-label" style={{ marginBottom: '0.75rem' }}>Perfiles de la Persona</label>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={formData.perfiles.includes('ESTUDIANTE')} onChange={() => handlePerfilToggle('ESTUDIANTE')} disabled={!!initialData} />
            Estudiante
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={formData.perfiles.includes('APODERADO')} onChange={() => handlePerfilToggle('APODERADO')} disabled={!!initialData} />
            Apoderado
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={formData.perfiles.includes('PERSONAL_INSTITUCIONAL')} onChange={() => handlePerfilToggle('PERSONAL_INSTITUCIONAL')} disabled={!!initialData} />
            Personal Institucional
          </label>
        </div>
      </div>

      {formData.perfiles.includes('ESTUDIANTE') && (
        <div style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '0.75rem', marginTop: '0.5rem', backgroundColor: 'var(--color-surface-hover)' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>Datos de Estudiante</h4>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Código de Estudiante</label>
              <input type="text" required value={formData.estudiante?.codigoEstudiante || ''} onChange={(e) => handleNestedChange('estudiante', 'codigoEstudiante', e.target.value)} className="form-input" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Apoderado Asignado</label>
              <select value={formData.estudiante?.idApoderado || ''} onChange={(e) => handleNestedChange('estudiante', 'idApoderado', e.target.value ? Number(e.target.value) : null)} className="form-input">
                <option value="">Sin Apoderado</option>
                {apoderadosDisponibles.map(apo => (
                  <option key={apo.id} value={apo.id}>{apo.persona.nombres} {apo.persona.apellidos}</option>
                ))}
              </select>
            </div>
          </div>
          {initialData && (
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Estado Académico</label>
              <select value={formData.estudiante?.estadoAcademico || 'Regular'} onChange={(e) => handleNestedChange('estudiante', 'estadoAcademico', e.target.value)} className="form-input">
                <option value="Regular">Regular</option>
                <option value="Condicional">Condicional</option>
                <option value="Retirado">Retirado</option>
              </select>
            </div>
          )}
        </div>
      )}

      {formData.perfiles.includes('APODERADO') && (
        <div style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '0.75rem', marginTop: '0.5rem', backgroundColor: 'var(--color-surface-hover)' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>Datos de Apoderado</h4>
          <div className="form-group">
            <label className="form-label">Relación / Parentesco</label>
            <input type="text" required value={formData.apoderado?.relacionParentesco || ''} onChange={(e) => handleNestedChange('apoderado', 'relacionParentesco', e.target.value)} placeholder="Ej: Padre, Madre, Tío" className="form-input" />
          </div>
        </div>
      )}

      {formData.perfiles.includes('PERSONAL_INSTITUCIONAL') && (
        <div style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '0.75rem', marginTop: '0.5rem', backgroundColor: 'var(--color-surface-hover)' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>Datos de Personal</h4>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Cargo</label>
              <input type="text" required value={formData.personalInstitucional?.cargo || ''} onChange={(e) => handleNestedChange('personalInstitucional', 'cargo', e.target.value)} className="form-input" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Fecha de Ingreso</label>
              <input type="date" required value={formData.personalInstitucional?.fechaIngreso || ''} onChange={(e) => handleNestedChange('personalInstitucional', 'fechaIngreso', e.target.value)} className="form-input" />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading || formData.perfiles.length === 0}>
          {isLoading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
