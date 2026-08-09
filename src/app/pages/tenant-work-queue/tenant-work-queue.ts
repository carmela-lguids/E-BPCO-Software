import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { FocusTrapDirective } from '../../core/focus-trap.directive';
import { Session } from '../../core/session';
import { RoleKey } from '../../core/roles';
import { Toast } from '../../core/toast';
import {
  WORK_QUEUE_TASKS,
  WORK_QUEUE_TENANT,
  WorkQueueTask,
  WorkQueueStage,
  STAGE_LABEL,
  tasksForRole,
  slaChipLabel,
  priorityTier,
  priorityLabel,
  OverdueSeverity,
  overdueSeverity,
  overdueSeverityTier,
  overdueSeverityLabel,
  dueTodayCountdownLabel,
  dueTodayUrgency,
  dueTodayUrgencyTier,
  dueTodayUrgencyLabel,
  applicantResponseLabel,
  applicantResponseTier,
  assignedDaysAgo,
  recentAssignmentBadge,
  recentAssignmentLabel,
  SORT_OPTIONS,
  SortKey,
  SortDirection,
  sortTasks,
  unassignedApplicationsCount,
  departmentWorkload,
  DepartmentWorkloadStat,
} from './work-queue-data';

type QueueTabKey = 'my-tasks' | 'overdue' | 'due-today' | 'high-priority' | 'returned' | 'recently-assigned';

interface QueueTabDef {
  key: QueueTabKey;
  label: string;
  icon: string;
  /** Which later phase populates this tab — drives the placeholder copy on
   *  tabs not yet implemented, not read anywhere else. */
  phase: number;
}

// Mirrors the existing EVALUATOR_EVAL_TYPE map in tenant-applications.ts,
// extended to the other "own queue" roles (inspector/cashier/releasing)
// this feature also targets. tenant-admin isn't here — it gets the
// supervisory view instead of a personal queue.
const QUEUE_ROLE_LABEL: Partial<Record<RoleKey, string>> = {
  'initial-eval': 'Initial Evaluation',
  zoning: 'Zoning',
  'fire-safety': 'Fire Safety',
  obo: 'OBO Review',
  inspector: 'Inspections',
  cashier: 'Payments',
  releasing: 'Permit Release',
};

const QUEUE_TABS: QueueTabDef[] = [
  { key: 'my-tasks', label: 'My Assigned Tasks', icon: 'clipboard-check', phase: 2 },
  { key: 'overdue', label: 'Overdue Reviews', icon: 'alert-triangle', phase: 3 },
  { key: 'due-today', label: 'Due Today', icon: 'calendar', phase: 4 },
  { key: 'high-priority', label: 'High Priority', icon: 'alert-circle', phase: 5 },
  { key: 'returned', label: 'Returned Applications', icon: 'edit', phase: 6 },
  { key: 'recently-assigned', label: 'Recently Assigned', icon: 'user-check', phase: 7 },
];

// --- Phase 11 — Quick Views ---
// Fixed, curated shortcuts, NOT user-created/saved views — there is no
// persistence layer here, simulated or otherwise. Each one just sets a
// few already-existing controls (tab, sort, filters) at once; nothing is
// stored anywhere, so there's nothing to lose on reload — which is the
// honest framing for a frontend-only prototype rather than implying a
// "save" mechanism that doesn't exist. "Returned & Ready" works purely
// because Urgency sort already ranks returned-and-resubmitted items
// (tier 5) above ones still waiting on the applicant — no new filter
// needed to find the "ready" ones.
interface QuickView {
  key: string;
  label: string;
  tab: QueueTabKey;
  sort: SortKey;
}

const QUICK_VIEWS: QuickView[] = [
  { key: 'urgent', label: 'My Urgent Work', tab: 'my-tasks', sort: 'urgency' },
  { key: 'due-today', label: 'Due Today', tab: 'due-today', sort: 'urgency' },
  { key: 'returned-ready', label: 'Returned & Ready', tab: 'returned', sort: 'urgency' },
  { key: 'high-priority', label: 'High Priority', tab: 'high-priority', sort: 'urgency' },
];

const STAGE_OPTIONS: { key: WorkQueueStage; label: string }[] = (
  Object.keys(STAGE_LABEL) as WorkQueueStage[]
).map((key) => ({ key, label: STAGE_LABEL[key] }));

@Component({
  selector: 'app-tenant-work-queue',
  imports: [Topbar, Icon, EmptyState, FormsModule, RouterLink, FocusTrapDirective],
  templateUrl: './tenant-work-queue.html',
  styleUrl: './tenant-work-queue.scss',
})
export class TenantWorkQueue {
  private readonly session = inject(Session);
  private readonly toast = inject(Toast);

  // A Tenant Administrator supervises everyone's queue rather than
  // processing their own — same distinction tenant-applications.ts already
  // draws between tenant-admin (tabs + assignment UI) and evaluator roles
  // (plain queue, no assignment controls).
  protected readonly isSupervisor = computed(() => this.session.currentRole() === 'tenant-admin');
  protected readonly myQueueLabel = computed(() => QUEUE_ROLE_LABEL[this.session.currentRole()]);

  protected readonly pageTitle = computed(() => (this.isSupervisor() ? 'Team Work Queue' : 'My Work Queue'));

  protected readonly pageSub = computed(() => {
    if (this.isSupervisor()) return 'Supervisory view across every officer in this LGU.';
    const label = this.myQueueLabel();
    return label ? `${label} tasks assigned to you.` : 'Tasks assigned to you.';
  });

  protected readonly queueTabs = QUEUE_TABS;
  protected readonly activeTab = signal<QueueTabKey>('my-tasks');

  setTab(key: QueueTabKey): void {
    this.activeTab.set(key);
    // Each tab is a genuinely different queue/view (not just a filter
    // refinement) — clearing selection on tab switch avoids silently
    // carrying a hidden selection into a bulk action the user can no
    // longer see.
    this.selectedIds.set(new Set<string>());
  }

  protected readonly searchTerm = signal('');
  protected readonly stageFilter = signal<string>('all');
  protected readonly priorityFilter = signal<'all' | 'critical' | 'high' | 'normal'>('all');
  protected readonly stageOptions = STAGE_OPTIONS;

  // --- Phase 2 — My Assigned Tasks ---
  // Personal queue for the 7 "own queue" roles; the full pool for
  // tenant-admin's supervisory view. Not a new roster per role — filtered
  // straight from the one WORK_QUEUE_TASKS array (work-queue-data.ts).
  //
  // Phase 12 — Tenant Isolation Audit fix: WORK_QUEUE_TASKS only represents
  // WORK_QUEUE_TENANT's (Esperanza) roster. A role key alone isn't unique
  // across LGUs — e.g. Ana Garcia (Manila) and Denese Martin (Esperanza)
  // are both 'zoning'. Without this gate, tasksForRole('zoning') would
  // hand Ana Garcia Denese Martin's tasks relabeled as her own — a real
  // cross-tenant leak this audit caught live. Any account whose active
  // tenant isn't Esperanza sees an empty queue instead, which is the
  // honest answer: this prototype simply has no mock data for their LGU.
  protected readonly myTasks = computed(() => {
    if (this.session.activeTenant() !== WORK_QUEUE_TENANT) return [];
    return this.isSupervisor() ? WORK_QUEUE_TASKS : tasksForRole(this.session.currentRole());
  });

  // --- Phase 3 — Overdue Reviews ---
  // A filter over the same pool, not a second dataset — every tab that
  // follows (Due Today, High Priority, ...) is designed the same way.
  protected readonly overdueTasks = computed(() => this.myTasks().filter((t) => t.slaStatus === 'overdue'));

  // --- Phase 4 — Due Today ---
  protected readonly dueTodayTasks = computed(() => this.myTasks().filter((t) => t.slaStatus === 'due-today'));

  // --- Phase 5 — High Priority Queue ---
  // 'critical' priority is the escalation tier this tab surfaces — 'high'
  // is still meaningfully less urgent (see priorityTier()'s own mapping to
  // rejected/pending) and stays visible via the Priority filter instead.
  protected readonly highPriorityTasks = computed(() => this.myTasks().filter((t) => t.priority === 'critical'));

  // --- Phase 6 — Returned Applications ---
  protected readonly returnedTasks = computed(() => this.myTasks().filter((t) => t.isReturned === true));

  // --- Phase 10 — Queue Insights / Summary ---
  // Every count here reuses the tab computeds already defined above
  // (Phases 2-6) — nothing here is a second/parallel dataset, and none of
  // it is affected by the search box, Stage/Priority filters, or sort
  // below: it's a stable "how much work do I have" total, not a live
  // count of whatever's currently filtered into view (made explicit in
  // the template caption too, per the brief's own requirement to state
  // this outright rather than leave it ambiguous).
  protected readonly summaryUnassignedCount = unassignedApplicationsCount();

  protected readonly summaryDepartmentWorkload = computed<DepartmentWorkloadStat[]>(() =>
    departmentWorkload(this.myTasks()),
  );

  // --- Phase 7 — Recently Assigned ---
  // "Recently" = assigned today or yesterday (assignedDaysAgo <= 1) — a
  // plain frontend operational window over the same myTasks() pool, not a
  // separate dataset or a configured SLA rule.
  protected readonly recentlyAssignedTasks = computed(() => this.myTasks().filter((t) => assignedDaysAgo(t) <= 1));

  // Which task list the shared table/toolbar reads from, based on the
  // active tab. Tabs not implemented yet fall through to the placeholder
  // branch in the template rather than reaching this at all.
  protected readonly baseTasks = computed(() => {
    switch (this.activeTab()) {
      case 'overdue':
        return this.overdueTasks();
      case 'due-today':
        return this.dueTodayTasks();
      case 'high-priority':
        return this.highPriorityTasks();
      case 'returned':
        return this.returnedTasks();
      case 'recently-assigned':
        return this.recentlyAssignedTasks();
      case 'my-tasks':
      default:
        return this.myTasks();
    }
  });

  // --- Phase 8 — Smart Sorting ---
  // Global sort, applied on top of whichever tab/filters are active —
  // reordering never changes which applications appear, only the order,
  // so it can't break a tab's meaning (e.g. Overdue Reviews stays every
  // overdue task and only that, just orderable by how overdue/critical).
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly sortKey = signal<SortKey>('urgency');
  protected readonly sortDirection = signal<SortDirection>('asc');

  protected readonly activeSortTooltip = computed(
    () => this.sortOptions.find((o) => o.key === this.sortKey())?.tooltip,
  );

  setSortKey(key: SortKey): void {
    this.sortKey.set(key);
  }

  toggleSortDirection(): void {
    this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  protected readonly quickViews = QUICK_VIEWS;

  applyQuickView(view: QuickView): void {
    this.setTab(view.tab);
    this.sortKey.set(view.sort);
    this.sortDirection.set('asc');
    this.searchTerm.set('');
    this.stageFilter.set('all');
    this.priorityFilter.set('all');
  }

  // Quick filter, Overdue tab only — how badly the SLA was missed, not
  // business priority (see overdueSeverity()'s own doc comment).
  protected readonly overdueSeverityFilter = signal<'all' | OverdueSeverity>('all');

  // --- Phase 11 — Clear Filters ---
  // Resets what narrows the result set (search/stage/priority/severity),
  // not the active tab or sort — those are view/ordering choices, not
  // filters, and clearing them on top would be surprising ("Clear
  // Filters" quietly also changing which queue you're looking at).
  protected readonly hasActiveFilters = computed(
    () =>
      this.searchTerm().trim() !== '' ||
      this.stageFilter() !== 'all' ||
      this.priorityFilter() !== 'all' ||
      (this.activeTab() === 'overdue' && this.overdueSeverityFilter() !== 'all'),
  );

  clearFilters(): void {
    this.searchTerm.set('');
    this.stageFilter.set('all');
    this.priorityFilter.set('all');
    this.overdueSeverityFilter.set('all');
  }

  protected readonly filteredTasks = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const stage = this.stageFilter();
    const priority = this.priorityFilter();
    const severity = this.overdueSeverityFilter();
    const onOverdueTab = this.activeTab() === 'overdue';
    // Phase 11 — Quick Search now also matches Permit Type and Project
    // Location, not just Application No./Applicant — every field searched
    // is a real column already shown in the table, nothing invented.
    const filtered = this.baseTasks().filter(
      (t) =>
        (!term ||
          t.id.toLowerCase().includes(term) ||
          t.applicant.toLowerCase().includes(term) ||
          t.permitType.toLowerCase().includes(term) ||
          t.location.toLowerCase().includes(term)) &&
        (stage === 'all' || t.currentStage === stage) &&
        (priority === 'all' || t.priority === priority) &&
        (!onOverdueTab || severity === 'all' || overdueSeverity(t) === severity),
    );
    return sortTasks(filtered, this.sortKey(), this.sortDirection());
  });

  // --- Phase 9 — Bulk Actions ---
  // Export is the only bulk action implemented here. It's the sole
  // candidate that passed the gate: an equivalent individual/bulk action
  // already exists and is already role-unrestricted elsewhere in the
  // tenant portal (tenant-applications.ts exportRows(), tenant-evaluations,
  // tenant-payments, tenants — always a toast-only mock, never a real
  // file), and it's safe for any task regardless of role or workflow
  // stage. Bulk Assign/Reassign/Forward/Archive/Print were all considered
  // and rejected: no working individual "reassign" or "forward to next
  // stage" action exists anywhere in the app to generalize from; Assign
  // only exists for *unassigned* applications on a different page/dataset
  // (every WorkQueueTask already has an assignedOfficer, so it doesn't
  // apply here); Archive/Print exist only for other roles (records/
  // releasing) on other entities. Building bulk versions of those would
  // mean inventing workflow behavior that doesn't exist today.
  protected readonly selectedIds = signal<Set<string>>(new Set());

  protected readonly allVisibleSelected = computed(() => {
    const visible = this.filteredTasks();
    if (visible.length === 0) return false;
    const selected = this.selectedIds();
    return visible.every((t) => selected.has(t.id));
  });

  toggleSelectAllVisible(): void {
    const visible = this.filteredTasks();
    const allSelected = this.allVisibleSelected();
    this.selectedIds.update((set) => {
      const next = new Set(set);
      for (const t of visible) {
        if (allSelected) next.delete(t.id);
        else next.add(t.id);
      }
      return next;
    });
  }

  toggleSelectRow(id: string): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isRowSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // Toast-only mock, mirroring exportRows() elsewhere in the tenant portal
  // exactly — no real file is generated anywhere in this codebase.
  exportSelected(): void {
    const count = this.selectedIds().size;
    if (count === 0) return;
    this.toast.show(`${count} application${count === 1 ? '' : 's'} exported.`);
    this.clearSelection();
  }

  // Column visibility for the shared table — "Officer" is redundant on My
  // Assigned Tasks for an individual evaluator (it's always them), but the
  // Overdue tab shows it for everyone, per the brief's explicit field list.
  protected readonly showOfficerColumn = computed(
    () =>
      this.isSupervisor() ||
      this.activeTab() === 'overdue' ||
      this.activeTab() === 'high-priority' ||
      this.activeTab() === 'returned',
  );
  protected readonly showSeverityColumn = computed(() => this.activeTab() === 'overdue');
  protected readonly showDueTodayColumn = computed(() => this.activeTab() === 'due-today');
  protected readonly showReasonColumn = computed(() => this.activeTab() === 'high-priority');

  // Phase 6 — Returned Applications isn't on an active SLA clock and isn't
  // department/priority-scoped the way the other tabs are; it swaps those
  // four columns out for the five return-specific ones instead of just
  // appending, since none of them apply while an application is paused
  // awaiting the applicant.
  protected readonly showDepartmentColumn = computed(() => this.activeTab() !== 'returned');
  protected readonly showAssignedColumn = computed(() => this.activeTab() !== 'returned');
  protected readonly showSlaColumn = computed(() => this.activeTab() !== 'returned');
  protected readonly showPriorityColumn = computed(() => this.activeTab() !== 'returned');
  protected readonly showReturnColumns = computed(() => this.activeTab() === 'returned');

  protected readonly emptyColspan = computed(
    () =>
      8 + // 7 base columns + 1 for the Phase 9 selection checkbox column
      (this.showOfficerColumn() ? 1 : 0) +
      (this.showDepartmentColumn() ? 1 : 0) +
      (this.showAssignedColumn() ? 1 : 0) +
      (this.showSlaColumn() ? 1 : 0) +
      (this.showSeverityColumn() ? 1 : 0) +
      (this.showDueTodayColumn() ? 1 : 0) +
      (this.showReasonColumn() ? 1 : 0) +
      (this.showPriorityColumn() ? 1 : 0) +
      (this.showReturnColumns() ? 5 : 0),
  );

  protected readonly stageLabel = STAGE_LABEL;
  protected readonly priorityTier = priorityTier;
  protected readonly priorityLabel = priorityLabel;
  protected readonly slaChipLabel = slaChipLabel;
  protected readonly overdueSeverity = overdueSeverity;
  protected readonly overdueSeverityTier = overdueSeverityTier;
  protected readonly overdueSeverityLabel = overdueSeverityLabel;
  protected readonly dueTodayCountdownLabel = dueTodayCountdownLabel;
  protected readonly dueTodayUrgency = dueTodayUrgency;
  protected readonly dueTodayUrgencyTier = dueTodayUrgencyTier;
  protected readonly dueTodayUrgencyLabel = dueTodayUrgencyLabel;
  protected readonly applicantResponseLabel = applicantResponseLabel;
  protected readonly applicantResponseTier = applicantResponseTier;
  protected readonly recentAssignmentBadge = recentAssignmentBadge;
  protected readonly recentAssignmentLabel = recentAssignmentLabel;

  setOverdueSeverityFilter(severity: 'all' | OverdueSeverity): void {
    this.overdueSeverityFilter.set(severity);
  }

  // --- View Timeline — a lightweight modal built from the task's own
  // fields (assigned date → current stage → SLA due date). There's no
  // per-record deep timeline dataset behind these new mock ids, so this
  // shows what's honestly known rather than fabricating history that
  // doesn't exist. ---
  protected readonly timelineTask = signal<WorkQueueTask | null>(null);

  viewTimeline(task: WorkQueueTask): void {
    this.timelineTask.set(task);
  }

  closeTimeline(): void {
    this.timelineTask.set(null);
  }
}
