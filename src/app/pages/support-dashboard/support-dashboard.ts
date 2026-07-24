import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Topbar } from '../../shared/topbar/topbar';
import { StatCard } from '../../shared/stat-card/stat-card';
import { Icon } from '../../shared/icon/icon';
import { Session } from '../../core/session';

interface TenantDirectoryRow {
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
  openIssues: number;
}

const TENANTS: TenantDirectoryRow[] = [
  { name: 'Esperanza', code: 'LGUESPERANZA', status: 'Active', openIssues: 1 },
  { name: 'Manila', code: 'LGUMANILA', status: 'Active', openIssues: 0 },
  { name: 'Cebu', code: 'LGUCEBU', status: 'Active', openIssues: 2 },
  { name: 'Taguig', code: 'LGUTAGUIG', status: 'Active', openIssues: 0 },
  { name: 'Quezon', code: 'LGUQUEZON', status: 'Inactive', openIssues: 0 },
];

@Component({
  selector: 'app-support-dashboard',
  imports: [Topbar, StatCard, Icon, FormsModule],
  templateUrl: './support-dashboard.html',
  styleUrl: './support-dashboard.scss',
})
export class SupportDashboard {
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  protected readonly stats = [
    { icon: 'info', iconBg: '#9333ea', tint: 'tint-purple', label: 'Open Issues', value: '3', footnote: 'Across all tenants' },
    { icon: 'building', iconBg: '#2563eb', tint: 'tint-blue', label: 'Tenants Supported', value: '196', footnote: 'Onboarded LGUs' },
    { icon: 'check-circle', iconBg: '#16a34a', tint: 'tint-green', label: 'Avg. Response Time', value: '18m', footnote: 'Last 7 days' },
  ];

  protected readonly searchTerm = signal('');
  protected readonly tenants = TENANTS;

  protected readonly filteredTenants = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.tenants;
    return this.tenants.filter((t) => t.name.toLowerCase().includes(term) || t.code.toLowerCase().includes(term));
  });

  protected readonly impersonating = this.session.impersonating;

  startImpersonation(tenant: TenantDirectoryRow): void {
    this.session.startImpersonation(tenant.name);
    this.router.navigateByUrl('/tenant/dashboard');
  }
}
