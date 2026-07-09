import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'system-logs',
        loadComponent: () =>
          import('./pages/system-logs/system-logs').then((m) => m.SystemLogs),
      },
      {
        path: 'user-roles',
        loadComponent: () => import('./pages/user-roles/user-roles').then((m) => m.UserRoles),
      },
      {
        path: 'tenants',
        loadComponent: () => import('./pages/tenants/tenants').then((m) => m.Tenants),
      },
      {
        path: 'workflow',
        loadComponent: () => import('./pages/workflow/workflow').then((m) => m.Workflow),
      },
    ],
  },
  {
    path: 'tenant',
    loadComponent: () =>
      import('./layout/tenant-layout/tenant-layout').then((m) => m.TenantLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/tenant-dashboard/tenant-dashboard').then((m) => m.TenantDashboard),
      },
      {
        path: 'applications',
        loadComponent: () =>
          import('./pages/tenant-applications/tenant-applications').then(
            (m) => m.TenantApplications,
          ),
      },
      {
        path: 'evaluations',
        loadComponent: () =>
          import('./pages/tenant-evaluations/tenant-evaluations').then(
            (m) => m.TenantEvaluations,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./pages/tenant-payments/tenant-payments').then((m) => m.TenantPayments),
      },
      {
        path: 'permit-release',
        loadComponent: () =>
          import('./pages/tenant-permit-release/tenant-permit-release').then(
            (m) => m.TenantPermitRelease,
          ),
      },
      {
        path: 'workflow',
        loadComponent: () =>
          import('./pages/tenant-workflow/tenant-workflow').then((m) => m.TenantWorkflow),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
