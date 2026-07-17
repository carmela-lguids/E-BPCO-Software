import { Component, computed, signal } from '@angular/core';
import { Topbar } from '../../shared/topbar/topbar';
import { StatCard, StatDelta } from '../../shared/stat-card/stat-card';
import { Icon } from '../../shared/icon/icon';
import { Pagination } from '../../shared/pagination/pagination';

type LogTabKey = 'activity' | 'access' | 'error' | 'security' | 'events';

interface LogStat {
  icon: string;
  iconBg: string;
  tint: string;
  label: string;
  value: string;
  delta?: StatDelta;
  footnote?: string;
}

interface BaseRow {
  city: string;
  name: string;
  phone: string;
  date: string;
  ip: string;
  status: 'Active' | 'Inactive';
}

const CITIES = [
  'Taguig',
  'Quezon',
  'Makati',
  'Pasig',
  'Pasay',
  'Laguna',
  'Dasma',
  'Bulacan',
  'Paranaque',
  'Pateros',
  'Antipolo',
  'Cavite',
];

const NAMES = [
  'Daniel Cruz',
  'Maria Santos',
  'Jose Reyes',
  'Ana Garcia',
  'Mark Lopez',
  'Grace Tan',
  'Paolo Ramos',
  'Liza Dela Cruz',
  'Ramon Torres',
  'Carmen Diaz',
  'Victor Bautista',
  'Rosa Mendoza',
];

const MODULES = ['Applications', 'User Management', 'Billing', 'Workflow', 'Reports', 'Tenants'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildBaseRows(count: number): BaseRow[] {
  return Array.from({ length: count }, (_, i) => {
    const city = CITIES[i % CITIES.length];
    return {
      city: `${city} City`,
      name: NAMES[i % NAMES.length],
      phone: `63 9${(10 + (i % 89)).toString().padStart(2, '0')} ${(100 + i * 7).toString().padStart(3, '0')} ${(1000 + i * 37).toString().padStart(4, '0')}`,
      date: `${(i % 27) + 1} ${MONTHS[i % 12]} 2024`,
      ip: `192.168.${(i % 9) + 1}.${10 + i}`,
      status: i % 5 === 4 ? 'Inactive' : ('Active' as 'Active' | 'Inactive'),
    };
  });
}

function timestampFor(i: number, base: BaseRow): string {
  const hour24 = 8 + (i % 10);
  const minute = (i * 7) % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${base.date} ${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

function severityFor(i: number): 'Critical' | 'Warning' | 'Info' {
  return i % 3 === 0 ? 'Critical' : i % 3 === 1 ? 'Warning' : 'Info';
}

const ROW_COUNT = 24;
const BASE_ROWS = buildBaseRows(ROW_COUNT);

const ACTIVITY_EVENTS = [
  'Login',
  'Logout',
  'Create Application',
  'Update Application',
  'Approve Application',
  'Reject Application',
  'Delete Record',
  'Export Report',
];

const ACCESS_EVENTS = ['Login Success', 'Login Failed', 'Password Reset', 'Session Expired'];
const DEVICES = ['Chrome / Windows', 'Safari / macOS', 'Edge / Windows', 'Chrome / Android'];

const ERROR_TYPES = [
  'NullReferenceException',
  'TimeoutError',
  'ValidationError',
  'DatabaseConnectionError',
  'UnauthorizedAccess',
];
const ERROR_MESSAGES = [
  'Unexpected null value encountered while processing request.',
  'Upstream service did not respond in time.',
  'Submitted form data failed schema validation.',
  'Could not establish a connection to the tenant database.',
  'Request blocked due to insufficient permissions.',
];

const SECURITY_EVENTS = [
  'Failed Login Attempt',
  'Password Changed',
  'Suspicious IP Blocked',
  '2FA Enabled',
  'Account Locked',
];

const SYSTEM_EVENTS = ['Config Updated', 'Scheduled Backup', 'Deployment', 'Integration Sync', 'Cache Cleared'];

export interface ActivityRow {
  timestamp: string;
  eventType: string;
  description: string;
  user: string;
  tenant: string;
  module: string;
  ip: string;
  status: 'Active' | 'Inactive';
  severity: 'Critical' | 'Warning' | 'Info';
}

export interface AccessRow {
  timestamp: string;
  user: string;
  tenant: string;
  event: string;
  status: 'Active' | 'Inactive';
  ip: string;
  device: string;
  location: string;
  sessionDuration: string;
}

export interface ErrorRow {
  timestamp: string;
  errorType: string;
  message: string;
  module: string;
  tenant: string;
  environment: string;
  status: 'Active' | 'Inactive';
  severity: 'Critical' | 'Warning' | 'Info';
  requestId: string;
}

export interface SecurityRow {
  timestamp: string;
  eventType: string;
  user: string;
  tenant: string;
  message: string;
  ip: string;
  environment: string;
  severity: 'Critical' | 'Warning' | 'Info';
  status: 'Active' | 'Inactive';
}

export interface SystemEventRow {
  timestamp: string;
  eventType: string;
  event: string;
  module: string;
  tenant: string;
  environment: string;
  severity: 'Critical' | 'Warning' | 'Info';
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-system-logs',
  imports: [Topbar, StatCard, Icon, Pagination],
  templateUrl: './system-logs.html',
  styleUrl: './system-logs.scss',
})
export class SystemLogs {
  protected readonly tabs: { key: LogTabKey; label: string; icon: string }[] = [
    { key: 'activity', label: 'Activity logs', icon: 'logs' },
    { key: 'access', label: 'Access logs', icon: 'key' },
    { key: 'error', label: 'Error logs', icon: 'alert-circle' },
    { key: 'security', label: 'Security Activity', icon: 'shield' },
    { key: 'events', label: 'System Events', icon: 'gear' },
  ];

  protected readonly activeTab = signal<LogTabKey>('activity');
  protected readonly page = signal(1);
  protected readonly pageSize = 10;

  protected readonly dateRange = '5, 2026 - May 6, 2026';

  private readonly statsByTab: Record<LogTabKey, LogStat[]> = {
    activity: [
      {
        icon: 'logs',
        iconBg: '#2563eb',
        tint: 'tint-blue',
        label: 'Total Logs (Today)',
        value: '20,203',
        delta: { text: '18.6% vs yesterday', direction: 'up', tone: 'good' },
      },
      {
        icon: 'alert-circle',
        iconBg: '#dc2626',
        tint: 'tint-red',
        label: 'Errors (Critical)',
        value: '203',
        delta: { text: '8.3% vs yesterday', direction: 'up', tone: 'bad' },
      },
      {
        icon: 'alert-triangle',
        iconBg: '#d97706',
        tint: 'tint-purple',
        label: 'Warnings (Today)',
        value: '303',
        delta: { text: '5.2% vs yesterday', direction: 'down', tone: 'good' },
      },
      {
        icon: 'check-circle',
        iconBg: '#16a34a',
        tint: 'tint-green',
        label: 'Successful Actions',
        value: '3,249',
        delta: { text: '20.4% vs yesterday', direction: 'down', tone: 'bad' },
      },
      {
        icon: 'user',
        iconBg: '#565c6b',
        tint: 'tint-neutral',
        label: 'Active Sessions',
        value: '245',
        footnote: 'Across All Tenants',
      },
    ],
    access: [
      {
        icon: 'logs',
        iconBg: '#2563eb',
        tint: 'tint-blue',
        label: 'Total Logs (Today)',
        value: '20,203',
        delta: { text: '18% vs yesterday', direction: 'up', tone: 'good' },
      },
      {
        icon: 'check-circle',
        iconBg: '#16a34a',
        tint: 'tint-green',
        label: 'Successful Logins',
        value: '3,249',
        delta: { text: '20.4% vs yesterday', direction: 'down', tone: 'bad' },
      },
      {
        icon: 'alert-triangle',
        iconBg: '#d97706',
        tint: 'tint-purple',
        label: 'Failed Logins',
        value: '303',
        delta: { text: '5.2% vs yesterday', direction: 'down', tone: 'good' },
      },
      {
        icon: 'shield',
        iconBg: '#dc2626',
        tint: 'tint-red',
        label: 'Blocked IPs',
        value: '203',
        footnote: 'Across All Tenants',
      },
      {
        icon: 'user',
        iconBg: '#565c6b',
        tint: 'tint-neutral',
        label: 'Active Sessions',
        value: '245',
        footnote: 'Across All Tenants',
      },
    ],
    error: [
      {
        icon: 'alert-circle',
        iconBg: '#2563eb',
        tint: 'tint-blue',
        label: 'Total Errors (Today)',
        value: '20,203',
        delta: { text: '18.6% vs yesterday', direction: 'up', tone: 'bad' },
      },
      {
        icon: 'alert-circle',
        iconBg: '#dc2626',
        tint: 'tint-red',
        label: 'Critical Errors',
        value: '23',
        delta: { text: '28.6% vs yesterday', direction: 'up', tone: 'bad' },
      },
      {
        icon: 'alert-triangle',
        iconBg: '#d97706',
        tint: 'tint-purple',
        label: 'Unhandled Errors',
        value: '303',
        delta: { text: '5.2% vs yesterday', direction: 'up', tone: 'bad' },
      },
      {
        icon: 'user',
        iconBg: '#565c6b',
        tint: 'tint-neutral',
        label: 'Affected Users',
        value: '245',
        delta: { text: '15.2% vs yesterday', direction: 'up', tone: 'bad' },
      },
      {
        icon: 'check-circle',
        iconBg: '#16a34a',
        tint: 'tint-green',
        label: 'Resolved (today)',
        value: '3,249',
        delta: { text: '20.4% vs yesterday', direction: 'up', tone: 'good' },
      },
    ],
    security: [
      {
        icon: 'shield',
        iconBg: '#2563eb',
        tint: 'tint-blue',
        label: 'Security Events (Today)',
        value: '20,203',
        delta: { text: '11.6% vs yesterday', direction: 'up', tone: 'bad' },
      },
      {
        icon: 'lock',
        iconBg: '#dc2626',
        tint: 'tint-red',
        label: 'Failed Login Attempts',
        value: '23',
        delta: { text: '8.6% vs yesterday', direction: 'up', tone: 'bad' },
      },
      {
        icon: 'alert-triangle',
        iconBg: '#d97706',
        tint: 'tint-purple',
        label: 'Suspicious Activities',
        value: '13',
        delta: { text: '3% vs yesterday', direction: 'up', tone: 'bad' },
      },
      {
        icon: 'user',
        iconBg: '#565c6b',
        tint: 'tint-neutral',
        label: 'Blocked IP Addresses',
        value: '245',
        delta: { text: '5% vs yesterday', direction: 'down', tone: 'good' },
      },
      {
        icon: 'key',
        iconBg: '#16a34a',
        tint: 'tint-green',
        label: 'Password Changes',
        value: '32',
        delta: { text: '16% vs yesterday', direction: 'up', tone: 'good' },
      },
    ],
    events: [
      {
        icon: 'gear',
        iconBg: '#2563eb',
        tint: 'tint-blue',
        label: 'System Events (Today)',
        value: '203',
        delta: { text: '18.6% vs yesterday', direction: 'up', tone: 'good' },
      },
      {
        icon: 'edit',
        iconBg: '#dc2626',
        tint: 'tint-red',
        label: 'Configuration Changes',
        value: '23',
        delta: { text: '12.6% vs yesterday', direction: 'up', tone: 'good' },
      },
      {
        icon: 'calendar',
        iconBg: '#d97706',
        tint: 'tint-purple',
        label: 'Scheduled Tasks',
        value: '74',
        delta: { text: '9.3% vs yesterday', direction: 'up', tone: 'good' },
      },
      {
        icon: 'cloud',
        iconBg: '#565c6b',
        tint: 'tint-neutral',
        label: 'Deployments',
        value: '245',
        delta: { text: '5.1% vs yesterday', direction: 'down', tone: 'bad' },
      },
      {
        icon: 'plug',
        iconBg: '#16a34a',
        tint: 'tint-green',
        label: 'Integrations',
        value: '32',
        delta: { text: '10% vs yesterday', direction: 'up', tone: 'good' },
      },
    ],
  };

  private readonly activityRows: ActivityRow[] = BASE_ROWS.map((r, i) => ({
    timestamp: timestampFor(i, r),
    eventType: ACTIVITY_EVENTS[i % ACTIVITY_EVENTS.length],
    description: `${r.name} triggered ${ACTIVITY_EVENTS[i % ACTIVITY_EVENTS.length].toLowerCase()}`,
    user: r.name,
    tenant: r.city,
    module: MODULES[i % MODULES.length],
    ip: r.ip,
    status: r.status,
    severity: severityFor(i),
  }));

  private readonly accessRows: AccessRow[] = BASE_ROWS.map((r, i) => ({
    timestamp: timestampFor(i, r),
    user: r.name,
    tenant: r.city,
    event: ACCESS_EVENTS[i % ACCESS_EVENTS.length],
    status: r.status,
    ip: r.ip,
    device: DEVICES[i % DEVICES.length],
    location: r.city,
    sessionDuration: `${5 + (i % 50)}m`,
  }));

  private readonly errorRows: ErrorRow[] = BASE_ROWS.map((r, i) => ({
    timestamp: timestampFor(i, r),
    errorType: ERROR_TYPES[i % ERROR_TYPES.length],
    message: ERROR_MESSAGES[i % ERROR_MESSAGES.length],
    module: MODULES[i % MODULES.length],
    tenant: r.city,
    environment: i % 2 === 0 ? 'Production' : 'Staging',
    status: r.status,
    severity: severityFor(i),
    requestId: `REQ-${10000 + i}`,
  }));

  private readonly securityRows: SecurityRow[] = BASE_ROWS.map((r, i) => ({
    timestamp: timestampFor(i, r),
    eventType: SECURITY_EVENTS[i % SECURITY_EVENTS.length],
    user: r.name,
    tenant: r.city,
    message: `${SECURITY_EVENTS[i % SECURITY_EVENTS.length]} from ${r.ip}`,
    ip: r.ip,
    environment: i % 2 === 0 ? 'Production' : 'Staging',
    severity: severityFor(i),
    status: r.status,
  }));

  private readonly eventRows: SystemEventRow[] = BASE_ROWS.map((r, i) => ({
    timestamp: timestampFor(i, r),
    eventType: SYSTEM_EVENTS[i % SYSTEM_EVENTS.length],
    event: `${SYSTEM_EVENTS[i % SYSTEM_EVENTS.length]} on ${MODULES[i % MODULES.length]}`,
    module: MODULES[i % MODULES.length],
    tenant: r.city,
    environment: i % 2 === 0 ? 'Production' : 'Staging',
    severity: severityFor(i),
    status: r.status,
  }));

  protected readonly currentStats = computed(() => this.statsByTab[this.activeTab()]);

  protected readonly totalItems = computed(() => {
    switch (this.activeTab()) {
      case 'activity':
        return this.activityRows.length;
      case 'access':
        return this.accessRows.length;
      case 'error':
        return this.errorRows.length;
      case 'security':
        return this.securityRows.length;
      case 'events':
        return this.eventRows.length;
    }
  });

  private slice<T>(rows: T[]): T[] {
    const start = (this.page() - 1) * this.pageSize;
    return rows.slice(start, start + this.pageSize);
  }

  protected readonly pagedActivityRows = computed(() => this.slice(this.activityRows));
  protected readonly pagedAccessRows = computed(() => this.slice(this.accessRows));
  protected readonly pagedErrorRows = computed(() => this.slice(this.errorRows));
  protected readonly pagedSecurityRows = computed(() => this.slice(this.securityRows));
  protected readonly pagedEventRows = computed(() => this.slice(this.eventRows));

  protected readonly liveStream = signal(true);

  selectTab(tab: LogTabKey): void {
    this.activeTab.set(tab);
    this.page.set(1);
  }

  toggleLiveStream(): void {
    this.liveStream.update((v) => !v);
  }
}
