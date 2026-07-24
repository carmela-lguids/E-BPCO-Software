import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { StatCard, StatDelta } from '../../shared/stat-card/stat-card';
import { Icon } from '../../shared/icon/icon';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { StackedBarChart } from '../../shared/stacked-bar-chart/stacked-bar-chart';
import { BarList, BarListRow } from '../../shared/bar-list/bar-list';
import { AreaChart } from '../../shared/area-chart/area-chart';
import { Avatar } from '../../shared/avatar/avatar';
import { Pagination } from '../../shared/pagination/pagination';
import { buildPermitQueueRows } from '../../shared/permit-queue/permit-queue';
import { RoleGate } from '../../core/role-gate.directive';

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
    DonutChart,
    StackedBarChart,
    BarList,
    AreaChart,
    Avatar,
    Pagination,
    FormsModule,
    RoleGate,
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

  // One stacked bar per permit type — bar length is that permit's total
  // queue volume, and the fill is its own Pending/Approved/Rejected split.
  protected readonly permitQueueRows = buildPermitQueueRows();

  // Colors are the validated 4-slot categorical palette (dataviz skill
  // validate_palette.js: CVD separation + lightness band + chroma floor all
  // PASS) — info blue, success green, warning amber, and a 4th violet slot
  // for "Return" so it doesn't collide with the Pending/warning meaning.
  protected readonly statusSegments: DonutSegment[] = [
    { label: 'For Evaluation', value: 30, color: '#2563eb' },
    { label: 'Approved', value: 20, color: '#16a34a' },
    { label: 'Return', value: 20, color: '#7c3aed' },
    { label: 'Pending', value: 30, color: '#f59e0b' },
  ];

  protected readonly statusTotal = this.statusSegments.reduce((sum, s) => sum + s.value, 0);

  protected statusPercent(seg: DonutSegment): number {
    return Math.round((seg.value / this.statusTotal) * 100);
  }

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

  protected readonly recentTenants = signal<TenantApplication[]>([
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
  ]);

  // --- Recent tenants row actions (view / edit / delete) ---
  protected readonly tenantAppModal = signal<'view' | 'edit' | 'delete' | null>(null);
  protected readonly selectedTenantApp = signal<TenantApplication | null>(null);
  protected editTenantAppForm: TenantApplication = {
    id: '',
    applicant: '',
    location: '',
    type: '',
    dateSubmitted: '',
    officer: '',
    status: 'Pending',
  };

  viewTenantApp(row: TenantApplication): void {
    this.selectedTenantApp.set(row);
    this.tenantAppModal.set('view');
  }

  editTenantApp(row: TenantApplication): void {
    this.selectedTenantApp.set(row);
    this.editTenantAppForm = { ...row };
    this.tenantAppModal.set('edit');
  }

  deleteTenantApp(row: TenantApplication): void {
    this.selectedTenantApp.set(row);
    this.tenantAppModal.set('delete');
  }

  closeTenantAppModal(): void {
    this.tenantAppModal.set(null);
    this.selectedTenantApp.set(null);
  }

  saveTenantApp(): void {
    const original = this.selectedTenantApp();
    if (!original) return;
    const updated = { ...this.editTenantAppForm };
    this.recentTenants.update((list) => list.map((r) => (r === original ? updated : r)));
    this.closeTenantAppModal();
  }

  confirmDeleteTenantApp(): void {
    const original = this.selectedTenantApp();
    if (!original) return;
    this.recentTenants.update((list) => list.filter((r) => r !== original));
    this.closeTenantAppModal();
  }
}
