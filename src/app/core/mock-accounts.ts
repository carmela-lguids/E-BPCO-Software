import { RoleKey, ROLES } from './roles';

export interface MockAccount {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: RoleKey;
  roleLabel: string;
  accountType: 'Super Admin' | 'Tenant Admin';
  /** null for Group A (national) accounts; an LGU name for Group B accounts. */
  tenant: string | null;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin: string;
  department: string;
  permissions: string[];
}

function emailFor(username: string): string {
  return `${username}@ebpco.gov.ph`;
}

function account(partial: Omit<MockAccount, 'roleLabel' | 'accountType' | 'email'>): MockAccount {
  const def = ROLES[partial.role];
  return {
    ...partial,
    roleLabel: def.label,
    accountType: def.group === 'super-admin' ? 'Super Admin' : 'Tenant Admin',
    email: emailFor(partial.username),
  };
}

// The 16 mock accounts named in the RBAC design memo. #7 (Tenant Administrator)
// and #8 (LGU Administrator) intentionally share the same `role: 'tenant-admin'`
// per the memo's Option A merge recommendation — both log in, both see the
// identical tenant workspace, demonstrating the merge rather than shipping
// two near-duplicate screens.
export const MOCK_ACCOUNTS: MockAccount[] = [
  account({
    id: 'mock-acct-01', fullName: 'Ma. Corazon Lim', username: 'corazon.lim', role: 'super-admin',
    tenant: null, status: 'Active', lastLogin: 'Online now', department: 'Office of the Secretary',
    permissions: ['All Modules', 'User Management', 'System Settings', 'Tenant Management'],
  }),
  account({
    id: 'mock-acct-02', fullName: 'Victor Bautista', username: 'victor.bautista', role: 'platform-admin',
    tenant: null, status: 'Active', lastLogin: '2h ago', department: 'Platform Engineering',
    permissions: ['Module Catalog', 'Tenant Provisioning', 'System Maintenance'],
  }),
  account({
    id: 'mock-acct-03', fullName: 'Rosa Mendoza', username: 'rosa.mendoza', role: 'ops-manager',
    tenant: null, status: 'Active', lastLogin: '5h ago', department: 'Operations Monitoring',
    permissions: ['National Analytics', 'LGU Performance', 'Compliance Reports'],
  }),
  account({
    id: 'mock-acct-04', fullName: 'Ramon Torres', username: 'ramon.torres', role: 'auditor',
    tenant: null, status: 'Active', lastLogin: '1 day ago', department: 'Internal Audit',
    permissions: ['View Logs', 'View Reports', 'Export Audit Data'],
  }),
  account({
    id: 'mock-acct-05', fullName: 'Grace Tan', username: 'grace.tan', role: 'support-admin',
    tenant: null, status: 'Active', lastLogin: '30m ago', department: 'Technical Support',
    permissions: ['Tenant Lookup', 'Impersonation', 'Issue Tracking'],
  }),
  account({
    id: 'mock-acct-06', fullName: 'Paolo Ramos', username: 'paolo.ramos', role: 'security-admin',
    tenant: null, status: 'Active', lastLogin: '3h ago', department: 'Information Security',
    permissions: ['User Security', 'Session Monitoring', 'Password Policy'],
  }),

  account({
    id: 'mock-acct-07', fullName: 'Liza Dela Cruz', username: 'liza.delacruz', role: 'tenant-admin',
    tenant: 'Esperanza', status: 'Active', lastLogin: 'Online now', department: 'Office of the Municipal Administrator',
    permissions: ['Tenant Settings', 'User Management', 'Reports', 'Workflow Configuration'],
  }),
  account({
    id: 'mock-acct-08', fullName: 'Daniel Cruz', username: 'daniel.cruz', role: 'tenant-admin',
    tenant: 'Esperanza', status: 'Active', lastLogin: '1h ago', department: 'Office of the Municipal Administrator',
    permissions: ['Tenant Settings', 'User Management', 'Reports', 'Workflow Configuration'],
  }),
  account({
    id: 'mock-acct-09', fullName: 'Engr. Maria Santos', username: 'maria.santos', role: 'obo',
    tenant: 'Esperanza', status: 'Active', lastLogin: '15m ago', department: 'Office of the Building Official',
    permissions: ['View Applications', 'OBO Evaluation', 'Final Approval'],
  }),
  account({
    id: 'mock-acct-10', fullName: 'Jonny Doe', username: 'jonny.doe', role: 'initial-eval',
    tenant: 'Esperanza', status: 'Active', lastLogin: '3h ago', department: 'Office of the Building Official',
    permissions: ['View Applications', 'Initial Evaluation'],
  }),
  account({
    id: 'mock-acct-11', fullName: 'Denese Martin', username: 'denese.martin', role: 'zoning',
    tenant: 'Esperanza', status: 'Active', lastLogin: '4h ago', department: 'Zoning Administration',
    permissions: ['View Applications', 'Zoning Evaluation'],
  }),
  account({
    id: 'mock-acct-12', fullName: 'Raul Villa', username: 'raul.villa', role: 'fire-safety',
    tenant: 'Esperanza', status: 'Active', lastLogin: '5h ago', department: 'Bureau of Fire Protection Liaison',
    permissions: ['View Applications', 'Fire Safety Evaluation'],
  }),
  account({
    id: 'mock-acct-13', fullName: 'Fea Sims', username: 'fea.sims', role: 'inspector',
    tenant: 'Esperanza', status: 'Active', lastLogin: 'Online now', department: 'Office of the Building Official',
    permissions: ['View Applications', 'Field Inspection', 'Inspection Reports'],
  }),
  account({
    id: 'mock-acct-14', fullName: 'David Roderick', username: 'david.roderick', role: 'cashier',
    tenant: 'Esperanza', status: 'Active', lastLogin: '13 days ago', department: 'Treasury / Cashiering',
    permissions: ['View Applications', 'Payment Processing'],
  }),
  account({
    id: 'mock-acct-15', fullName: 'James Zavel', username: 'james.zavel', role: 'releasing',
    tenant: 'Esperanza', status: 'Active', lastLogin: '8h ago', department: 'Releasing Unit',
    permissions: ['View Applications', 'Document Release'],
  }),
  account({
    id: 'mock-acct-16', fullName: 'Jack Nunnally', username: 'jack.nunnally', role: 'records',
    tenant: 'Esperanza', status: 'Active', lastLogin: '2h ago', department: 'Records Management',
    permissions: ['View Applications', 'View Reports', 'Records Archive'],
  }),

  // Extra tenant-isolation demo accounts (not part of the numbered 16, added
  // to make the "same role, different LGU sees different data" point in the
  // memo's §11 concrete rather than theoretical).
  account({
    id: 'mock-acct-17', fullName: 'Ana Garcia', username: 'ana.garcia', role: 'zoning',
    tenant: 'Manila', status: 'Active', lastLogin: '1h ago', department: 'Zoning Administration',
    permissions: ['View Applications', 'Zoning Evaluation'],
  }),
  account({
    id: 'mock-acct-18', fullName: 'Mark Lopez', username: 'mark.lopez', role: 'cashier',
    tenant: 'Cebu', status: 'Active', lastLogin: '20m ago', department: 'Treasury / Cashiering',
    permissions: ['View Applications', 'Payment Processing'],
  }),
];

export const DEFAULT_ACCOUNT: MockAccount = MOCK_ACCOUNTS[0];

export function findAccount(id: string): MockAccount | undefined {
  return MOCK_ACCOUNTS.find((a) => a.id === id);
}
