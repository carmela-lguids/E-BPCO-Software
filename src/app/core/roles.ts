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

export function roleKeyFromLabel(label: string): RoleKey | undefined {
  return ROLE_ORDER.find((key) => ROLES[key].label === label);
}

export const EVALUATOR_ROLES: RoleKey[] = ['obo', 'initial-eval', 'zoning', 'fire-safety'];

// Badge category — a coarser grouping than RoleKey, used only to color the
// role badge shown beside a user's name (header, sidebar, profile). Six
// groups, reusing the exact hex values already assigned to each role's
// iconBg in the User & Roles page rather than inventing a new palette.
export type BadgeCategory = 'national' | 'tenant' | 'evaluator' | 'finance' | 'inspection' | 'records';

export const BADGE_CATEGORY: Record<RoleKey, BadgeCategory> = {
  'super-admin': 'national',
  'platform-admin': 'national',
  'ops-manager': 'national',
  auditor: 'national',
  'support-admin': 'national',
  'security-admin': 'national',
  'tenant-admin': 'tenant',
  obo: 'evaluator',
  'initial-eval': 'evaluator',
  zoning: 'evaluator',
  'fire-safety': 'evaluator',
  inspector: 'inspection',
  cashier: 'finance',
  releasing: 'records',
  records: 'records',
};

// One access-scope label per role, shown on My Access, the profile header,
// and the dashboard identity block. See the Account Identity memo §06.
export type AccessScope =
  | 'National Access'
  | 'Tenant-Wide Access'
  | 'Department Access'
  | 'Assigned Records Only'
  | 'Read-Only Access'
  | 'Support Access'
  | 'Audit Access';

export const ACCESS_SCOPE: Record<RoleKey, AccessScope> = {
  'super-admin': 'National Access',
  'platform-admin': 'National Access',
  'ops-manager': 'Read-Only Access',
  auditor: 'Audit Access',
  'support-admin': 'Support Access',
  'security-admin': 'National Access',
  'tenant-admin': 'Tenant-Wide Access',
  obo: 'Assigned Records Only',
  'initial-eval': 'Assigned Records Only',
  zoning: 'Assigned Records Only',
  'fire-safety': 'Assigned Records Only',
  inspector: 'Assigned Records Only',
  cashier: 'Department Access',
  releasing: 'Department Access',
  records: 'Read-Only Access',
};
