import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { StatCard, StatDelta } from '../../shared/stat-card/stat-card';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { Pagination } from '../../shared/pagination/pagination';
import { ROLE_ORDER as ROLE_KEYS, roleLabel, roleKeyFromLabel, RoleKey } from '../../core/roles';
import { RoleGate } from '../../core/role-gate.directive';
import { RoleAssignmentPreview } from '../../shared/role-assignment-preview/role-assignment-preview';

type Tab = 'users' | 'roles';
type UserStatus = 'Active' | 'Inactive' | 'Pending';

export interface UserRow {
  name: string;
  email: string;
  role: string;
  department: string;
  status: UserStatus;
  lastActive: string;
}

export interface RoleRow {
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  iconBg: string;
}

const NAMES = [
  'Engr. Maria Santos',
  'Arch. Paolo Reyes',
  'Jonny Doe',
  'Denese Martin',
  'Raul Villa',
  'Fea Sims',
  'David Roderick',
  'James Zavel',
  'Jack Nunnally',
  'Anthony Williams',
  'Axie Barnes',
  'Glen Morning',
  'Carmen Diaz',
  'Victor Bautista',
  'Rosa Mendoza',
  'Grace Tan',
  'Paolo Ramos',
  'Liza Dela Cruz',
  'Ramon Torres',
  'Mark Lopez',
  'Ana Garcia',
  'Jose Reyes',
  'Daniel Cruz',
  'Ma. Corazon Lim',
];

const DEPARTMENTS = [
  'Office of the Building Official',
  'Zoning Administration',
  'Bureau of Fire Protection Liaison',
  'Treasury / Cashiering',
  'Releasing Unit',
  'City Administrator Office',
];

// Labels driven by the canonical role model in `core/roles.ts` — this page
// used to own its own 9-role list; it now mirrors the full 15-role model
// shared with the mock account switcher, nav-by-role config, and RoleGate.
const ROLE_ORDER = ROLE_KEYS.map(roleLabel);

function emailFor(name: string): string {
  const handle = name
    .toLowerCase()
    .replace(/^(engr\.|arch\.|ma\.)\s*/, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, '.');
  return `${handle}@ebpco.gov.ph`;
}

function buildUsers(): UserRow[] {
  return NAMES.map((name, i) => {
    const status: UserStatus = i % 9 === 8 ? 'Pending' : i % 7 === 6 ? 'Inactive' : 'Active';
    const lastActive =
      status === 'Pending'
        ? 'Invited — not yet accepted'
        : status === 'Inactive'
          ? `${7 + (i % 20)} days ago`
          : i % 5 === 0
            ? 'Online now'
            : `${(i % 11) + 1}h ago`;
    return {
      name,
      email: emailFor(name),
      role: ROLE_ORDER[i % ROLE_ORDER.length],
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      status,
      lastActive,
    };
  });
}

const ROLES: RoleRow[] = [
  {
    name: 'Super Administrator',
    description: 'Full platform access across all tenants and modules.',
    userCount: 3,
    permissions: ['All Modules', 'User Management', 'System Settings'],
    iconBg: '#c81e2c',
  },
  {
    name: 'Platform Administrator',
    description: 'Maintains platform infrastructure, modules, and tenant provisioning.',
    userCount: 4,
    permissions: ['Module Catalog', 'Tenant Provisioning', 'System Maintenance'],
    iconBg: '#0f766e',
  },
  {
    name: 'National Operations Manager',
    description: 'Monitors nationwide permit statistics and LGU performance — read-only.',
    userCount: 3,
    permissions: ['National Analytics', 'LGU Performance', 'Export Reports'],
    iconBg: '#2563eb',
  },
  {
    name: 'System Auditor',
    description: 'Reviews activity, access, and error logs plus compliance reports — read-only.',
    userCount: 6,
    permissions: ['View Logs', 'View Reports', 'Export Audit Data'],
    iconBg: '#565c6b',
  },
  {
    name: 'Technical Support Administrator',
    description: 'Assists LGUs and uses tenant impersonation for troubleshooting.',
    userCount: 5,
    permissions: ['Tenant Lookup', 'Impersonation', 'Issue Tracking'],
    iconBg: '#9333ea',
  },
  {
    name: 'Security Administrator',
    description: 'Manages user security, sessions, login activity, and permissions.',
    userCount: 4,
    permissions: ['User Security', 'Session Monitoring', 'Password Policy'],
    iconBg: '#1d4ed8',
  },
  {
    name: 'Tenant Administrator',
    description: 'Manages a single LGU tenant workspace, staff, and settings.',
    userCount: 12,
    permissions: ['Tenant Settings', 'User Management', 'Reports'],
    iconBg: '#2563eb',
  },
  {
    name: 'Office of the Building Official',
    description: 'Office of the Building Official engineering review and final sign-off.',
    userCount: 11,
    permissions: ['View Applications', 'OBO Evaluation', 'Final Approval'],
    iconBg: '#16a34a',
  },
  {
    name: 'Initial Evaluation Officer',
    description: 'Performs first-level document verification and checklist review.',
    userCount: 18,
    permissions: ['View Applications', 'Initial Evaluation'],
    iconBg: '#7c3aed',
  },
  {
    name: 'Zoning Officer',
    description: 'Reviews land-use classification and zoning compliance.',
    userCount: 14,
    permissions: ['View Applications', 'Zoning Evaluation'],
    iconBg: '#f59e0b',
  },
  {
    name: 'Fire Safety Officer',
    description: 'Validates Bureau of Fire Protection compliance and inspection reports.',
    userCount: 9,
    permissions: ['View Applications', 'Fire Safety Evaluation'],
    iconBg: '#dc2626',
  },
  {
    name: 'Building Inspector',
    description: 'Conducts field inspections to verify compliance with approved plans.',
    userCount: 8,
    permissions: ['View Applications', 'Field Inspection', 'Inspection Reports'],
    iconBg: '#b45309',
  },
  {
    name: 'Cashier / Payment Officer',
    description: 'Processes application fee payments and issues official receipts.',
    userCount: 7,
    permissions: ['View Applications', 'Payment Processing'],
    iconBg: '#0891b2',
  },
  {
    name: 'Permit Releasing Officer',
    description: 'Generates and releases approved permit documents to applicants.',
    userCount: 5,
    permissions: ['View Applications', 'Document Release'],
    iconBg: '#65a30d',
  },
  {
    name: 'Records Officer',
    description: 'Maintains permit records, document archives, and long-term accessibility.',
    userCount: 6,
    permissions: ['View Applications', 'View Reports', 'Records Archive'],
    iconBg: '#78716c',
  },
];

@Component({
  selector: 'app-user-roles',
  imports: [Topbar, StatCard, Icon, Avatar, Pagination, FormsModule, RoleGate, RoleAssignmentPreview],
  templateUrl: './user-roles.html',
  styleUrl: './user-roles.scss',
})
export class UserRoles {
  protected readonly tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'users', label: 'Users', icon: 'user' },
    { key: 'roles', label: 'Roles & Permissions', icon: 'shield' },
  ];

  protected readonly activeTab = signal<Tab>('users');
  protected readonly page = signal(1);
  protected readonly pageSize = 8;
  protected readonly searchTerm = signal('');
  protected readonly roleFilter = signal('All Roles');
  protected readonly statusFilter = signal('All Statuses');

  private readonly users = signal<UserRow[]>(buildUsers());
  protected readonly roles = signal<RoleRow[]>(ROLES);
  protected readonly roleOptions = ROLE_ORDER;
  protected readonly statusOptions: UserStatus[] = ['Active', 'Inactive', 'Pending'];

  protected readonly stats: {
    icon: string;
    iconBg: string;
    tint: string;
    label: string;
    value: string;
    delta?: StatDelta;
    footnote?: string;
  }[] = [
    {
      icon: 'users',
      iconBg: '#2563eb',
      tint: 'tint-blue',
      label: 'Total Users',
      value: '1,524',
      footnote: 'Across All Tenants',
    },
    {
      icon: 'check-circle',
      iconBg: '#16a34a',
      tint: 'tint-green',
      label: 'Active Users',
      value: '1,388',
      delta: { text: '3.4% vs last month', direction: 'up', tone: 'good' },
    },
    {
      icon: 'alert-triangle',
      iconBg: '#f59e0b',
      tint: 'tint-purple',
      label: 'Pending Invites',
      value: '46',
      footnote: 'Awaiting acceptance',
    },
    {
      icon: 'user-check',
      iconBg: '#565c6b',
      tint: 'tint-neutral',
      label: 'Roles Defined',
      value: `${ROLES.length}`,
      footnote: 'Across the platform',
    },
  ];

  protected readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();
    return this.users().filter((u) => {
      if (role !== 'All Roles' && u.role !== role) return false;
      if (status !== 'All Statuses' && u.status !== status) return false;
      if (!term) return true;
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
      );
    });
  });

  protected readonly totalItems = computed(() => this.filteredUsers().length);

  protected readonly pagedUsers = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  selectTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.page.set(1);
  }

  onFilterChange(): void {
    this.page.set(1);
  }

  // --- User actions (view / edit / delete) ---
  protected readonly userModal = signal<'view' | 'edit' | 'delete' | null>(null);
  protected readonly selectedUser = signal<UserRow | null>(null);
  protected editUserForm: UserRow = {
    name: '',
    email: '',
    role: ROLE_ORDER[0],
    department: DEPARTMENTS[0],
    status: 'Active',
    lastActive: '',
  };

  viewUser(row: UserRow): void {
    this.selectedUser.set(row);
    this.userModal.set('view');
  }

  editUser(row: UserRow): void {
    this.selectedUser.set(row);
    this.editUserForm = { ...row };
    this.userModal.set('edit');
  }

  deleteUser(row: UserRow): void {
    this.selectedUser.set(row);
    this.userModal.set('delete');
  }

  closeUserModal(): void {
    this.userModal.set(null);
    this.selectedUser.set(null);
  }

  /** Resolves the plain-text role label in the edit form back to a RoleKey
   *  so the shared Role Assignment Preview (Identity memo §09) can show
   *  what this user will and won't have access to before saving. */
  protected editUserRoleKey(): RoleKey | null {
    return roleKeyFromLabel(this.editUserForm.role) ?? null;
  }

  saveUser(): void {
    const original = this.selectedUser();
    if (!original) return;
    const updated = { ...this.editUserForm };
    this.users.update((list) => list.map((u) => (u === original ? updated : u)));
    this.closeUserModal();
  }

  confirmDeleteUser(): void {
    const original = this.selectedUser();
    if (!original) return;
    this.users.update((list) => list.filter((u) => u !== original));
    this.closeUserModal();
  }

  // --- Role actions (edit / view users) ---
  protected readonly roleModal = signal<'edit' | 'view-users' | null>(null);
  protected readonly selectedRole = signal<RoleRow | null>(null);
  protected editRoleForm: { name: string; description: string } = { name: '', description: '' };

  protected readonly roleUsers = computed(() => {
    const role = this.selectedRole();
    if (!role) return [];
    return this.users().filter((u) => u.role === role.name);
  });

  editRole(role: RoleRow): void {
    this.selectedRole.set(role);
    this.editRoleForm = { name: role.name, description: role.description };
    this.roleModal.set('edit');
  }

  viewRoleUsers(role: RoleRow): void {
    this.selectedRole.set(role);
    this.roleModal.set('view-users');
  }

  closeRoleModal(): void {
    this.roleModal.set(null);
    this.selectedRole.set(null);
  }

  saveRole(): void {
    const original = this.selectedRole();
    if (!original) return;
    const name = this.editRoleForm.name.trim() || original.name;
    const description = this.editRoleForm.description.trim() || original.description;
    this.roles.update((list) =>
      list.map((r) => (r === original ? { ...r, name, description } : r)),
    );
    this.closeRoleModal();
  }
}
