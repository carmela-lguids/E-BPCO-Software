import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Session } from '../../core/session';
import { RoleKey } from '../../core/roles';
import {
  WORK_QUEUE_TASKS,
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
  applicantResponseLabel,
  applicantResponseTier,
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

const STAGE_OPTIONS: { key: WorkQueueStage; label: string }[] = (
  Object.keys(STAGE_LABEL) as WorkQueueStage[]
).map((key) => ({ key, label: STAGE_LABEL[key] }));

@Component({
  selector: 'app-tenant-work-queue',
  imports: [Topbar, Icon, EmptyState, FormsModule, RouterLink],
  templateUrl: './tenant-work-queue.html',
  styleUrl: './tenant-work-queue.scss',
})
export class TenantWorkQueue {
  private readonly session = inject(Session);

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
  }

  protected readonly searchTerm = signal('');
  protected readonly stageFilter = signal<string>('all');
  protected readonly priorityFilter = signal<'all' | 'critical' | 'high' | 'normal'>('all');
  protected readonly stageOptions = STAGE_OPTIONS;

  // --- Phase 2 — My Assigned Tasks ---
  // Personal queue for the 7 "own queue" roles; the full pool for
  // tenant-admin's supervisory view. Not a new roster per role — filtered
  // straight from the one WORK_QUEUE_TASKS array (work-queue-data.ts).
  protected readonly myTasks = computed(() =>
    this.isSupervisor() ? WORK_QUEUE_TASKS : tasksForRole(this.session.currentRole()),
  );

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
      case 'my-tasks':
      default:
        return this.myTasks();
    }
  });

  // Quick filter, Overdue tab only — how badly the SLA was missed, not
  // business priority (see overdueSeverity()'s own doc comment).
  protected readonly overdueSeverityFilter = signal<'all' | OverdueSeverity>('all');

  protected readonly filteredTasks = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const stage = this.stageFilter();
    const priority = this.priorityFilter();
    const severity = this.overdueSeverityFilter();
    const onOverdueTab = this.activeTab() === 'overdue';
    return this.baseTasks().filter(
      (t) =>
        (!term || t.id.toLowerCase().includes(term) || t.applicant.toLowerCase().includes(term)) &&
        (stage === 'all' || t.currentStage === stage) &&
        (priority === 'all' || t.priority === priority) &&
        (!onOverdueTab || severity === 'all' || overdueSeverity(t) === severity),
    );
  });

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
      7 +
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
  protected readonly applicantResponseLabel = applicantResponseLabel;
  protected readonly applicantResponseTier = applicantResponseTier;

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
