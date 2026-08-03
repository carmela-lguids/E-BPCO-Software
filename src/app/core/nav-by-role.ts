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
    { label: 'Reports', icon: 'trend-up', path: '/reports' },
    { label: 'Settings', icon: 'gear', path: '/settings' },
    { label: 'Help & Support', icon: 'info', path: '/help' },
  ],
  'platform-admin': [
    { label: 'Platform Overview', icon: 'cloud', path: '/platform/overview' },
    { label: 'Tenant Provisioning', icon: 'building', path: '/tenants' },
    { label: 'System Logs', icon: 'logs', path: '/system-logs' },
    { label: 'Reports', icon: 'trend-up', path: '/reports' },
    { label: 'Settings', icon: 'gear', path: '/settings' },
    { label: 'Help & Support', icon: 'info', path: '/help' },
  ],
  'ops-manager': [
    { label: 'National Dashboard', icon: 'home', path: '/dashboard' },
    { label: 'Tenants', icon: 'building', path: '/tenants' },
    { label: 'Reports', icon: 'trend-up', path: '/reports' },
    { label: 'Help & Support', icon: 'info', path: '/help' },
  ],
  auditor: [
    { label: 'Audit Logs', icon: 'logs', path: '/system-logs' },
    { label: 'Tenants', icon: 'building', path: '/tenants' },
    { label: 'User & Roles', icon: 'user-check', path: '/user-roles' },
    { label: 'Reports', icon: 'trend-up', path: '/reports' },
    { label: 'Help & Support', icon: 'info', path: '/help' },
  ],
  'support-admin': [
    { label: 'Support Dashboard', icon: 'info', path: '/support/dashboard' },
    { label: 'Tenant Directory', icon: 'building', path: '/tenants' },
    { label: 'User Lookup', icon: 'user-check', path: '/user-roles' },
    { label: 'Help & Support', icon: 'info', path: '/help' },
  ],
  'security-admin': [
    { label: 'Security Dashboard', icon: 'lock', path: '/security/dashboard' },
    { label: 'Roles & Permissions', icon: 'user-check', path: '/user-roles' },
    { label: 'Help & Support', icon: 'info', path: '/help' },
  ],

  'tenant-admin': [
    { label: 'Dashboard', icon: 'home', path: '/tenant/dashboard' },
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
    { label: 'Evaluations', icon: 'calendar', path: '/tenant/evaluations' },
    { label: 'Users', icon: 'user-check', path: '/tenant/users' },
    { label: 'Payments', icon: 'wallet', path: '/tenant/payments' },
    { label: 'Permit Release', icon: 'file-check', path: '/tenant/permit-release' },
    { label: 'Inspections', icon: 'clipboard-check', path: '/tenant/inspections' },
    { label: 'Records', icon: 'archive', path: '/tenant/records' },
    { label: 'Workflow', icon: 'workflow', path: '/tenant/workflow' },
    { label: 'Reports', icon: 'trend-up', path: '/tenant/reports' },
    { label: 'Settings', icon: 'gear', path: '/tenant/settings' },
    { label: 'Help & Support', icon: 'info', path: '/tenant/help' },
  ],
  obo: [
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
    { label: 'Evaluations', icon: 'calendar', path: '/tenant/evaluations' },
    { label: 'Help & Support', icon: 'info', path: '/tenant/help' },
  ],
  'initial-eval': [
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
    { label: 'Evaluations', icon: 'calendar', path: '/tenant/evaluations' },
    { label: 'Help & Support', icon: 'info', path: '/tenant/help' },
  ],
  zoning: [
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
    { label: 'Evaluations', icon: 'calendar', path: '/tenant/evaluations' },
    { label: 'Help & Support', icon: 'info', path: '/tenant/help' },
  ],
  'fire-safety': [
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
    { label: 'Evaluations', icon: 'calendar', path: '/tenant/evaluations' },
    { label: 'Help & Support', icon: 'info', path: '/tenant/help' },
  ],
  inspector: [
    { label: 'Inspections', icon: 'clipboard-check', path: '/tenant/inspections' },
    { label: 'Help & Support', icon: 'info', path: '/tenant/help' },
  ],
  cashier: [
    { label: 'Payments', icon: 'wallet', path: '/tenant/payments' },
    { label: 'Help & Support', icon: 'info', path: '/tenant/help' },
  ],
  releasing: [
    { label: 'Permit Release', icon: 'file-check', path: '/tenant/permit-release' },
    { label: 'Help & Support', icon: 'info', path: '/tenant/help' },
  ],
  records: [
    { label: 'Records', icon: 'archive', path: '/tenant/records' },
    { label: 'Applications', icon: 'user', path: '/tenant/applications' },
    { label: 'Help & Support', icon: 'info', path: '/tenant/help' },
  ],
};

// Every distinct module label that appears in any role's sidebar, across
// both portals — used by My Access (§06) to compute "Restricted modules" as
// the inverse of a role's own nav, without hand-maintaining a second list.
export const ALL_MODULE_LABELS: string[] = Array.from(
  new Set(Object.values(NAV_BY_ROLE).flatMap((items) => items.map((i) => i.label))),
).sort();

export function restrictedModulesFor(role: RoleKey): string[] {
  const allowed = new Set(NAV_BY_ROLE[role].map((i) => i.label));
  return ALL_MODULE_LABELS.filter((label) => !allowed.has(label));
}
