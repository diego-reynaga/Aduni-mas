import { NavLink } from 'react-router-dom';
import { Users, Shield, BookOpen, Settings, Activity, GraduationCap, UserCheck, Building2, Calendar, Clock, LayoutGrid, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
  roles: string[];
}

const allNavItems: NavItem[] = [
  { label: 'Usuarios', icon: Users, path: '/admin/usuarios', roles: ['ADMINISTRADOR', 'DIRECCION_ACADEMICA'] },
  { label: 'Roles y Permisos', icon: Shield, path: '/admin/roles', roles: ['ADMINISTRADOR'] },
  { label: 'Auditoría', icon: Activity, path: '/admin/auditoria', roles: ['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'DIRECCION_ADMINISTRATIVA'] },
  { label: 'Personas', icon: Users, path: '/admin/personas', roles: ['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA'] },
  { label: 'Estudiantes', icon: GraduationCap, path: '/admin/estudiantes', roles: ['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'DOCENTE', 'SECRETARIA'] },
  { label: 'Apoderados', icon: UserCheck, path: '/admin/apoderados', roles: ['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA'] },
  { label: 'Personal', icon: Building2, path: '/admin/personal', roles: ['ADMINISTRADOR', 'DIRECCION_ADMINISTRATIVA'] },
  { label: 'Ciclos', icon: Calendar, path: '/admin/ciclos', roles: ['ADMINISTRADOR', 'DIRECCION_ACADEMICA'] },
  { label: 'Turnos', icon: Clock, path: '/admin/turnos', roles: ['ADMINISTRADOR', 'DIRECCION_ACADEMICA'] },
  { label: 'Materias', icon: BookOpen, path: '/admin/materias', roles: ['ADMINISTRADOR', 'DIRECCION_ACADEMICA'] },
  { label: 'Secciones', icon: LayoutGrid, path: '/admin/secciones', roles: ['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA'] },
  { label: 'Matrículas', icon: ClipboardList, path: '/admin/matriculas', roles: ['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA'] },
  { label: 'Configuración', icon: Settings, path: '/admin/config', roles: ['ADMINISTRADOR'] },
];

export default function Sidebar() {
  const { hasAnyRole } = useAuth();

  const visibleItems = allNavItems.filter(item => hasAnyRole(item.roles));

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      backgroundColor: 'var(--color-surface)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 10,
    }}>
      <div style={{
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <h2 style={{ color: 'var(--color-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
          Aduni+ Admin
        </h2>
      </div>

      <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--color-surface-hover)' : 'transparent',
              fontWeight: isActive ? 600 : 500,
            })}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
