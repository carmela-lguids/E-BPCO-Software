import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { StackedBarChart } from '../../shared/stacked-bar-chart/stacked-bar-chart';
import { HBarChart, HBarRow } from '../../shared/h-bar-chart/h-bar-chart';
import { buildPermitQueueRows } from '../../shared/permit-queue/permit-queue';

interface RingStat {
  label: string;
  value: string;
  color: string;
  light: string;
  pct: number;
}

interface OverdueItem {
  severity: 'Low' | 'Medium' | 'High';
  color: string;
  text: string;
  agoLabel: string;
}

interface ApplicationRow {
  id: string;
  applicant: string;
  location: string;
  type: string;
  dateSubmitted: string;
  officer: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

@Component({
  selector: 'app-tenant-dashboard',
  imports: [Topbar, Icon, Avatar, DonutChart, StackedBarChart, HBarChart, FormsModule],
  templateUrl: './tenant-dashboard.html',
  styleUrl: './tenant-dashboard.scss',
})
export class TenantDashboard {
  protected readonly ringStats: RingStat[] = [
    { label: 'Pending', value: '524', color: '#f59e0b', light: '#fef3c7', pct: 45 },
    { label: 'Approved', value: '849', color: '#16a34a', light: '#dcfce7', pct: 75 },
    { label: 'Rejected', value: '376', color: '#991b1b', light: '#fdeceb', pct: 30 },
    { label: 'Total Applications', value: '1,749', color: '#2563eb', light: '#dbeafe', pct: 85 },
  ];

  protected ringSegments(stat: RingStat): DonutSegment[] {
    return [
      { label: 'value', value: stat.pct, color: stat.color },
      { label: 'rest', value: 100 - stat.pct, color: stat.light },
    ];
  }

  // One stacked bar per permit type — bar length is that permit's total
  // queue volume, and the fill is its own Pending/Approved/Rejected split.
  protected readonly permitQueueRows = buildPermitQueueRows();

  protected readonly pendingRows: HBarRow[] = [
    { label: 'Initial Evaluation', value: 130 },
    { label: 'Zoning Review', value: 340 },
    { label: 'Fire Review', value: 380 },
    { label: 'OBO Review', value: 270 },
    { label: 'Final Approval', value: 650 },
  ];

  protected readonly overdueItems: OverdueItem[] = [
    {
      severity: 'High',
      color: '#991b1b',
      text: "Fea Sim's application is waiting for you in Zoning review for 8 days",
      agoLabel: '1 day ago',
    },
    {
      severity: 'Medium',
      color: '#f59e0b',
      text: "Jack Nunnally's application is waiting for you in Fire review for 4 days",
      agoLabel: '1 day ago',
    },
    {
      severity: 'Low',
      color: '#f59e0b',
      text: "Glen Morning's application is waiting for you in OBO review for 2 days",
      agoLabel: '1 day ago',
    },
  ];

  protected readonly applications = signal<ApplicationRow[]>([
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

  protected readonly searchTerm = signal('');

  protected readonly filteredApplications = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const rows = this.applications();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(term) ||
        r.applicant.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term),
    );
  });

  // --- Recent applications row actions (view / edit / delete) ---
  protected readonly appRowModal = signal<'view' | 'edit' | 'delete' | null>(null);
  protected readonly selectedAppRow = signal<ApplicationRow | null>(null);
  protected editAppRowForm: ApplicationRow = {
    id: '',
    applicant: '',
    location: '',
    type: '',
    dateSubmitted: '',
    officer: '',
    status: 'Pending',
  };

  viewAppRow(row: ApplicationRow): void {
    this.selectedAppRow.set(row);
    this.appRowModal.set('view');
  }

  editAppRow(row: ApplicationRow): void {
    this.selectedAppRow.set(row);
    this.editAppRowForm = { ...row };
    this.appRowModal.set('edit');
  }

  deleteAppRow(row: ApplicationRow): void {
    this.selectedAppRow.set(row);
    this.appRowModal.set('delete');
  }

  closeAppRowModal(): void {
    this.appRowModal.set(null);
    this.selectedAppRow.set(null);
  }

  saveAppRow(): void {
    const original = this.selectedAppRow();
    if (!original) return;
    const updated = { ...this.editAppRowForm };
    this.applications.update((list) => list.map((r) => (r === original ? updated : r)));
    this.closeAppRowModal();
  }

  confirmDeleteAppRow(): void {
    const original = this.selectedAppRow();
    if (!original) return;
    this.applications.update((list) => list.filter((r) => r !== original));
    this.closeAppRowModal();
  }
}
