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
import { SearchIndex } from '../../core/search-index';
import { PAYMENT_BASE_ROWS, PayStatus, VerifyResult } from './payments-seed';

type ModalKind = 'confirm' | 'incomplete' | 'no-authority' | 'refund' | null;

interface HistoryEntry {
  ref: string;
  amount: string;
  date: string;
  status: 'Paid' | 'Unsuccessful';
  method: string;
  verifiedBy: string;
}

interface RefundEntry {
  amount: string;
  reason: string;
  date: string;
  issuedBy: string;
}

interface PaymentRow {
  id: string;
  applicant: string;
  city: string;
  region: string;
  type: string;
  dateSubmitted: string;
  amount: string;
  status: PayStatus;
  verified: boolean;
  verifyResult: VerifyResult;
  refNo: string;
  paymentMethod: string;
  fees: { processing: string; zoning: string; fire: string; obo: string; total: string };
  history: HistoryEntry[];
  refunds: RefundEntry[];
}

interface RingStat {
  label: string;
  value: string;
  color: string;
  light: string;
  pct: number;
}

function buildRows(): PaymentRow[] {
  return PAYMENT_BASE_ROWS.map((r, i) => {
    const refNo = `0122${8300 + i * 40}`;
    const history: HistoryEntry[] =
      r.status === 'Paid'
        ? [
            { ref: refNo, amount: '₱1,400', date: r.dateSubmitted, status: 'Paid', method: r.method, verifiedBy: 'Engr. Doe' },
            { ref: `0122${8456 + i * 3}`, amount: '₱1,400', date: r.dateSubmitted, status: 'Unsuccessful', method: 'Maya', verifiedBy: '' },
            { ref: `0122${8329 + i * 2}`, amount: '₱1,400', date: r.dateSubmitted, status: 'Unsuccessful', method: 'Maya', verifiedBy: '' },
          ]
        : [{ ref: `0122${8100 + i * 5}`, amount: '₱1,400', date: r.dateSubmitted, status: 'Unsuccessful', method: r.method, verifiedBy: '' }];

    return {
      id: r.id,
      applicant: r.applicant,
      city: r.city,
      region: 'National Capital Region',
      type: r.type,
      dateSubmitted: r.dateSubmitted,
      amount: '₱1,400',
      status: r.status,
      verified: r.status === 'Paid',
      verifyResult: r.verifyResult,
      refNo,
      paymentMethod: r.method,
      fees: { processing: '₱250', zoning: '₱150', fire: '₱500', obo: '₱500', total: '₱1,400' },
      history,
      refunds: [],
    };
  });
}

@Component({
  selector: 'app-tenant-payments',
  imports: [Topbar, Icon, Avatar, DonutChart, Pagination, FormsModule, RoleGate, MyQueueStrip, EmptyState],
  templateUrl: './tenant-payments.html',
  styleUrl: './tenant-payments.scss',
})
export class TenantPayments {
  private readonly toast = inject(Toast);
  private readonly session = inject(Session);
  private readonly searchIndex = inject(SearchIndex);

  // Cashier lands directly on this page (no separate dashboard) — this is
  // their "what's mine today" summary, distinct from the page-wide ring
  // stats below it.
  protected readonly isCashier = computed(() => this.session.currentRole() === 'cashier');

  protected readonly queueTiles = computed<QueueTile[]>(() => {
    const rows = this.rows();
    const pending = rows.filter((r) => r.status === 'Pending').length;
    const paid = rows.filter((r) => r.status === 'Paid').length;
    const unpaid = rows.filter((r) => r.status === 'Unpaid').length;
    return [
      { label: 'Pending Verification', value: String(pending), tone: 'warn' },
      { label: 'Verified', value: String(paid), tone: 'good' },
      { label: 'Unpaid', value: String(unpaid) },
    ];
  });

  protected readonly view = signal<'list' | 'detail'>('list');
  protected readonly rows = signal<PaymentRow[]>(buildRows());
  protected readonly selectedId = signal<string | null>(null);

  protected readonly selectedRow = computed(
    () => this.rows().find((r) => r.id === this.selectedId()) ?? null,
  );

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

  // --- Row selection + bulk/toolbar export ---
  protected readonly selectedRowIds = signal<Set<string>>(new Set());

  protected readonly allPagedSelected = computed(() => {
    const paged = this.pagedRows();
    if (paged.length === 0) return false;
    const selected = this.selectedRowIds();
    return paged.every((r) => selected.has(r.id));
  });

  toggleSelectAllPaged(): void {
    const paged = this.pagedRows();
    const allSelected = this.allPagedSelected();
    this.selectedRowIds.update((set) => {
      const next = new Set(set);
      for (const r of paged) {
        if (allSelected) next.delete(r.id);
        else next.add(r.id);
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

  exportRows(): void {
    const count = this.selectedRowIds().size || this.filteredRows().length;
    this.toast.show(`${count} payment${count === 1 ? '' : 's'} exported.`);
    this.selectedRowIds.set(new Set());
  }

  protected readonly ringStats: RingStat[] = [
    { label: 'Pending', value: '524', color: '#f59e0b', light: '#fef3c7', pct: 45 },
    { label: 'Paid', value: '849', color: '#16a34a', light: '#dcfce7', pct: 75 },
    { label: 'Unpaid', value: '376', color: '#991b1b', light: '#fdeceb', pct: 30 },
    { label: 'Total Payments', value: '196', color: '#2563eb', light: '#dbeafe', pct: 85 },
  ];

  protected ringSegments(stat: RingStat): DonutSegment[] {
    return [
      { label: 'value', value: stat.pct, color: stat.color },
      { label: 'rest', value: 100 - stat.pct, color: stat.light },
    ];
  }

  protected readonly modal = signal<ModalKind>(null);
  protected readonly pendingVerifyId = signal<string | null>(null);

  openDetail(row: PaymentRow): void {
    this.selectedId.set(row.id);
    this.view.set('detail');
    this.searchIndex.recordView({
      id: `pay-${row.id}`,
      title: row.applicant,
      subtitle: `${row.id} · Payment · ${row.status}`,
      category: 'Payment',
      route: '/tenant/payments',
      icon: 'wallet',
    });
  }

  backToList(): void {
    this.view.set('list');
  }

  requestVerify(row: PaymentRow): void {
    this.pendingVerifyId.set(row.id);
    this.modal.set('confirm');
  }

  confirmVerify(): void {
    const id = this.pendingVerifyId();
    const row = this.rows().find((r) => r.id === id);
    if (!row) {
      this.modal.set(null);
      return;
    }

    if (row.verifyResult === 'incomplete') {
      this.modal.set('incomplete');
      return;
    }
    if (row.verifyResult === 'no-authority') {
      this.modal.set('no-authority');
      return;
    }

    this.rows.update((rows) =>
      rows.map((r) => (r.id === id ? { ...r, status: 'Paid', verified: true } : r)),
    );
    this.modal.set(null);
    this.toast.show(`${row.id} payment verified. Application moved to Permit Release.`);
  }

  closeModal(): void {
    this.modal.set(null);
    this.pendingVerifyId.set(null);
    this.refundAmount = '';
    this.refundReason = '';
  }

  // --- Refunds & Adjustments ---
  protected refundAmount = '';
  protected refundReason = '';

  get canSubmitRefund(): boolean {
    return this.refundAmount.trim().length > 0 && this.refundReason.trim().length > 0;
  }

  requestRefund(row: PaymentRow): void {
    this.pendingVerifyId.set(row.id);
    this.modal.set('refund');
  }

  confirmRefund(): void {
    if (!this.canSubmitRefund) return;
    const id = this.pendingVerifyId();
    this.rows.update((rows) =>
      rows.map((r) =>
        r.id === id
          ? {
              ...r,
              refunds: [
                ...r.refunds,
                { amount: this.refundAmount, reason: this.refundReason, date: 'Just now', issuedBy: 'You' },
              ],
            }
          : r,
      ),
    );
    this.closeModal();
  }
}
