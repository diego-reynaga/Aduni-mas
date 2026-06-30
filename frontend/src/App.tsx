import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import UsuariosPage from './pages/admin/UsuariosPage';
import RolesPage from './pages/admin/RolesPage';
import AuditoriaPage from './pages/admin/AuditoriaPage';
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import PersonasPage from './pages/admin/personas/PersonasPage';
import EstudiantesPage from './pages/admin/personas/EstudiantesPage';
import ApoderadosPage from './pages/admin/personas/ApoderadosPage';
import PersonalPage from './pages/admin/personas/PersonalPage';
import CiclosPage from './pages/admin/academico/CiclosPage';
import TurnosPage from './pages/admin/academico/TurnosPage';
import MateriasPage from './pages/admin/academico/MateriasPage';
import SeccionesPage from './pages/admin/academico/SeccionesPage';
import MatriculasPage from './pages/admin/academico/MatriculasPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/admin/usuarios" replace />} />

      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path="usuarios"
            element={
              <RoleGuard requiredRoles={['ADMINISTRADOR', 'DIRECCION_ACADEMICA']}>
                <UsuariosPage />
              </RoleGuard>
            }
          />
          <Route
            path="roles"
            element={
              <RoleGuard requiredRoles={['ADMINISTRADOR']}>
                <RolesPage />
              </RoleGuard>
            }
          />
          <Route
            path="auditoria"
            element={
              <RoleGuard requiredRoles={['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'DIRECCION_ADMINISTRATIVA']}>
                <AuditoriaPage />
              </RoleGuard>
            }
          />
          <Route
            path="personas"
            element={
              <RoleGuard requiredRoles={['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA']}>
                <PersonasPage />
              </RoleGuard>
            }
          />
          <Route
            path="estudiantes"
            element={
              <RoleGuard requiredRoles={['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'DOCENTE', 'SECRETARIA']}>
                <EstudiantesPage />
              </RoleGuard>
            }
          />
          <Route
            path="apoderados"
            element={
              <RoleGuard requiredRoles={['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA']}>
                <ApoderadosPage />
              </RoleGuard>
            }
          />
          <Route
            path="personal"
            element={
              <RoleGuard requiredRoles={['ADMINISTRADOR', 'DIRECCION_ADMINISTRATIVA']}>
                <PersonalPage />
              </RoleGuard>
            }
          />
          <Route path="ciclos" element={<RoleGuard requiredRoles={['ADMINISTRADOR', 'DIRECCION_ACADEMICA']}><CiclosPage /></RoleGuard>} />
          <Route path="turnos" element={<RoleGuard requiredRoles={['ADMINISTRADOR', 'DIRECCION_ACADEMICA']}><TurnosPage /></RoleGuard>} />
          <Route path="materias" element={<RoleGuard requiredRoles={['ADMINISTRADOR', 'DIRECCION_ACADEMICA']}><MateriasPage /></RoleGuard>} />
          <Route path="secciones" element={<RoleGuard requiredRoles={['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA']}><SeccionesPage /></RoleGuard>} />
          <Route path="matriculas" element={<RoleGuard requiredRoles={['ADMINISTRADOR', 'DIRECCION_ACADEMICA', 'SECRETARIA']}><MatriculasPage /></RoleGuard>} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
