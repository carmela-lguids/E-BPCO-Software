import { AccessScope, ACCESS_SCOPE, RoleKey, ROLES } from './roles';

export interface RoleHistoryEntry {
  date: string;
  event: string;
  changedBy: string;
  changedByRole: string;
  reason?: string;
}

export type AccountStatus = 'Active' | 'Pending Confirmation' | 'Suspended' | 'Inactive' | 'Reported';

export interface MockAccount {
  id: string;
  fullName: string;
  email: string;
  username: string;
  employeeId: string;
  contactNumber: string;
  role: RoleKey;
  roleLabel: string;
  // Deliberately not "Super Admin"/"Tenant Admin" — those read as role names
  // and collide with the Tenant Administrator role. Matches the identity
  // memo's own examples exactly.
  accountType: 'Super Admin User' | 'Tenant User';
  /** null for Group A (national) accounts; an LGU name for Group B accounts. */
  tenant: string | null;
  department: string;
  region?: string;
  province?: string;
  city?: string;
  status: AccountStatus;
  accessScope: AccessScope;
  assignedBy: string;
  assignedByRole: string;
  assignedDate: string;
  createdBy: string;
  createdDate: string;
  lastRoleUpdate: string;
  accountConfirmed: boolean;
  lastLogin: string;
  permissions: string[];
  roleHistory: RoleHistoryEntry[];
}

// Tenant workspace status, independent of any one user's own account status
// — checked separately during the verification flow (Identity memo §02 step 5).
export const TENANT_STATUS: Record<string, 'Active' | 'Inactive'> = {
  Esperanza: 'Active',
  Manila: 'Active',
  Cebu: 'Inactive',
};

function emailFor(username: string): string {
  return `${username}@ebpco.gov.ph`;
}

type AccountInput = Omit<
  MockAccount,
  | 'roleLabel'
  | 'accountType'
  | 'email'
  | 'accessScope'
  | 'roleHistory'
  | 'createdBy'
  | 'createdDate'
  | 'lastRoleUpdate'
  | 'accountConfirmed'
> & {
  roleHistory?: RoleHistoryEntry[];
  createdBy?: string;
  createdDate?: string;
  lastRoleUpdate?: string;
  /** Defaults to true — pass false only for the Pending Confirmation demo account. */
  accountConfirmed?: boolean;
};

function account(partial: AccountInput): MockAccount {
  const def = ROLES[partial.role];
  const createdDate = partial.createdDate ?? partial.assignedDate;
  const createdBy = partial.createdBy ?? partial.assignedBy;
  return {
    ...partial,
    roleLabel: def.label,
    accountType: def.group === 'super-admin' ? 'Super Admin User' : 'Tenant User',
    email: emailFor(partial.username),
    accessScope: ACCESS_SCOPE[partial.role],
    accountConfirmed: partial.accountConfirmed ?? true,
    createdBy,
    createdDate,
    lastRoleUpdate: partial.lastRoleUpdate ?? partial.assignedDate,
    roleHistory:
      partial.roleHistory ??
      [
        {
          date: createdDate,
          event: `Account created as ${def.label}`,
          changedBy: createdBy,
          changedByRole: partial.assignedByRole,
        },
      ],
  };
}

// The 16 mock accounts named in the RBAC design memo. #7 (Tenant Administrator)
// and #8 (LGU Administrator) intentionally share the same `role: 'tenant-admin'`
// per the memo's Option A merge recommendation — both log in, both see the
// identical tenant workspace, demonstrating the merge rather than shipping
// two near-duplicate screens.
export const MOCK_ACCOUNTS: MockAccount[] = [
  account({
    id: 'mock-acct-01', fullName: 'Ma. Corazon Lim', username: 'corazon.lim', employeeId: 'DILG-SUP-0001',
    contactNumber: '+63 917 200 1001', role: 'super-admin',
    tenant: null, status: 'Active', lastLogin: 'Online now', department: 'Office of the Secretary',
    permissions: ['All Modules', 'User Management', 'System Settings', 'Tenant Management'],
    assignedBy: 'DILG Central Office', assignedByRole: 'Founding Authority', assignedDate: '2025-01-06',
  }),
  account({
    id: 'mock-acct-02', fullName: 'Victor Bautista', username: 'victor.bautista', employeeId: 'DILG-PLA-0002',
    contactNumber: '+63 917 200 1002', role: 'platform-admin',
    tenant: null, status: 'Active', lastLogin: '2h ago', department: 'Platform Engineering',
    permissions: ['Module Catalog', 'Tenant Provisioning', 'System Maintenance'],
    assignedBy: 'Ma. Corazon Lim', assignedByRole: 'Super Administrator', assignedDate: '2025-02-10',
  }),
  account({
    id: 'mock-acct-03', fullName: 'Rosa Mendoza', username: 'rosa.mendoza', employeeId: 'DILG-OPS-0003',
    contactNumber: '+63 917 200 1003', role: 'ops-manager',
    tenant: null, status: 'Active', lastLogin: '5h ago', department: 'Operations Monitoring',
    permissions: ['National Analytics', 'LGU Performance', 'Compliance Reports'],
    assignedBy: 'Ma. Corazon Lim', assignedByRole: 'Super Administrator', assignedDate: '2025-02-14',
  }),
  account({
    id: 'mock-acct-04', fullName: 'Ramon Torres', username: 'ramon.torres', employeeId: 'DILG-AUD-0004',
    contactNumber: '+63 917 200 1004', role: 'auditor',
    tenant: null, status: 'Active', lastLogin: '1 day ago', department: 'National Audit and Compliance',
    permissions: ['View Logs', 'View Reports', 'Export Audit Data'],
    assignedBy: 'Ma. Corazon Lim', assignedByRole: 'Super Administrator', assignedDate: '2025-03-01',
  }),
  account({
    id: 'mock-acct-05', fullName: 'Grace Tan', username: 'grace.tan', employeeId: 'DILG-SUP-0005',
    contactNumber: '+63 917 200 1005', role: 'support-admin',
    tenant: null, status: 'Active', lastLogin: '30m ago', department: 'Technical Support',
    permissions: ['Tenant Lookup', 'Impersonation', 'Issue Tracking'],
    assignedBy: 'Ma. Corazon Lim', assignedByRole: 'Super Administrator', assignedDate: '2025-03-18',
  }),
  account({
    id: 'mock-acct-06', fullName: 'Paolo Ramos', username: 'paolo.ramos', employeeId: 'DILG-SEC-0006',
    contactNumber: '+63 917 200 1006', role: 'security-admin',
    tenant: null, status: 'Active', lastLogin: '3h ago', department: 'Information Security',
    permissions: ['User Security', 'Session Monitoring', 'Password Policy'],
    assignedBy: 'Ma. Corazon Lim', assignedByRole: 'Super Administrator', assignedDate: '2025-04-02',
  }),

  account({
    id: 'mock-acct-07', fullName: 'Liza Dela Cruz', username: 'liza.delacruz', employeeId: 'ESP-ADM-0001',
    contactNumber: '+63 917 300 2001', role: 'tenant-admin',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Active', lastLogin: 'Online now', department: 'Office of the Municipal Administrator',
    permissions: ['Tenant Settings', 'User Management', 'Reports', 'Workflow Configuration'],
    assignedBy: 'Ma. Corazon Lim', assignedByRole: 'Super Administrator', assignedDate: '2026-05-04',
  }),
  account({
    id: 'mock-acct-08', fullName: 'Daniel Cruz', username: 'daniel.cruz', employeeId: 'ESP-ADM-0002',
    contactNumber: '+63 917 300 2002', role: 'tenant-admin',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Active', lastLogin: '1h ago', department: 'Office of the Municipal Administrator',
    permissions: ['Tenant Settings', 'User Management', 'Reports', 'Workflow Configuration'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-05-20',
  }),
  account({
    id: 'mock-acct-09', fullName: 'Engr. Maria Santos', username: 'maria.santos', employeeId: 'ESP-OBO-0003',
    contactNumber: '+63 917 300 2003', role: 'obo',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Active', lastLogin: '15m ago', department: 'Office of the Building Official',
    permissions: ['View Applications', 'OBO Evaluation', 'Final Approval'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-05-22',
  }),
  account({
    id: 'mock-acct-10', fullName: 'Jonny Doe', username: 'jonny.doe', employeeId: 'ESP-INI-0004',
    contactNumber: '+63 917 300 2004', role: 'initial-eval',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Active', lastLogin: '3h ago', department: 'Office of the Building Official',
    permissions: ['View Applications', 'Initial Evaluation'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-06-01',
  }),
  account({
    id: 'mock-acct-11', fullName: 'Denese Martin', username: 'denese.martin', employeeId: 'ESP-ZON-0005',
    contactNumber: '+63 917 300 2005', role: 'zoning',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Active', lastLogin: '4h ago', department: 'Zoning and Land Use Office',
    permissions: ['View Applications', 'Zoning Evaluation'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-07-20',
    createdDate: '2026-07-10', lastRoleUpdate: '2026-07-20',
    roleHistory: [
      {
        date: '2026-07-20',
        event: 'Role changed from Initial Evaluation Officer to Zoning Officer',
        changedBy: 'Liza Dela Cruz', changedByRole: 'Tenant Administrator',
        reason: 'Reassignment to Zoning Office',
      },
      {
        date: '2026-07-10',
        event: 'Account created as Initial Evaluation Officer',
        changedBy: 'Liza Dela Cruz', changedByRole: 'Tenant Administrator',
      },
    ],
  }),
  account({
    id: 'mock-acct-12', fullName: 'Raul Villa', username: 'raul.villa', employeeId: 'ESP-FIR-0006',
    contactNumber: '+63 917 300 2006', role: 'fire-safety',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Active', lastLogin: '5h ago', department: 'Bureau of Fire Protection Liaison',
    permissions: ['View Applications', 'Fire Safety Evaluation'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-06-05',
  }),
  account({
    id: 'mock-acct-13', fullName: 'Fea Sims', username: 'fea.sims', employeeId: 'ESP-INS-0007',
    contactNumber: '+63 917 300 2007', role: 'inspector',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Active', lastLogin: 'Online now', department: 'Office of the Building Official',
    permissions: ['View Applications', 'Field Inspection', 'Inspection Reports'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-06-08',
  }),
  account({
    id: 'mock-acct-14', fullName: 'David Roderick', username: 'david.roderick', employeeId: 'ESP-CSH-0008',
    contactNumber: '+63 917 300 2008', role: 'cashier',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Active', lastLogin: '13 days ago', department: 'Treasury / Cashiering',
    permissions: ['View Applications', 'Payment Processing'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-04-14',
  }),
  account({
    id: 'mock-acct-15', fullName: 'James Zavel', username: 'james.zavel', employeeId: 'ESP-REL-0009',
    contactNumber: '+63 917 300 2009', role: 'releasing',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Active', lastLogin: '8h ago', department: 'Releasing Unit',
    permissions: ['View Applications', 'Document Release'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-05-30',
  }),
  account({
    id: 'mock-acct-16', fullName: 'Jack Nunnally', username: 'jack.nunnally', employeeId: 'ESP-REC-0010',
    contactNumber: '+63 917 300 2010', role: 'records',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Active', lastLogin: '2h ago', department: 'Records Management',
    permissions: ['View Applications', 'View Reports', 'Records Archive'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-06-12',
  }),

  // Extra tenant-isolation demo accounts (not part of the numbered 16, added
  // so the switcher can demonstrate "same role, different LGU sees different
  // data" and, for Cebu, the tenant-inactive screen).
  account({
    id: 'mock-acct-17', fullName: 'Ana Garcia', username: 'ana.garcia', employeeId: 'MNL-ZON-0001',
    contactNumber: '+63 917 400 3001', role: 'zoning',
    tenant: 'Manila', region: 'National Capital Region (NCR)', city: 'Manila',
    status: 'Active', lastLogin: '1h ago', department: 'Zoning Administration',
    permissions: ['View Applications', 'Zoning Evaluation'],
    assignedBy: 'Roberto Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-03-11',
  }),
  account({
    id: 'mock-acct-18', fullName: 'Mark Lopez', username: 'mark.lopez', employeeId: 'CEB-CSH-0001',
    contactNumber: '+63 917 500 4001', role: 'cashier',
    tenant: 'Cebu', region: 'Region VII (Central Visayas)', province: 'Cebu', city: 'Cebu City',
    status: 'Active', lastLogin: '20m ago', department: 'Treasury / Cashiering',
    permissions: ['View Applications', 'Payment Processing'],
    assignedBy: 'Fatima Reyes', assignedByRole: 'Tenant Administrator', assignedDate: '2026-02-20',
  }),

  // Account-status demo accounts — one per non-Active state, so §14's screens
  // have something real to reach via the Development Role Preview switcher.
  account({
    id: 'mock-acct-19', fullName: 'Carlo Ventura', username: 'carlo.ventura', employeeId: 'ESP-FIR-0011',
    contactNumber: '+63 917 300 2011', role: 'fire-safety',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Pending Confirmation', accountConfirmed: false, lastLogin: 'Never',
    department: 'Bureau of Fire Protection Liaison',
    permissions: ['View Applications', 'Fire Safety Evaluation'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-07-25',
  }),
  account({
    id: 'mock-acct-20', fullName: 'Sofia Ramirez', username: 'sofia.ramirez', employeeId: 'ESP-INI-0012',
    contactNumber: '+63 917 300 2012', role: 'initial-eval',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Reported', lastLogin: '1h ago', department: 'Office of the Building Official',
    permissions: ['View Applications', 'Initial Evaluation'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-07-18',
  }),
  account({
    id: 'mock-acct-21', fullName: 'Antonio Reyes', username: 'antonio.reyes', employeeId: 'ESP-REC-0013',
    contactNumber: '+63 917 300 2013', role: 'records',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Suspended', lastLogin: '40 days ago', department: 'Records Management',
    permissions: ['View Applications', 'View Reports', 'Records Archive'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2026-01-15',
  }),
  account({
    id: 'mock-acct-22', fullName: 'Elena Cruz', username: 'elena.cruz', employeeId: 'ESP-CSH-0014',
    contactNumber: '+63 917 300 2014', role: 'cashier',
    tenant: 'Esperanza', region: 'Caraga Region (XIII)', province: 'Agusan del Sur', city: 'Esperanza',
    status: 'Inactive', lastLogin: '96 days ago', department: 'Treasury / Cashiering',
    permissions: ['View Applications', 'Payment Processing'],
    assignedBy: 'Liza Dela Cruz', assignedByRole: 'Tenant Administrator', assignedDate: '2025-11-02',
  }),
];

export const DEFAULT_ACCOUNT: MockAccount = MOCK_ACCOUNTS[0];

export function findAccount(id: string): MockAccount | undefined {
  return MOCK_ACCOUNTS.find((a) => a.id === id);
}

export function findAccountByLogin(emailOrUsername: string): MockAccount | undefined {
  const normalized = emailOrUsername.trim().toLowerCase();
  return MOCK_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === normalized || a.username.toLowerCase() === normalized,
  );
}
