import { RoleKey } from './roles';

// Plain-language allowed/restricted action summaries per role, mirroring the
// RBAC design memo's button-level matrix. Kept as a small curated data
// source rather than introspecting every RoleGate in the app — the module
// lists on My Access (§06) ARE fully derived from NAV_BY_ROLE (the real
// source of truth for navigation); this file only covers the action-level
// sentences, which don't have a single generic registry to read from yet.
export interface RoleCapabilities {
  allowed: string[];
  restricted: string[];
}

export const CAPABILITIES: Record<RoleKey, RoleCapabilities> = {
  'super-admin': {
    allowed: [
      'Add, edit, and deactivate tenants',
      'Manage users and roles platform-wide',
      'View and export system logs',
      'Configure workflow templates',
    ],
    restricted: ['Process individual permit evaluations', 'Verify payments', 'Release permits'],
  },
  'platform-admin': {
    allowed: ['Provision new tenant workspaces', 'Enable or disable platform modules', 'View maintenance logs'],
    restricted: ['Manage users or roles', 'View or process applications', 'Verify payments', 'Release permits'],
  },
  'ops-manager': {
    allowed: ['View national dashboards', 'Compare tenant performance', 'Export analytics reports'],
    restricted: ['Create or edit tenants', 'Manage users', 'Configure workflow', 'Process applications'],
  },
  auditor: {
    allowed: ['View activity, access, error, and security logs', 'Export audit data', 'View compliance reports'],
    restricted: ['Edit or delete any record', 'Resolve errors', 'Change user permissions'],
  },
  'support-admin': {
    allowed: ['Look up tenants and users', 'Start and end tenant impersonation', 'Log support issues'],
    restricted: ['Approve or reject applications', 'Verify payments', 'Release permits', 'Permanently edit evaluation results'],
  },
  'security-admin': {
    allowed: ['View and manage user permissions', 'Monitor sessions and login attempts', 'Review security alerts'],
    restricted: ['Process applications', 'Verify payments', 'Manage tenants'],
  },
  'tenant-admin': {
    allowed: [
      'Add and manage LGU staff accounts',
      'Assign roles within this tenant',
      'View all applications, payments, and permits',
      'Configure local workflow and settings',
    ],
    restricted: ['Create new tenants', 'View other LGUs’ data', 'Access national analytics'],
  },
  obo: {
    allowed: [
      'Review assigned applications',
      'Edit the OBO checklist and findings',
      'Approve final evaluation',
      'Return an application for revision',
      'Reject at the OBO stage',
    ],
    restricted: ['Verify payments', 'Release permits', 'Manage users', 'Edit zoning or fire decisions'],
  },
  'initial-eval': {
    allowed: [
      'Review assigned applications',
      'Mark documents complete, missing, or returned',
      'Add initial findings and comments',
      'Forward a complete application to Zoning',
    ],
    restricted: ['Approve the final permit', 'Verify payments', 'Release permits', 'Manage users'],
  },
  zoning: {
    allowed: [
      'Review assigned applications',
      'Edit the zoning checklist and land-use findings',
      'Approve the zoning stage',
      'Return for revision or reject at this stage',
      'Forward to Fire Safety',
    ],
    restricted: ['Approve the final permit', 'Verify payments', 'Release permits', 'Manage users'],
  },
  'fire-safety': {
    allowed: [
      'Review assigned applications',
      'Edit the fire safety checklist and findings',
      'Verify fire clearance documents',
      'Approve, return, or reject the fire stage',
      'Forward to the Office of the Building Official',
    ],
    restricted: ['Approve the final permit', 'Verify payments', 'Release permits', 'Manage users'],
  },
  inspector: {
    allowed: [
      'View assigned inspections',
      'Complete inspection checklists',
      'Upload mock inspection photos',
      'Submit a pass or correction recommendation',
    ],
    restricted: ['Approve the final permit', 'Verify payments', 'Release permits', 'Manage users'],
  },
  cashier: {
    allowed: ['View pending payments', 'Verify payments and record receipt numbers', 'Export payment reports'],
    restricted: ['Edit applicant documents', 'Change evaluation decisions', 'Release permits', 'Manage users'],
  },
  releasing: {
    allowed: ['View the ready-to-release queue', 'Generate and preview permits', 'Mark permits as released'],
    restricted: ['Edit evaluation decisions', 'Modify payment status', 'Manage users'],
  },
  records: {
    allowed: ['Search and view permit, application, and document records', 'Archive or restore a record', 'Export a record summary'],
    restricted: ['Change evaluation decisions', 'Verify payments', 'Release permits', 'Manage tenants'],
  },
};
