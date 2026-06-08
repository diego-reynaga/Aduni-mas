import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';
import { AcademicShell } from './layout/academic-shell/academic-shell';
import { AdminAcademic } from './views/admin-academic/admin-academic';
import { AdminDashboard } from './views/admin-dashboard/admin-dashboard';
import { AdminInstitution } from './views/admin-institution/admin-institution';
import { AdminSupervision } from './views/admin-supervision/admin-supervision';
import { AdminUsers } from './views/admin-users/admin-users';
import { FamilyPortal } from './views/family-portal/family-portal';
import { Login } from './views/login/login';
import { StudentPortal } from './views/student-portal/student-portal';
import { TeacherDashboard } from './views/teacher-dashboard/teacher-dashboard';
import { TeacherGrades } from './views/teacher-grades/teacher-grades';
import { TeacherImport } from './views/teacher-import/teacher-import';


export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: '',
    component: AcademicShell,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        component: AdminDashboard,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/usuarios',
        component: AdminUsers,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/academico',
        component: AdminAcademic,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/supervision',
        component: AdminSupervision,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/configuracion',
        component: AdminInstitution,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'docente',
        component: TeacherDashboard,
        canActivate: [roleGuard(['DOCENTE'])],
      },
      {
        path: 'docente/notas',
        component: TeacherGrades,
        canActivate: [roleGuard(['DOCENTE'])],
      },
      {
        path: 'docente/importar',
        component: TeacherImport,
        canActivate: [roleGuard(['DOCENTE'])],
      },
      {
        path: 'estudiante',
        component: StudentPortal,
        canActivate: [roleGuard(['ESTUDIANTE'])],
      },
      {
        path: 'familia',
        component: FamilyPortal,
        canActivate: [roleGuard(['PADRE_FAMILIA'])],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
