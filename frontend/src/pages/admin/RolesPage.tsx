import { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { rolApi } from '../../services/rolApi';
import type { Rol, RolRequest } from '../../services/rolApi';

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRol, setEditingRol] = useState<Rol | null>(null);
  const [formName, setFormName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await rolApi.listar();
      setRoles(response.data);
      setError('');
    } catch {
      setError('Error al cargar roles.');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingRol(null);
    setFormName('');
    setShowForm(true);
  };

  const handleEdit = (rol: Rol) => {
    setEditingRol(rol);
    setFormName(rol.nombre);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este rol?')) return;
    try {
      await rolApi.eliminar(id);
      fetchRoles();
    } catch {
      alert('Error al eliminar el rol. Verifique que no tenga usuarios asociados.');
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const data: RolRequest = { nombre: formName.trim().toUpperCase() };
      if (editingRol) {
        await rolApi.actualizar(editingRol.id, data);
      } else {
        await rolApi.crear(data);
      }
      setShowForm(false);
      fetchRoles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar el rol.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Roles y Permisos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gestiona los roles del sistema.</p>
        </div>
        <button className="btn-primary" onClick={handleNew}>
          <Plus size={20} />
          Nuevo Rol
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--color-surface)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando roles...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>ID</th>
                  <th style={{ padding: '1rem' }}>Rol</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((rol) => (
                  <tr key={rol.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{rol.id}</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={16} />
                        {rol.nombre}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="icon-btn" onClick={() => handleEdit(rol)} title="Editar">
                          <Edit size={18} />
                        </button>
                        <button className="icon-btn" style={{ color: 'var(--status-error)' }} onClick={() => handleDelete(rol.id)} title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No hay roles registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
    {showForm && (
      <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>{editingRol ? 'Editar Rol' : 'Nuevo Rol'}</h2>
              <button className="icon-btn" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre del Rol</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ej. DIRECCION_ACADEMICA"
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving || !formName.trim()}>
                  <Save size={18} />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
