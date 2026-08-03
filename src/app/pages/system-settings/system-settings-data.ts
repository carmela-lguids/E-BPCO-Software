export type SettingsTab = 'general' | 'fees' | 'notifications' | 'modules';

export interface FeeLineItem {
  name: string;
  amount: string;
}

export interface ModuleToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const TENANT_FEE_SUMMARY: FeeLineItem[] = [
  { name: 'Building Permit — Residential', amount: '₱1,500.00' },
  { name: 'Building Permit — Commercial', amount: '₱3,200.00' },
  { name: 'Certificate of Occupancy', amount: '₱850.00' },
  { name: 'Renovation Permit', amount: '₱950.00' },
];

export function defaultTenantModules(): ModuleToggle[] {
  return [
    { key: 'applications', label: 'Applications', description: 'Application intake and tracking', enabled: true },
    { key: 'evaluations', label: 'Evaluations', description: 'Initial, Zoning, Fire Safety, OBO review', enabled: true },
    { key: 'inspections', label: 'Inspections', description: 'Building inspection scheduling and checklists', enabled: true },
    { key: 'payments', label: 'Payments', description: 'Fee collection and verification', enabled: true },
    { key: 'permit-release', label: 'Permit Release', description: 'Permit generation and release', enabled: true },
    { key: 'records', label: 'Records', description: 'Archive and records management', enabled: true },
    { key: 'reports', label: 'Reports', description: 'Analytics and exportable reports', enabled: true },
    { key: 'workflow', label: 'Workflow Monitor', description: 'Live stage load and bottleneck tracking', enabled: false },
  ];
}
