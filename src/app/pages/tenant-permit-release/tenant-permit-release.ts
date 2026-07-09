import { Component, computed, signal } from '@angular/core';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { Pagination } from '../../shared/pagination/pagination';

type PermitStatus = 'Ready' | 'Released';

interface ReleaseRow {
  id: string;
  applicant: string;
  city: string;
  type: string;
  approvalStatus: string;
  paymentStatus: string;
  permitStatus: PermitStatus;
}

interface RingStat {
  label: string;
  value: string;
  color: string;
  light: string;
  pct: number;
}

const BASE_ROWS: Array<{ id: string; applicant: string; city: string; type: string; permitStatus: PermitStatus }> = [
  { id: '#WA-2026', applicant: 'Raul Villa', city: 'Taguig City', type: 'Residential', permitStatus: 'Released' },
  { id: '#WA-2025', applicant: 'Fea Sims', city: 'Quezon City', type: 'Commercial', permitStatus: 'Ready' },
  { id: '#WA-2024', applicant: 'David Roderick', city: 'Pasig City', type: 'Renovation', permitStatus: 'Released' },
  { id: '#WA-2023', applicant: 'James Zavel', city: 'Pasay City', type: 'Renovation', permitStatus: 'Released' },
  { id: '#WA-2022', applicant: 'Denese Martin', city: 'Makati City', type: 'Renovation', permitStatus: 'Ready' },
  { id: '#WA-2021', applicant: 'Jack Nunnally', city: 'Paranaque City', type: 'Renovation', permitStatus: 'Ready' },
  { id: '#WA-2020', applicant: 'James Zavel', city: 'Bulacan City', type: 'Residential', permitStatus: 'Released' },
  { id: '#WA-2019', applicant: 'Anthony Williams', city: 'Mandaluyong City', type: 'Commercial', permitStatus: 'Ready' },
  { id: '#WA-2018', applicant: 'Axie Barnes', city: 'Marikina City', type: 'Commercial', permitStatus: 'Released' },
  { id: '#WA-2017', applicant: 'Glen Morning', city: 'Caloocan City', type: 'Commercial', permitStatus: 'Ready' },
];

function buildRows(): ReleaseRow[] {
  return BASE_ROWS.map((r) => ({
    ...r,
    approvalStatus: 'Approved',
    paymentStatus: 'Paid',
  }));
}

@Component({
  selector: 'app-tenant-permit-release',
  imports: [Topbar, Icon, Avatar, DonutChart, Pagination],
  templateUrl: './tenant-permit-release.html',
  styleUrl: './tenant-permit-release.scss',
})
export class TenantPermitRelease {
  protected readonly ringStats: RingStat[] = [
    { label: 'Ready to Release', value: '124', color: '#f5c518', light: '#fdf1c7', pct: 45 },
    { label: 'Released', value: '62', color: '#22c55e', light: '#d7f5df', pct: 65 },
    { label: 'Total Release', value: '196', color: '#3b82f6', light: '#dbe8fd', pct: 85 },
  ];

  protected ringSegments(stat: RingStat): DonutSegment[] {
    return [
      { label: 'value', value: stat.pct, color: stat.color },
      { label: 'rest', value: 100 - stat.pct, color: stat.light },
    ];
  }

  protected readonly rows = signal<ReleaseRow[]>(buildRows());
  protected readonly page = signal(1);
  protected readonly pageSize = 10;

  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.rows().slice(start, start + this.pageSize);
  });

  protected readonly showGenerateModal = signal(false);

  generate(): void {
    this.showGenerateModal.set(true);
  }

  release(row: ReleaseRow): void {
    if (row.permitStatus !== 'Ready') return;
    this.rows.update((rows) =>
      rows.map((r) => (r.id === row.id ? { ...r, permitStatus: 'Released' } : r)),
    );
  }

  closeModal(): void {
    this.showGenerateModal.set(false);
  }
}
