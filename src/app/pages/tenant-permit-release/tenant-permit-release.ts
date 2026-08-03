import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { Pagination } from '../../shared/pagination/pagination';
import { RoleGate } from '../../core/role-gate.directive';
import { Toast } from '../../core/toast';
import { Session } from '../../core/session';
import { MyQueueStrip, QueueTile } from '../../shared/my-queue-strip/my-queue-strip';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { PermitStatus, PERMIT_BASE_ROWS } from './permit-seed';

interface PermitHistoryEntry {
  action: 'Released' | 'Re-printed' | 'Voided';
  date: string;
  by: string;
}

interface ReleaseRow {
  id: string;
  applicant: string;
  city: string;
  type: string;
  approvalStatus: string;
  paymentStatus: string;
  permitStatus: PermitStatus;
  history: PermitHistoryEntry[];
}

interface RingStat {
  label: string;
  value: string;
  color: string;
  light: string;
  pct: number;
}

function buildRows(): ReleaseRow[] {
  return PERMIT_BASE_ROWS.map((r) => ({
    ...r,
    approvalStatus: 'Approved',
    paymentStatus: 'Paid',
    history: r.permitStatus === 'Released' ? [{ action: 'Released', date: '18 Jun 2026', by: 'Engr. Doe' }] : [],
  }));
}

@Component({
  selector: 'app-tenant-permit-release',
  imports: [Topbar, Icon, Avatar, DonutChart, Pagination, FormsModule, RoleGate, MyQueueStrip, EmptyState],
  templateUrl: './tenant-permit-release.html',
  styleUrl: './tenant-permit-release.scss',
})
export class TenantPermitRelease {
  private readonly toast = inject(Toast);
  private readonly session = inject(Session);

  protected readonly isReleasingOfficer = computed(() => this.session.currentRole() === 'releasing');

  protected readonly queueTiles = computed<QueueTile[]>(() => {
    const rows = this.rows();
    const ready = rows.filter((r) => r.permitStatus === 'Ready').length;
    const released = rows.filter((r) => r.permitStatus === 'Released').length;
    return [
      { label: 'Ready to Release', value: String(ready), tone: 'warn' },
      { label: 'Released', value: String(released), tone: 'good' },
    ];
  });

  protected readonly ringStats: RingStat[] = [
    { label: 'Ready to Release', value: '124', color: '#f59e0b', light: '#fef3c7', pct: 45 },
    { label: 'Released', value: '62', color: '#16a34a', light: '#dcfce7', pct: 65 },
    { label: 'Total Release', value: '196', color: '#2563eb', light: '#dbeafe', pct: 85 },
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
  protected readonly searchTerm = signal('');

  protected readonly filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.rows();
    return this.rows().filter(
      (r) =>
        r.id.toLowerCase().includes(term) ||
        r.applicant.toLowerCase().includes(term) ||
        r.city.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term),
    );
  });

  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredRows().slice(start, start + this.pageSize);
  });

  protected onSearchChange(): void {
    this.page.set(1);
  }

  // --- Row selection + bulk release (Ready rows only) ---
  protected readonly selectedRowIds = signal<Set<string>>(new Set());

  protected readonly selectableIds = computed(() =>
    this.pagedRows()
      .filter((r) => r.permitStatus === 'Ready')
      .map((r) => r.id),
  );

  protected readonly allSelectableSelected = computed(() => {
    const ids = this.selectableIds();
    if (ids.length === 0) return false;
    const selected = this.selectedRowIds();
    return ids.every((id) => selected.has(id));
  });

  toggleSelectAllPaged(): void {
    const ids = this.selectableIds();
    const allSelected = this.allSelectableSelected();
    this.selectedRowIds.update((set) => {
      const next = new Set(set);
      for (const id of ids) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  toggleSelectRow(id: string): void {
    this.selectedRowIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isRowSelected(id: string): boolean {
    return this.selectedRowIds().has(id);
  }

  releaseSelected(): void {
    const ids = this.selectedRowIds();
    let count = 0;
    this.rows.update((rows) =>
      rows.map((r) => {
        if (!ids.has(r.id) || r.permitStatus !== 'Ready') return r;
        count++;
        return { ...r, permitStatus: 'Released' as PermitStatus, history: [{ action: 'Released' as const, date: 'Just now', by: 'You' }, ...r.history] };
      }),
    );
    this.toast.show(`${count} permit${count === 1 ? '' : 's'} released.`);
    this.selectedRowIds.set(new Set());
  }

  protected readonly showGenerateModal = signal(false);

  generate(): void {
    this.showGenerateModal.set(true);
  }

  release(row: ReleaseRow): void {
    if (row.permitStatus !== 'Ready') return;
    this.appendHistory(row.id, { action: 'Released', date: 'Just now', by: 'You' });
    this.rows.update((rows) =>
      rows.map((r) => (r.id === row.id ? { ...r, permitStatus: 'Released' } : r)),
    );
    this.toast.show(`${row.id} released.`);
  }

  closeModal(): void {
    this.showGenerateModal.set(false);
  }

  // --- Re-print / void trail ---
  protected readonly historyRow = signal<ReleaseRow | null>(null);
  protected readonly voidTarget = signal<ReleaseRow | null>(null);

  private appendHistory(id: string, entry: PermitHistoryEntry): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.id === id ? { ...r, history: [entry, ...r.history] } : r)),
    );
  }

  viewHistory(row: ReleaseRow): void {
    this.historyRow.set(row);
  }

  closeHistory(): void {
    this.historyRow.set(null);
  }

  reprint(row: ReleaseRow): void {
    if (row.permitStatus !== 'Released') return;
    this.appendHistory(row.id, { action: 'Re-printed', date: 'Just now', by: 'You' });
    this.historyRow.set(this.rows().find((r) => r.id === row.id) ?? null);
  }

  protected readonly voidConfirmText = signal('');

  requestVoid(row: ReleaseRow): void {
    this.voidTarget.set(row);
    this.voidConfirmText.set('');
  }

  cancelVoid(): void {
    this.voidTarget.set(null);
    this.voidConfirmText.set('');
  }

  confirmVoid(): void {
    const row = this.voidTarget();
    if (!row || this.voidConfirmText().trim() !== row.id) return;
    this.appendHistory(row.id, { action: 'Voided', date: 'Just now', by: 'You' });
    this.rows.update((rows) =>
      rows.map((r) => (r.id === row.id ? { ...r, permitStatus: 'Voided' } : r)),
    );
    this.voidTarget.set(null);
  }
}
