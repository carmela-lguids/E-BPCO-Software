import { Component } from '@angular/core';
import { Topbar } from '../../shared/topbar/topbar';
import { StatCard } from '../../shared/stat-card/stat-card';

interface PlatformModule {
  key: string;
  name: string;
  enabledTenantCount: number;
  status: 'Stable' | 'Maintenance' | 'Deprecated';
}

const MODULES: PlatformModule[] = [
  { key: 'initial-eval', name: 'Initial Evaluation', enabledTenantCount: 196, status: 'Stable' },
  { key: 'zoning-eval', name: 'Zoning Evaluation', enabledTenantCount: 196, status: 'Stable' },
  { key: 'fire-eval', name: 'Fire Safety Evaluation', enabledTenantCount: 188, status: 'Stable' },
  { key: 'obo-eval', name: 'OBO Evaluation', enabledTenantCount: 196, status: 'Stable' },
  { key: 'inspections', name: 'Field Inspections', enabledTenantCount: 74, status: 'Maintenance' },
  { key: 'payments', name: 'Payment Processing', enabledTenantCount: 196, status: 'Stable' },
  { key: 'permit-release', name: 'Permit Release', enabledTenantCount: 196, status: 'Stable' },
  { key: 'records', name: 'Records Archive', enabledTenantCount: 52, status: 'Maintenance' },
  { key: 'sms-notify', name: 'SMS Notifications', enabledTenantCount: 12, status: 'Deprecated' },
];

@Component({
  selector: 'app-platform-overview',
  imports: [Topbar, StatCard],
  templateUrl: './platform-overview.html',
  styleUrl: './platform-overview.scss',
})
export class PlatformOverview {
  protected readonly stats = [
    { icon: 'building', iconBg: '#2563eb', tint: 'tint-blue', label: 'Total Tenants', value: '196', footnote: 'Provisioned LGUs' },
    { icon: 'plug', iconBg: '#0f766e', tint: 'tint-green', label: 'Active Modules', value: '9', footnote: 'Across the catalog' },
    { icon: 'alert-triangle', iconBg: '#d97706', tint: 'tint-purple', label: 'In Maintenance', value: '2', footnote: 'Modules flagged' },
    { icon: 'cloud', iconBg: '#565c6b', tint: 'tint-neutral', label: 'Environment Uptime', value: '99.95%', footnote: 'Last 30 days' },
  ];

  protected readonly modules = MODULES;
}
