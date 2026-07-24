// Canonical frontend-only role model.
//
// This is a UI simulation, not a security boundary: every gate driven by
// this file is enforced by hiding markup, never by a route guard or a
// server check. See the RBAC design memo for the full matrix this file
// implements.

export type PortalGroup = 'super-admin' | 'tenant-admin';

export type RoleKey =
  | 'super-admin'
  | 'platform-admin'
  | 'ops-manager'
  | 'auditor'
  | 'support-admin'
  | 'security-admin'
  | 'tenant-admin'
  | 'obo'
  | 'initial-eval'
  | 'zoning'
  | 'fire-safety'
  | 'inspector'
  | 'cashier'
  | 'releasing'
  | 'records';

export interface RoleDefinition {
  key: RoleKey;
  label: string;
  group: PortalGroup;
  /** Where this role lands immediately after switching accounts / logging in. */
  landingPath: string;
}

// Order matters: this is the same order used by the User & Roles page's
// role cards and the mock-account switcher grouping.
export const ROLE_ORDER: RoleKey[] = [
  'super-admin',
  'platform-admin',
  'ops-manager',
  'auditor',
  'support-admin',
  'security-admin',
  'tenant-admin',
  'obo',
  'initial-eval',
  'zoning',
  'fire-safety',
  'inspector',
  'cashier',
  'releasing',
  'records',
];

export const ROLES: Record<RoleKey, RoleDefinition> = {
  'super-admin': { key: 'super-admin', label: 'Super Administrator', group: 'super-admin', landingPath: '/dashboard' },
  'platform-admin': { key: 'platform-admin', label: 'Platform Administrator', group: 'super-admin', landingPath: '/platform/overview' },
  'ops-manager': { key: 'ops-manager', label: 'National Operations Manager', group: 'super-admin', landingPath: '/dashboard' },
  auditor: { key: 'auditor', label: 'System Auditor', group: 'super-admin', landingPath: '/system-logs' },
  'support-admin': { key: 'support-admin', label: 'Technical Support Administrator', group: 'super-admin', landingPath: '/support/dashboard' },
  'security-admin': { key: 'security-admin', label: 'Security Administrator', group: 'super-admin', landingPath: '/security/dashboard' },

  'tenant-admin': { key: 'tenant-admin', label: 'Tenant Administrator', group: 'tenant-admin', landingPath: '/tenant/dashboard' },
  obo: { key: 'obo', label: 'Office of the Building Official', group: 'tenant-admin', landingPath: '/tenant/applications' },
  'initial-eval': { key: 'initial-eval', label: 'Initial Evaluation Officer', group: 'tenant-admin', landingPath: '/tenant/applications' },
  zoning: { key: 'zoning', label: 'Zoning Officer', group: 'tenant-admin', landingPath: '/tenant/applications' },
  'fire-safety': { key: 'fire-safety', label: 'Fire Safety Officer', group: 'tenant-admin', landingPath: '/tenant/applications' },
  inspector: { key: 'inspector', label: 'Building Inspector', group: 'tenant-admin', landingPath: '/tenant/inspections' },
  cashier: { key: 'cashier', label: 'Cashier / Payment Officer', group: 'tenant-admin', landingPath: '/tenant/payments' },
  releasing: { key: 'releasing', label: 'Permit Releasing Officer', group: 'tenant-admin', landingPath: '/tenant/permit-release' },
  records: { key: 'records', label: 'Records Officer', group: 'tenant-admin', landingPath: '/tenant/records' },
};

export function roleLabel(key: RoleKey): string {
  return ROLES[key].label;
}

export const EVALUATOR_ROLES: RoleKey[] = ['obo', 'initial-eval', 'zoning', 'fire-safety'];
