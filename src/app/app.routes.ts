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
    path: 'access-denied',
    loadComponent: () =>
      import('./pages/access-denied/access-denied').then((m) => m.AccessDenied),
  },
  {
    path: 'confirm-account',
    loadComponent: () =>
      import('./pages/confirm-account/confirm-account').then((m) => m.ConfirmAccount),
  },
  {
    path: 'session-expired',
    loadComponent: () =>
      import('./pages/session-expired/session-expired').then((m) => m.SessionExpired),
  },
  {
    path: 'account-status/suspended',
    loadComponent: () =>
      import('./pages/account-status/account-status').then((m) => m.AccountStatus),
    data: { variant: 'suspended' },
  },
  {
    path: 'account-status/inactive',
    loadComponent: () =>
      import('./pages/account-status/account-status').then((m) => m.AccountStatus),
    data: { variant: 'inactive' },
  },
  {
    path: 'account-status/tenant-inactive',
    loadComponent: () =>
      import('./pages/account-status/account-status').then((m) => m.AccountStatus),
    data: { variant: 'tenant-inactive' },
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
        loadComponent: () =>
          import('./shared/workflow-monitor/workflow-monitor').then((m) => m.WorkflowMonitor),
        data: { homeRoute: '/dashboard' },
      },
      {
        path: 'platform/overview',
        loadComponent: () =>
          import('./pages/platform-overview/platform-overview').then((m) => m.PlatformOverview),
      },
      {
        path: 'support/dashboard',
        loadComponent: () =>
          import('./pages/support-dashboard/support-dashboard').then((m) => m.SupportDashboard),
      },
      {
        path: 'security/dashboard',
        loadComponent: () =>
          import('./pages/security-dashboard/security-dashboard').then((m) => m.SecurityDashboard),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'my-access',
        loadComponent: () => import('./pages/my-access/my-access').then((m) => m.MyAccess),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications').then((m) => m.NotificationsPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/system-settings/system-settings').then((m) => m.SystemSettings),
      },
      {
        path: 'help',
        loadComponent: () => import('./pages/help-support/help-support').then((m) => m.HelpSupport),
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
          import('./shared/workflow-monitor/workflow-monitor').then((m) => m.WorkflowMonitor),
        data: { homeRoute: '/tenant/dashboard' },
      },
      {
        path: 'inspections',
        loadComponent: () =>
          import('./pages/tenant-inspections/tenant-inspections').then((m) => m.TenantInspections),
      },
      {
        path: 'records',
        loadComponent: () =>
          import('./pages/tenant-records/tenant-records').then((m) => m.TenantRecords),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/tenant-users/tenant-users').then((m) => m.TenantUsers),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'my-access',
        loadComponent: () => import('./pages/my-access/my-access').then((m) => m.MyAccess),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications').then((m) => m.NotificationsPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/system-settings/system-settings').then((m) => m.SystemSettings),
      },
      {
        path: 'help',
        loadComponent: () => import('./pages/help-support/help-support').then((m) => m.HelpSupport),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
