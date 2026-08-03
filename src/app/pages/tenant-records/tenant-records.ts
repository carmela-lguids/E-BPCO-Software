import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { Pagination } from '../../shared/pagination/pagination';
import { RoleGate } from '../../core/role-gate.directive';
import { Session } from '../../core/session';
import { MyQueueStrip, QueueTile } from '../../shared/my-queue-strip/my-queue-strip';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { RecordArchiveRow, RecordType, RETENTION_POLICY, RECORD_BASE_ROWS } from './records-seed';

@Component({
  selector: 'app-tenant-records',
  imports: [Topbar, Icon, Avatar, Pagination, FormsModule, RoleGate, MyQueueStrip, EmptyState],
  templateUrl: './tenant-records.html',
  styleUrl: './tenant-records.scss',
})
export class TenantRecords {
  private readonly session = inject(Session);

  protected readonly isRecordsOfficer = computed(() => this.session.currentRole() === 'records');

  protected readonly queueTiles = computed<QueueTile[]>(() => {
    const rows = this.rows();
    const active = rows.filter((r) => r.status === 'Active').length;
    const archived = rows.filter((r) => r.status === 'Archived').length;
    const disposal = rows.filter((r) => r.eligibleForDisposal).length;
    const tiles: QueueTile[] = [
      { label: 'Active', value: String(active) },
      { label: 'Archived', value: String(archived), tone: 'good' },
    ];
    if (disposal > 0) tiles.push({ label: 'Eligible for Disposal', value: String(disposal), tone: 'warn' });
    return tiles;
  });

  protected readonly rows = signal<RecordArchiveRow[]>(RECORD_BASE_ROWS);
  protected readonly typeFilter = signal<'All' | RecordType>('All');
  protected readonly searchTerm = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = 10;

  protected readonly typeCounts = computed(() => {
    const rows = this.rows();
    return {
      Permit: rows.filter((r) => r.type === 'Permit').length,
      Application: rows.filter((r) => r.type === 'Application').length,
      Document: rows.filter((r) => r.type === 'Document').length,
      Archived: rows.filter((r) => r.status === 'Archived').length,
    };
  });

  protected readonly filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const type = this.typeFilter();
    return this.rows().filter((r) => {
      if (type !== 'All' && r.type !== type) return false;
      if (!term) return true;
      return (
        r.id.toLowerCase().includes(term) ||
        r.applicant.toLowerCase().includes(term) ||
        r.city.toLowerCase().includes(term)
      );
    });
  });

  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredRows().slice(start, start + this.pageSize);
  });

  selectType(type: 'All' | RecordType): void {
    this.typeFilter.set(type);
    this.page.set(1);
  }

  onSearchChange(): void {
    this.page.set(1);
  }

  protected readonly selected = signal<RecordArchiveRow | null>(null);

  view(row: RecordArchiveRow): void {
    this.selected.set(row);
  }

  closeModal(): void {
    this.selected.set(null);
  }

  archive(row: RecordArchiveRow): void {
    this.rows.update((rows) =>
      rows.map((r) =>
        r.id === row.id
          ? {
              ...r,
              status: 'Archived',
              archivedDate: 'Just now',
              archivedBy: 'You',
              retentionDeadline: `Pending — ${RETENTION_POLICY[r.type]}`,
              eligibleForDisposal: false,
            }
          : r,
      ),
    );
  }

  restore(row: RecordArchiveRow): void {
    this.rows.update((rows) =>
      rows.map((r) =>
        r.id === row.id
          ? { ...r, status: 'Active', archivedDate: '—', archivedBy: '—', retentionDeadline: '—', eligibleForDisposal: false }
          : r,
      ),
    );
  }
}
