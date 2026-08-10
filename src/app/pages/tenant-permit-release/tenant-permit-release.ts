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
import { ROLES } from '../../core/roles';
import { MyQueueStrip, QueueTile } from '../../shared/my-queue-strip/my-queue-strip';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { PermitStatus } from './permit-seed';
import { ApplicationStore } from '../../core/application-store';
import { CanonicalApplication } from '../../core/application-model';

interface PermitHistoryEntry {
  action: 'Released' | 'Re-printed' | 'Voided';
  date: string;
  by: string;
}

// Phase 7 (Connect Payment and Permit Release) — a Building Permit's release
// eligibility is now genuinely earned, not assumed. 'Pending' is this page's
// own local-only display value (not written to the canonical store, and not
// part of ReleaseStatus/PermitStatus) for "no real prerequisites met yet" —
// distinct from 'Ready', which now only appears once the canonical record
// actually shows payment.status === 'Paid' AND workflow.stage === 'releasing'.
type DisplayPermitStatus = PermitStatus | 'Pending';

interface ReleaseRow {
  id: string;
  applicant: string;
  city: string;
  type: string;
  approvalStatus: string;
  paymentStatus: string;
  permitStatus: DisplayPermitStatus;
  history: PermitHistoryEntry[];
}

interface RingStat {
  label: string;
  value: string;
  color: string;
  light: string;
  pct: number;
}

// Phase 7 — an application only reads as 'Ready' once its real canonical
// prerequisites are met: payment verified AND workflow already at the
// 'releasing' stage. Previously this page defaulted every application
// without an explicit release record straight to 'Ready' (`app.release?.
// status ?? 'Ready'`), and the mock seed's own static 'Ready' rows
// (permit-seed.ts) didn't actually correspond to Paid payments or the
// releasing stage either — Phase 7's audit found 8 of the 10 seeded rows
// inconsistent across payment/workflow/permit status. 'Released'/'Voided'
// are trusted as-is: they're historical facts already recorded by an actual
// release/void action, not something to retroactively second-guess.
function computePermitStatus(app: CanonicalApplication): DisplayPermitStatus {
  if (app.release?.status === 'Released' || app.release?.status === 'Voided') {
    return app.release.status;
  }
  const paid = app.payment?.status === 'Paid';
  const reachedReleasing = app.workflow.stage === 'releasing';
  return paid && reachedReleasing ? 'Ready' : 'Pending';
}

// Phase 7 — apps.filter(a => a.release) rather than mapping every canonical
// application: only the 10 originally seeded with a real permit-release
// record (permit-seed.ts's PERMIT_BASE_ROWS, via releaseFor() in
// core/application-data.ts) genuinely have permit-release data to show.
// The 35 promoted from Work Queue and the Certificate of Occupancy record
// were never modeled with one — showing them here would mean fabricating a
// release record for an application that was never given one.
function buildRows(
  apps: CanonicalApplication[],
  localHistory: Record<string, PermitHistoryEntry[]>,
): ReleaseRow[] {
  return apps
    .filter((app) => app.release)
    .map((app) => {
      const permitStatus = computePermitStatus(app);
      const baseHistory: PermitHistoryEntry[] =
        app.release?.status === 'Released'
          ? [{ action: 'Released' as const, date: app.release.releasedDate ?? '18 Jun 2026', by: app.release.releasedBy ?? 'Engr. Doe' }]
          : [];
      return {
        id: app.applicationId,
        applicant: app.applicant.fullName,
        city: app.property.city,
        type: app.project.type,
        approvalStatus: app.workflow.status,
        paymentStatus: app.payment?.status ?? 'Pending',
        permitStatus,
        history: [...(localHistory[app.applicationId] ?? []), ...baseHistory],
      };
    });
}

@Component({
  selector: 'app-tenant-permit-release',
  imports: [Topbar, Icon, Avatar, DonutChart, Pagination, FormsModule, RoleGate, MyQueueStrip, EmptyState, RouterLink],
  templateUrl: './tenant-permit-release.html',
  styleUrl: './tenant-permit-release.scss',
})
export class TenantPermitRelease {
  private readonly toast = inject(Toast);
  private readonly session = inject(Session);
  private readonly applicationStore = inject(ApplicationStore);

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

  // Phase 7 — history entries beyond canonical (Re-printed has no ReleaseStatus
  // equivalent; the officer/date this session's own Release/Void action was
  // taken) live here, keyed by applicationId. The release-status ITSELF
  // (Ready -> Released -> Voided) is never local-only — see release()/
  // confirmVoid() below, which write through ApplicationStore.updateRelease()
  // so Records and any other module reading app.release?.status agrees.
  private readonly localHistory = signal<Record<string, PermitHistoryEntry[]>>({});

  // Phase 7 — computed(), not a one-time signal() snapshot: a payment
  // verified on the Payments page while this page is already open must
  // make the same application's release eligibility update here without a
  // reload, per this phase's explicit requirement.
  protected readonly rows = computed<ReleaseRow[]>(() =>
    buildRows(this.applicationStore.applicationsForTenant(this.session.activeTenant()), this.localHistory()),
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

  // Phase 7 — releases now write through ApplicationStore.updateRelease(),
  // the same shared record Records (and any future module) reads from.
  // Every row on this page already carries a real canonical release object
  // (buildRows() filters to apps.filter(a => a.release)), so the merge-only
  // guard in updateRelease() never fails here for a legitimately Ready row.
  private releaseOne(id: string): boolean {
    const tenantId = this.session.activeTenant();
    const app = this.applicationStore.getApplicationById(id);
    if (!app || computePermitStatus(app) !== 'Ready') return false;

    const ok = this.applicationStore.updateRelease(id, { status: 'Released', releasedDate: 'Just now', releasedBy: this.session.currentAccount().fullName }, tenantId);
    if (!ok) return false;

    const actor = this.session.currentAccount().fullName;
    const actorRole = ROLES[this.session.currentRole()]?.label ?? 'Releasing Officer';
    this.applicationStore.addTimelineEvent(id, { label: 'Permit Released', date: 'Just now', who: actor, role: actorRole }, tenantId);
    this.localHistory.update((map) => ({
      ...map,
      [id]: [{ action: 'Released' as const, date: 'Just now', by: actor }, ...(map[id] ?? [])],
    }));
    return true;
  }

  releaseSelected(): void {
    const ids = this.selectedRowIds();
    let count = 0;
    for (const id of ids) {
      if (this.releaseOne(id)) count++;
    }
    this.toast.show(`${count} permit${count === 1 ? '' : 's'} released.`);
    this.selectedRowIds.set(new Set());
  }

  protected readonly showGenerateModal = signal(false);

  generate(): void {
    this.showGenerateModal.set(true);
  }

  release(row: ReleaseRow): void {
    if (!this.releaseOne(row.id)) return;
    this.toast.show(`${row.id} released.`);
  }

  closeModal(): void {
    this.showGenerateModal.set(false);
  }

  // --- Re-print / void trail ---
  protected readonly historyRow = signal<ReleaseRow | null>(null);
  protected readonly voidTarget = signal<ReleaseRow | null>(null);

  viewHistory(row: ReleaseRow): void {
    this.historyRow.set(row);
  }

  closeHistory(): void {
    this.historyRow.set(null);
  }

  // Re-printing doesn't change release status (the permit stays Released),
  // so there's nothing to write through ApplicationStore for — only the
  // local audit-trail entry, same as before Phase 7.
  reprint(row: ReleaseRow): void {
    if (row.permitStatus !== 'Released') return;
    const actor = this.session.currentAccount().fullName;
    this.localHistory.update((map) => ({
      ...map,
      [row.id]: [{ action: 'Re-printed' as const, date: 'Just now', by: actor }, ...(map[row.id] ?? [])],
    }));
    const updated = this.rows().find((r) => r.id === row.id) ?? null;
    this.historyRow.set(updated);
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

    const tenantId = this.session.activeTenant();
    const ok = this.applicationStore.updateRelease(row.id, { status: 'Voided' }, tenantId);
    if (ok) {
      const actor = this.session.currentAccount().fullName;
      const actorRole = ROLES[this.session.currentRole()]?.label ?? 'Releasing Officer';
      this.applicationStore.addTimelineEvent(row.id, { label: 'Permit Voided', date: 'Just now', who: actor, role: actorRole }, tenantId);
      this.localHistory.update((map) => ({
        ...map,
        [row.id]: [{ action: 'Voided' as const, date: 'Just now', by: actor }, ...(map[row.id] ?? [])],
      }));
    }
    this.voidTarget.set(null);
  }
}
