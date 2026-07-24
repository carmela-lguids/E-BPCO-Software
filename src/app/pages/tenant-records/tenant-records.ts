import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { Pagination } from '../../shared/pagination/pagination';
import { RoleGate } from '../../core/role-gate.directive';

type RecordType = 'Permit' | 'Application' | 'Document';
type RecordStatus = 'Active' | 'Archived';

export interface RecordArchiveRow {
  id: string;
  type: RecordType;
  applicant: string;
  city: string;
  archivedDate: string;
  archivedBy: string;
  status: RecordStatus;
}

const BASE_ROWS: RecordArchiveRow[] = [
  { id: '#WA-2010', type: 'Permit', applicant: 'Carmen Diaz', city: 'Taguig City', archivedDate: '3 Jun 2026', archivedBy: 'Jack Nunnally', status: 'Archived' },
  { id: '#WA-2011', type: 'Application', applicant: 'Victor Bautista', city: 'Quezon City', archivedDate: '—', archivedBy: '—', status: 'Active' },
  { id: '#WA-2012', type: 'Document', applicant: 'Rosa Mendoza', city: 'Pasig City', archivedDate: '18 May 2026', archivedBy: 'Jack Nunnally', status: 'Archived' },
  { id: '#WA-2013', type: 'Permit', applicant: 'Grace Tan', city: 'Pasay City', archivedDate: '—', archivedBy: '—', status: 'Active' },
  { id: '#WA-2014', type: 'Application', applicant: 'Paolo Ramos', city: 'Makati City', archivedDate: '2 Apr 2026', archivedBy: 'Jack Nunnally', status: 'Archived' },
  { id: '#WA-2015', type: 'Document', applicant: 'Liza Dela Cruz', city: 'Paranaque City', archivedDate: '—', archivedBy: '—', status: 'Active' },
  { id: '#WA-2016', type: 'Permit', applicant: 'Ramon Torres', city: 'Bulacan City', archivedDate: '11 Mar 2026', archivedBy: 'Jack Nunnally', status: 'Archived' },
];

@Component({
  selector: 'app-tenant-records',
  imports: [Topbar, Icon, Avatar, Pagination, FormsModule, RoleGate],
  templateUrl: './tenant-records.html',
  styleUrl: './tenant-records.scss',
})
export class TenantRecords {
  protected readonly rows = signal<RecordArchiveRow[]>(BASE_ROWS);
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
      rows.map((r) => (r.id === row.id ? { ...r, status: 'Archived', archivedDate: 'Just now', archivedBy: 'You' } : r)),
    );
  }

  restore(row: RecordArchiveRow): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.id === row.id ? { ...r, status: 'Active', archivedDate: '—', archivedBy: '—' } : r)),
    );
  }
}
