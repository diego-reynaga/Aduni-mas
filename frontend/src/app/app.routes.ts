import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';
import { AcademicShell } from './layout/academic-shell/academic-shell';
import { AdminAcademic } from './views/admin-academic/admin-academic';
import { AdminDashboard } from './views/admin-dashboard/admin-dashboard';
import { AdminImportacionesNotas } from './views/admin-importaciones-notas/admin-importaciones-notas';
import { AdminInstitution } from './views/admin-institution/admin-institution';
import { AdminSupervision } from './views/admin-supervision/admin-supervision';
import { AdminUsers } from './views/admin-users/admin-users';
import { AdminPersonal } from './views/admin-personal/admin-personal';
import { FamilyPortal } from './views/family-portal/family-portal';
import { Login } from './views/login/login';
import { StudentPortal } from './views/student-portal/student-portal';
import { TeacherDashboard } from './views/teacher-dashboard/teacher-dashboard';
import { TeacherGrades } from './views/teacher-grades/teacher-grades';
import { TeacherImport } from './views/teacher-import/teacher-import';
import { AdminStudents } from './views/admin-students/admin-students';
import { AdminAssignments } from './views/admin-assignments/admin-assignments';
import { AdminPeriods } from './views/admin-periods/admin-periods';
import { AdminFamilyLinks } from './views/admin-family-links/admin-family-links';


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
        data: { tab: 'usuarios' },
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/roles',
        component: AdminUsers,
        data: { tab: 'roles' },
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/auditorias',
        component: AdminUsers,
        data: { tab: 'auditoria' },
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/personal',
        component: AdminPersonal,
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
        path: 'admin/importaciones-notas',
        component: AdminImportacionesNotas,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/configuracion',
        component: AdminInstitution,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/alumnos',
        component: AdminStudents,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/periodos',
        component: AdminPeriods,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/asignaciones',
        component: AdminAssignments,
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/horarios',
        loadComponent: () => import('./views/admin-schedules/admin-schedules').then(m => m.AdminSchedules),
        canActivate: [roleGuard(['ADMINISTRADOR'])],
      },
      {
        path: 'admin/familias',
        component: AdminFamilyLinks,
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
        path: 'docente/importar-notas',
        component: TeacherImport,
        canActivate: [roleGuard(['DOCENTE'])],
      },
      {
        path: 'docente/importar',
        redirectTo: 'docente/importar-notas',
      },
      {
        path: 'estudiante',
        component: StudentPortal,
        canActivate: [roleGuard(['ESTUDIANTE'])],
      },
      {
        path: 'estudiante/notas-competencia',
        loadComponent: () => import('./views/student-competency-grades/student-competency-grades').then(m => m.StudentCompetencyGrades),
        canActivate: [roleGuard(['ESTUDIANTE'])],
      },
      {
        path: 'estudiante/perfil',
        loadComponent: () => import('./views/student-profile/student-profile').then(m => m.StudentProfile),
        canActivate: [roleGuard(['ESTUDIANTE'])],
      },
      {
        path: 'estudiante/apoderados',
        loadComponent: () => import('./views/student-guardians/student-guardians').then(m => m.StudentGuardians),
        canActivate: [roleGuard(['ESTUDIANTE'])],
      },
      {
        path: 'estudiante/matriculas',
        loadComponent: () => import('./views/student-enrollments/student-enrollments').then(m => m.StudentEnrollments),
        canActivate: [roleGuard(['ESTUDIANTE'])],
      },
      {
        path: 'estudiante/horario',
        loadComponent: () => import('./views/student-schedule/student-schedule').then(m => m.StudentSchedule),
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
