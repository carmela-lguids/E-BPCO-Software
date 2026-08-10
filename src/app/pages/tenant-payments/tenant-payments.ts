import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
import { PayStatus, VerifyResult } from './payments-seed';
import { ApplicationStore } from '../../core/application-store';
import { CanonicalApplication } from '../../core/application-model';
import { ROLES } from '../../core/roles';

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

// Phase 14 — Payment → Permit Release Write-Back. Rows are now a live
// projection of ApplicationStore (core/application-store.ts) instead of a
// one-time snapshot of the static CANONICAL_APPLICATIONS array — `rows`
// below is a computed(), so confirmVerify()'s store write is reflected on
// this page immediately, and any other page constructed after this write
// (e.g. navigating to Permit Release) sees the same updated application.
// `apps` is pre-scoped to the active tenant (ApplicationStore.
// applicationsForTenant) — a tenant-isolation fix over Phase 8, which read
// every canonical application regardless of who was logged in (harmless
// only because Esperanza was the sole tenant with data; still a real gap
// per Phase 1 finding E).
//
// `verified` stays derived from `status === 'Paid'` (unchanged since
// Phase 8) rather than canonical's own `payment.verified` flag — that flag
// only distinguishes "verified via this action" from "seeded as already
// Paid," a distinction this page's badge was never meant to draw.
//
// `refunds` has no canonical equivalent (core/application-model.ts's
// ApplicationPayment doesn't model refunds) so it's merged in from a
// page-local overlay, keyed by applicationId, that confirmRefund() below
// writes to — the one piece of this page's state that legitimately stays
// local rather than shared.
function buildRows(apps: CanonicalApplication[], refundsByApplicationId: Record<string, RefundEntry[]>): PaymentRow[] {
  return apps.map((app, i) => {
    const payment = app.payment;
    const status: PayStatus = payment?.status ?? 'Pending';
    const verifyResult: VerifyResult = payment?.verifyResult ?? 'success';
    const method = payment?.method ?? '';
    const refNo = `0122${8300 + i * 40}`;
    const history: HistoryEntry[] =
      status === 'Paid'
        ? [
            { ref: refNo, amount: '₱1,400', date: app.dateSubmitted, status: 'Paid', method, verifiedBy: 'Engr. Doe' },
            { ref: `0122${8456 + i * 3}`, amount: '₱1,400', date: app.dateSubmitted, status: 'Unsuccessful', method: 'Maya', verifiedBy: '' },
            { ref: `0122${8329 + i * 2}`, amount: '₱1,400', date: app.dateSubmitted, status: 'Unsuccessful', method: 'Maya', verifiedBy: '' },
          ]
        : [{ ref: `0122${8100 + i * 5}`, amount: '₱1,400', date: app.dateSubmitted, status: 'Unsuccessful', method, verifiedBy: '' }];

    return {
      id: app.applicationId,
      applicant: app.applicant.fullName,
      city: app.property.city,
      region: 'National Capital Region',
      type: app.project.type,
      dateSubmitted: app.dateSubmitted,
      amount: '₱1,400',
      status,
      verified: status === 'Paid',
      verifyResult,
      refNo,
      paymentMethod: method,
      fees: { processing: '₱250', zoning: '₱150', fire: '₱500', obo: '₱500', total: '₱1,400' },
      history,
      refunds: refundsByApplicationId[app.applicationId] ?? [],
    };
  });
}

@Component({
  selector: 'app-tenant-payments',
  imports: [Topbar, Icon, Avatar, DonutChart, Pagination, FormsModule, RoleGate, MyQueueStrip, EmptyState, RouterLink],
  templateUrl: './tenant-payments.html',
  styleUrl: './tenant-payments.scss',
})
export class TenantPayments {
  private readonly toast = inject(Toast);
  private readonly session = inject(Session);
  private readonly searchIndex = inject(SearchIndex);
  private readonly applicationStore = inject(ApplicationStore);

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

  // The one page-local piece of state that has no canonical equivalent —
  // see buildRows()'s comment above.
  private readonly localRefunds = signal<Record<string, RefundEntry[]>>({});

  protected readonly rows = computed<PaymentRow[]>(() =>
    buildRows(this.applicationStore.applicationsForTenant(this.session.activeTenant()), this.localRefunds()),
  );
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
    // Phase 25 — consolidated with tenant-applications.ts's own recordView()
    // call: both use id `app-${applicationId}` so viewing the same
    // application from either module updates one Recently Viewed entry
    // instead of two ("Application #WA-2026" and "Payment #WA-2026")
    // representing the same underlying record. Route points at the
    // canonical Application Detail, not this page's own local detail
    // state, since that's the one place "recently viewed" can actually
    // deep-link back to.
    this.searchIndex.recordView({
      id: `app-${row.id}`,
      title: row.applicant,
      subtitle: `${row.id} · Payment · ${row.status}`,
      category: 'Application',
      route: `/tenant/applications/${encodeURIComponent(row.id)}`,
      icon: 'user',
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
    if (!row || !id) {
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

    // Invalid application ID, or already verified in the shared store
    // since this row was rendered (e.g. a stale reference) — both cases
    // fail closed with no toast rather than showing a false success.
    const tenantId = this.session.activeTenant();
    const app = this.applicationStore.getApplicationById(id);
    if (!app || app.payment?.status === 'Paid') {
      this.modal.set(null);
      return;
    }

    const verified = this.applicationStore.updatePayment(id, { status: 'Paid', verified: true }, tenantId);
    if (!verified) {
      // getApplicationById() already confirmed the application exists, so
      // this can only be the tenant guard rejecting a cross-tenant write.
      this.modal.set(null);
      return;
    }

    const actor = this.session.currentAccount().fullName;
    const actorRole = ROLES[this.session.currentRole()]?.label ?? 'Cashier';
    this.applicationStore.addTimelineEvent(
      id,
      { label: 'Payment Verified', date: 'Just now', who: actor, role: actorRole },
      tenantId,
    );

    // Existing frontend assumption already encoded in STAGE_ORDER
    // (tenant-applications/applications-data.ts): 'payment' is the stage
    // immediately before 'releasing'. Only advance the stage if this
    // application is actually at the payment stage today — for one that
    // isn't (this mock dataset's two verifiable rows both sit at 'zoning'),
    // recording the payment as verified without skipping the workflow
    // ahead is the safe, non-invented behavior.
    if (app.workflow.stage === 'payment') {
      this.applicationStore.updateWorkflow(id, { stage: 'releasing' }, tenantId);
      this.applicationStore.addTimelineEvent(
        id,
        { label: 'Forwarded to Permit Release', date: 'Just now', who: actor, role: actorRole },
        tenantId,
      );
    }

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
    if (!id) return;
    this.localRefunds.update((map) => ({
      ...map,
      [id]: [
        ...(map[id] ?? []),
        { amount: this.refundAmount, reason: this.refundReason, date: 'Just now', issuedBy: 'You' },
      ],
    }));
    this.closeModal();
  }
}
