import { Component, computed, signal } from '@angular/core';
import { Topbar } from '../../shared/topbar/topbar';
import { StatCard, StatDelta } from '../../shared/stat-card/stat-card';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { Pagination } from '../../shared/pagination/pagination';

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

const ROLE_ORDER = [
  'Super Admin',
  'Tenant Admin',
  'Initial Evaluator',
  'Zoning Evaluator',
  'Fire Safety Evaluator',
  'OBO Evaluator',
  'Cashier',
  'Releasing Officer',
  'Viewer / Auditor',
];

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
    name: 'Super Admin',
    description: 'Full platform access across all tenants and modules.',
    userCount: 3,
    permissions: ['All Modules', 'User Management', 'System Settings'],
    iconBg: '#c81e2c',
  },
  {
    name: 'Tenant Admin',
    description: 'Manages a single LGU tenant workspace, staff, and settings.',
    userCount: 12,
    permissions: ['Tenant Settings', 'User Management', 'Reports'],
    iconBg: '#2563eb',
  },
  {
    name: 'Initial Evaluator',
    description: 'Performs first-level document verification and checklist review.',
    userCount: 18,
    permissions: ['View Applications', 'Initial Evaluation'],
    iconBg: '#7c3aed',
  },
  {
    name: 'Zoning Evaluator',
    description: 'Reviews land-use classification and zoning compliance.',
    userCount: 14,
    permissions: ['View Applications', 'Zoning Evaluation'],
    iconBg: '#f59e0b',
  },
  {
    name: 'Fire Safety Evaluator',
    description: 'Validates Bureau of Fire Protection compliance and inspection reports.',
    userCount: 9,
    permissions: ['View Applications', 'Fire Safety Evaluation'],
    iconBg: '#dc2626',
  },
  {
    name: 'OBO Evaluator',
    description: 'Office of the Building Official engineering review and sign-off.',
    userCount: 11,
    permissions: ['View Applications', 'OBO Evaluation', 'Final Approval'],
    iconBg: '#16a34a',
  },
  {
    name: 'Cashier',
    description: 'Processes application fee payments and issues official receipts.',
    userCount: 7,
    permissions: ['View Applications', 'Payment Processing'],
    iconBg: '#0891b2',
  },
  {
    name: 'Releasing Officer',
    description: 'Generates and releases approved permit documents to applicants.',
    userCount: 5,
    permissions: ['View Applications', 'Document Release'],
    iconBg: '#65a30d',
  },
  {
    name: 'Viewer / Auditor',
    description: 'Read-only access across applications and reports for oversight.',
    userCount: 6,
    permissions: ['View Applications', 'View Reports'],
    iconBg: '#565c6b',
  },
];

@Component({
  selector: 'app-user-roles',
  imports: [Topbar, StatCard, Icon, Avatar, Pagination],
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

  private readonly users: UserRow[] = buildUsers();
  protected readonly roles: RoleRow[] = ROLES;

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

  protected readonly totalItems = computed(() => this.users.length);

  protected readonly pagedUsers = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  });

  selectTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.page.set(1);
  }
}
