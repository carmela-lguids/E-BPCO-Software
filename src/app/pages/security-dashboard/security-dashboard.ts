import { Component, signal } from '@angular/core';
import { Topbar } from '../../shared/topbar/topbar';
import { StatCard } from '../../shared/stat-card/stat-card';

interface SecuritySession {
  user: string;
  role: string;
  device: string;
  ip: string;
  startedAt: string;
  current: boolean;
}

interface LoginAttempt {
  user: string;
  result: 'Success' | 'Failed';
  ip: string;
  time: string;
}

const SESSIONS: SecuritySession[] = [
  { user: 'Ma. Corazon Lim', role: 'Super Administrator', device: 'Chrome / Windows', ip: '203.0.113.10', startedAt: 'Online now', current: true },
  { user: 'Liza Dela Cruz', role: 'Tenant Administrator', device: 'Edge / Windows', ip: '203.0.113.45', startedAt: '2h ago', current: false },
  { user: 'Engr. Maria Santos', role: 'Office of the Building Official', device: 'Safari / macOS', ip: '203.0.113.88', startedAt: '5h ago', current: false },
  { user: 'David Roderick', role: 'Cashier / Payment Officer', device: 'Chrome / Android', ip: '203.0.113.12', startedAt: '13 days ago', current: false },
];

const LOGIN_ATTEMPTS: LoginAttempt[] = [
  { user: 'grace.tan', result: 'Success', ip: '203.0.113.5', time: '5m ago' },
  { user: 'unknown@user', result: 'Failed', ip: '198.51.100.23', time: '18m ago' },
  { user: 'unknown@user', result: 'Failed', ip: '198.51.100.23', time: '19m ago' },
  { user: 'james.zavel', result: 'Success', ip: '203.0.113.19', time: '1h ago' },
];

@Component({
  selector: 'app-security-dashboard',
  imports: [Topbar, StatCard],
  templateUrl: './security-dashboard.html',
  styleUrl: './security-dashboard.scss',
})
export class SecurityDashboard {
  protected readonly stats = [
    { icon: 'lock', iconBg: '#1d4ed8', tint: 'tint-blue', label: 'Active Sessions', value: '245', footnote: 'Across all tenants' },
    { icon: 'alert-triangle', iconBg: '#dc2626', tint: 'tint-red', label: 'Failed Logins (24h)', value: '2', footnote: 'From 1 IP address' },
    { icon: 'key', iconBg: '#16a34a', tint: 'tint-green', label: 'Password Resets (7d)', value: '32', footnote: 'Self-service' },
  ];

  protected readonly sessions = signal<SecuritySession[]>(SESSIONS);
  protected readonly loginAttempts = LOGIN_ATTEMPTS;

  endSession(session: SecuritySession): void {
    if (session.current) return;
    this.sessions.update((rows) => rows.filter((s) => s !== session));
  }
}
