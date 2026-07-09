import { Component, computed, signal } from '@angular/core';
import { Topbar } from '../../shared/topbar/topbar';
import { StatCard, StatDelta } from '../../shared/stat-card/stat-card';
import { Icon } from '../../shared/icon/icon';
import { LollipopChart, LollipopCategory } from '../../shared/lollipop-chart/lollipop-chart';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { BarList, BarListRow } from '../../shared/bar-list/bar-list';
import { AreaChart } from '../../shared/area-chart/area-chart';
import { Avatar } from '../../shared/avatar/avatar';
import { Pagination } from '../../shared/pagination/pagination';
import { buildPermitQueue } from '../../shared/permit-queue/permit-queue';

interface StatCardData {
  icon: string;
  iconBg: string;
  tint: string;
  label: string;
  value: string;
  deltas?: StatDelta[];
  footnote?: string;
}

interface TenantApplication {
  id: string;
  applicant: string;
  location: string;
  type: string;
  dateSubmitted: string;
  officer: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

@Component({
  selector: 'app-dashboard',
  imports: [
    Topbar,
    StatCard,
    Icon,
    LollipopChart,
    DonutChart,
    BarList,
    AreaChart,
    Avatar,
    Pagination,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected readonly statCards: StatCardData[] = [
    {
      icon: 'users',
      iconBg: '#2563eb',
      tint: 'tint-blue',
      label: 'Total Tenants',
      value: '20',
      deltas: [
        { text: '28 Active', direction: 'up', tone: 'good' },
        { text: '2 InActive', direction: 'up', tone: 'bad' },
      ],
    },
    {
      icon: 'user',
      iconBg: '#2563eb',
      tint: 'tint-purple',
      label: 'Total Users',
      value: '15,000',
      footnote: 'Across All Tenants',
    },
    {
      icon: 'logs',
      iconBg: '#2563eb',
      tint: 'tint-blue',
      label: 'Total Applications',
      value: '5,000',
      footnote: 'All Time',
    },
    {
      icon: 'check-circle',
      iconBg: '#22c55e',
      tint: 'tint-green',
      label: 'Applications In Process',
      value: '2,400',
      footnote: 'Across All Tenants',
    },
    {
      icon: 'check-circle',
      iconBg: '#dc2626',
      tint: 'tint-red',
      label: 'Applications Approved',
      value: '730',
      footnote: 'All Time',
    },
  ];

  protected readonly queueCategories: LollipopCategory[] = buildPermitQueue();

  protected readonly statusSegments: DonutSegment[] = [
    { label: 'For Evaluation', value: 30, color: '#3b82f6' },
    { label: 'Approved', value: 20, color: '#22c55e' },
    { label: 'Return', value: 20, color: '#f59e0b' },
    { label: 'Pending', value: 30, color: '#f5c518' },
  ];

  protected readonly tenantRows: BarListRow[] = [
    { name: 'Quezon LGU', value: 100 },
    { name: 'Taguig LGU', value: 80 },
    { name: 'Pasig LGU', value: 60 },
    { name: 'Pasay LGU', value: 49 },
    { name: 'Makati LGU', value: 15 },
    { name: 'Dasma LGU', value: 42 },
    { name: 'Bulacan LGU', value: 38 },
    { name: 'Paranaque LGU', value: 30 },
    { name: 'Pateros LGU', value: 22 },
    { name: 'Laguna LGU', value: 18 },
    { name: 'Antipolo LGU', value: 12 },
    { name: 'Cavite LGU', value: 9 },
  ];

  protected readonly tenantPage = signal(1);
  protected readonly tenantPageSize = 5;

  protected readonly pagedTenantRows = computed(() => {
    const start = (this.tenantPage() - 1) * this.tenantPageSize;
    return this.tenantRows.slice(start, start + this.tenantPageSize);
  });

  protected readonly recentTenants: TenantApplication[] = [
    {
      id: '#WA-2026',
      applicant: 'Raul Villa',
      location: 'Taguig City',
      type: 'Residential',
      dateSubmitted: '12 Apr 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
    {
      id: '#WA-2025',
      applicant: 'Fea Sims',
      location: 'Quezon City',
      type: 'Commercial',
      dateSubmitted: '24 Apr 2024',
      officer: 'Engr. Doe',
      status: 'Pending',
    },
    {
      id: '#WA-2024',
      applicant: 'David Roderick',
      location: 'Pasig City',
      type: 'Renovation',
      dateSubmitted: '25 Apr 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
    {
      id: '#WA-2023',
      applicant: 'James Zavel',
      location: 'Pasay City',
      type: 'Renovation',
      dateSubmitted: '14 Dec 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
    {
      id: '#WA-2022',
      applicant: 'Denese Martin',
      location: 'Makati City',
      type: 'Renovation',
      dateSubmitted: '14 Jan 2024',
      officer: 'Engr. Doe',
      status: 'Rejected',
    },
    {
      id: '#WA-2021',
      applicant: 'Jack Nunnally',
      location: 'Paranaque City',
      type: 'Renovation',
      dateSubmitted: '2 Dec 2024',
      officer: 'Engr. Doe',
      status: 'Pending',
    },
    {
      id: '#WA-2020',
      applicant: 'James Zavel',
      location: 'Bulacan City',
      type: 'Residential',
      dateSubmitted: '14 Dec 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
  ];
}
