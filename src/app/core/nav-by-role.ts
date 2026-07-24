import { NavItem } from '../shared/sidebar/sidebar';
import { RoleKey } from './roles';

// Sidebar contents per role. Inaccessible modules are simply absent from
// the array — the sidebar renders whatever it's given, so "hidden" happens
// here, not via a disabled/greyed row.
export const NAV_BY_ROLE: Record<RoleKey, NavItem[]> = {
  'super-admin': [
    { label: 'Dashboard', icon: 'home', path: '/dashboard' },
    { label: 'User & Roles', icon: 'user-check', path: '/user-roles' },
    { label: 'System Logs', icon: 'logs', path: '/system-logs' },
    { label: 'Tenants', icon: 'building', path: '/tenants' },
    { label: 'Workflow', icon: 'workflow', path: '/workflow' },
  ],
  'platform-admin': [
    { label: 'Platform Overview', icon: 'cloud', path: '/platform/overview' },
    { label: 'Tenant Provisioning', icon: 'building', path: '/tenants' },
    { label: 'System Logs', icon: 'logs', path: '/system-logs' },
  ],
  'ops-manager': [
    { label: 'National Dashboard', icon: 'home', path: '/dashboard' },
    { label: 'Tenants', icon: 'building', path: '/tenants' },
  ],
  auditor: [
    { label: 'System Logs', icon: 'logs', path: '/system-logs' },
    { label: 'Tenants', icon: 'building', path: '/tenants' },
    { label: 'User & Roles', icon: 'user-check', path: '/user-roles' },
  ],
  'support-admin': [
    { label: 'Support Dashboard', icon: 'info', path: '/support/dashboard' },
    { label: 'Tenant Directory', icon: 'building', path: '/tenants' },
    { label: 'User Lookup', icon: 'user-check', path: '/user-roles' },
  ],
  'security-admin': [
    { label: 'Security Dashboard', icon: 'lock', path: '/security/dashboard' },
    { label: 'Roles & Permissions', icon: 'user-check', path: '/user-roles' },
  ],

  'tenant-admin': [
    { label: 'Dashboard', icon: 'home', path: '/tenant/dashboard' },
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
    { label: 'Evaluations', icon: 'calendar', path: '/tenant/evaluations' },
    { label: 'Payments', icon: 'wallet', path: '/tenant/payments' },
    { label: 'Permit Release', icon: 'file-check', path: '/tenant/permit-release' },
    { label: 'Inspections', icon: 'clipboard-check', path: '/tenant/inspections' },
    { label: 'Records', icon: 'archive', path: '/tenant/records' },
    { label: 'Workflow', icon: 'workflow', path: '/tenant/workflow' },
  ],
  obo: [
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
    { label: 'Evaluations', icon: 'calendar', path: '/tenant/evaluations' },
  ],
  'initial-eval': [
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
    { label: 'Evaluations', icon: 'calendar', path: '/tenant/evaluations' },
  ],
  zoning: [
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
    { label: 'Evaluations', icon: 'calendar', path: '/tenant/evaluations' },
  ],
  'fire-safety': [
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
    { label: 'Evaluations', icon: 'calendar', path: '/tenant/evaluations' },
  ],
  inspector: [{ label: 'Inspections', icon: 'clipboard-check', path: '/tenant/inspections' }],
  cashier: [{ label: 'Payments', icon: 'wallet', path: '/tenant/payments' }],
  releasing: [{ label: 'Permit Release', icon: 'file-check', path: '/tenant/permit-release' }],
  records: [
    { label: 'Records', icon: 'archive', path: '/tenant/records' },
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
  ],
};
