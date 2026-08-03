import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { Pagination } from '../../shared/pagination/pagination';
import { RoleGate } from '../../core/role-gate.directive';
import { Session } from '../../core/session';
import { MyQueueStrip, QueueTile } from '../../shared/my-queue-strip/my-queue-strip';
import { EmptyState } from '../../shared/empty-state/empty-state';

type InspectionStatus = 'Scheduled' | 'In Progress' | 'Passed' | 'Needs Correction';

interface ChecklistPoint {
  item: string;
  passed: boolean;
}

export interface InspectionRow {
  id: string;
  applicationId: string;
  applicant: string;
  city: string;
  type: string;
  scheduledDate: string;
  status: InspectionStatus;
  checklist: ChecklistPoint[];
  notes: string;
  photos: string[];
}

interface RingStat {
  label: string;
  value: string;
  color: string;
  light: string;
  pct: number;
}

const CHECKLIST_TEMPLATE = [
  'Foundation matches approved plan',
  'Structural framing complete',
  'Electrical rough-in complete',
  'Plumbing rough-in complete',
  'Fire exits accessible',
  'Site cleared of hazards',
];

const BASE_ROWS: Array<{
  id: string;
  applicationId: string;
  applicant: string;
  city: string;
  type: string;
  scheduledDate: string;
  status: InspectionStatus;
}> = [
  { id: 'INS-2031', applicationId: '#WA-2026', applicant: 'Raul Villa', city: 'Taguig City', type: 'Residential', scheduledDate: '22 Jul 2026', status: 'Scheduled' },
  { id: 'INS-2030', applicationId: '#WA-2024', applicant: 'David Roderick', city: 'Pasig City', type: 'Renovation', scheduledDate: '20 Jul 2026', status: 'In Progress' },
  { id: 'INS-2029', applicationId: '#WA-2020', applicant: 'James Zavel', city: 'Bulacan City', type: 'Residential', scheduledDate: '18 Jul 2026', status: 'Passed' },
  { id: 'INS-2028', applicationId: '#WA-2019', applicant: 'Anthony Williams', city: 'Mandaluyong City', type: 'Commercial', scheduledDate: '15 Jul 2026', status: 'Needs Correction' },
  { id: 'INS-2027', applicationId: '#WA-2018', applicant: 'Axie Barnes', city: 'Marikina City', type: 'Commercial', scheduledDate: '12 Jul 2026', status: 'Passed' },
  { id: 'INS-2026', applicationId: '#WA-2017', applicant: 'Glen Morning', city: 'Caloocan City', type: 'Commercial', scheduledDate: '9 Jul 2026', status: 'Passed' },
];

function buildRows(): InspectionRow[] {
  return BASE_ROWS.map((r, i) => ({
    ...r,
    checklist: CHECKLIST_TEMPLATE.map((item, j) => ({ item, passed: r.status === 'Passed' || (i + j) % 3 !== 0 })),
    notes: r.status === 'Needs Correction' ? 'Electrical rough-in does not match approved plan — re-inspection required.' : '',
    photos: r.status === 'Scheduled' ? [] : ['site-front.jpg', 'foundation.jpg'],
  }));
}

@Component({
  selector: 'app-tenant-inspections',
  imports: [Topbar, Icon, Avatar, DonutChart, Pagination, FormsModule, RoleGate, MyQueueStrip, EmptyState],
  templateUrl: './tenant-inspections.html',
  styleUrl: './tenant-inspections.scss',
})
export class TenantInspections {
  private readonly session = inject(Session);

  protected readonly isInspector = computed(() => this.session.currentRole() === 'inspector');

  protected readonly queueTiles = computed<QueueTile[]>(() => {
    const rows = this.rows();
    const scheduled = rows.filter((r) => r.status === 'Scheduled').length;
    const needsCorrection = rows.filter((r) => r.status === 'Needs Correction').length;
    const passed = rows.filter((r) => r.status === 'Passed').length;
    return [
      { label: 'Scheduled', value: String(scheduled), tone: 'warn' },
      { label: 'Needs Re-inspection', value: String(needsCorrection), tone: 'warn' },
      { label: 'Passed', value: String(passed), tone: 'good' },
    ];
  });

  protected readonly rows = signal<InspectionRow[]>(buildRows());

  protected readonly ringStats = computed<RingStat[]>(() => {
    const rows = this.rows();
    const count = (s: InspectionStatus) => rows.filter((r) => r.status === s).length;
    return [
      { label: 'Scheduled', value: String(count('Scheduled')), color: '#f59e0b', light: '#fef3c7', pct: 40 },
      { label: 'In Progress', value: String(count('In Progress')), color: '#2563eb', light: '#dbeafe', pct: 55 },
      { label: 'Passed', value: String(count('Passed')), color: '#16a34a', light: '#dcfce7', pct: 75 },
      { label: 'Needs Correction', value: String(count('Needs Correction')), color: '#dc2626', light: '#fdeceb', pct: 30 },
    ];
  });

  protected ringSegments(stat: RingStat): DonutSegment[] {
    return [
      { label: 'value', value: stat.pct, color: stat.color },
      { label: 'rest', value: 100 - stat.pct, color: stat.light },
    ];
  }

  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly searchTerm = signal('');

  protected readonly filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.rows();
    return this.rows().filter(
      (r) =>
        r.id.toLowerCase().includes(term) ||
        r.applicant.toLowerCase().includes(term) ||
        r.city.toLowerCase().includes(term) ||
        r.applicationId.toLowerCase().includes(term),
    );
  });

  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredRows().slice(start, start + this.pageSize);
  });

  protected onSearchChange(): void {
    this.page.set(1);
  }

  protected readonly selected = signal<InspectionRow | null>(null);
  protected draftNotes = '';

  open(row: InspectionRow): void {
    this.selected.set(row);
    this.draftNotes = row.notes;
  }

  close(): void {
    this.selected.set(null);
  }

  toggleChecklistItem(item: ChecklistPoint): void {
    const row = this.selected();
    if (!row) return;
    this.rows.update((rows) =>
      rows.map((r) =>
        r.id === row.id
          ? { ...r, checklist: r.checklist.map((c) => (c === item ? { ...c, passed: !c.passed } : c)) }
          : r,
      ),
    );
    this.selected.set({
      ...row,
      checklist: row.checklist.map((c) => (c === item ? { ...c, passed: !c.passed } : c)),
    });
  }

  startInspection(row: InspectionRow): void {
    this.rows.update((rows) => rows.map((r) => (r.id === row.id ? { ...r, status: 'In Progress' } : r)));
  }

  saveDraft(): void {
    const row = this.selected();
    if (!row) return;
    this.rows.update((rows) => rows.map((r) => (r.id === row.id ? { ...r, notes: this.draftNotes } : r)));
    this.close();
  }

  submitReport(passed: boolean): void {
    const row = this.selected();
    if (!row) return;
    const status: InspectionStatus = passed ? 'Passed' : 'Needs Correction';
    this.rows.update((rows) => rows.map((r) => (r.id === row.id ? { ...r, status, notes: this.draftNotes } : r)));
    this.close();
  }
}
