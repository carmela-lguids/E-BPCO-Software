import { RoleKey } from '../../core/roles';
import { CANONICAL_APPLICATIONS, CANONICAL_TENANT_ID } from '../../core/application-data';
import { CanonicalApplication } from '../../core/application-model';
// Aliased — this file already has its own local STAGE_ORDER (a plain
// WorkQueueStage[] used for sort ranking, further below), a different
// concept from applications-data.ts's canonical { key, label } sequence.
import { STAGE_ORDER as APP_STAGE_ORDER } from '../tenant-applications/applications-data';
import {
  QueuePriority,
  QueueSlaStatus,
  WorkQueueStage,
  EscalationReason,
  ApplicantResponseStatus,
  AssignmentType,
  WORK_QUEUE_TASK_SEED,
} from './work-queue-seed';

// Phase 12 — Tenant Isolation Audit finding: every WorkQueueTask below
// belongs to this one LGU (every assignedOfficer is an Esperanza account).
// WorkQueueTask itself carries no tenant/LGU field. That's fine as long as
// callers gate by tenant before calling tasksForRole() — a role key alone
// isn't unique across LGUs (e.g. Ana Garcia in Manila and Mark Lopez in
// Cebu hold 'zoning'/'cashier' too), so without that gate a non-Esperanza
// account would see Esperanza's tasks relabeled as their own. See
// tenant-work-queue.ts's myTasks().
//
// Phase 5 — points at the canonical tenant identity (core/application-
// data.ts) instead of a second, independently-hardcoded 'Esperanza'
// literal, so this gate and the canonical dataset's own tenant.tenantId
// can never silently drift apart.
export const WORK_QUEUE_TENANT = CANONICAL_TENANT_ID;

export type { QueuePriority, QueueSlaStatus, WorkQueueStage, EscalationReason, ApplicantResponseStatus, AssignmentType };

// Phase 26 — Current Status Consistency. Previously an independent label
// set ('Initial Evaluation'/'Zoning Review'/'Payment Verification'/'Permit
// Release'...) that had drifted from Applications' own canonical stage
// labels (STAGE_ORDER, applications-data.ts) — the same workflow.stage
// value read two different ways depending which page you were on (e.g.
// Work Queue's "Current Stage" column said "Payment Verification" while
// Applications' progress tracker for the same stage said "Payment").
// Derived from STAGE_ORDER for every key AppStage and WorkQueueStage
// share. 'inspection' has no AppStage equivalent at all (Work Queue's own
// doc comment: it covers Inspector/Cashier/Releasing lanes AppStage
// doesn't model) so it's the one label that stays independently defined,
// not a drift case.
function canonicalStageLabel(key: WorkQueueStage): string {
  return APP_STAGE_ORDER.find((s) => s.key === key)?.label ?? key;
}

export const STAGE_LABEL: Record<WorkQueueStage, string> = {
  applicant: canonicalStageLabel('applicant'),
  zoning: canonicalStageLabel('zoning'),
  'fire-safety': canonicalStageLabel('fire-safety'),
  'obo-review': canonicalStageLabel('obo-review'),
  inspection: 'Site Inspection',
  payment: canonicalStageLabel('payment'),
  releasing: canonicalStageLabel('releasing'),
};

// Local alias so this file doesn't need a hard dependency on evaluations-
// data.ts's EvalTypeKey just for a string-literal union already fully
// determined by WorkQueueStage below.
type EvalTypeKeyLike = 'initial' | 'zoning' | 'fire' | 'obo' | 'final';

// Phase 2 (Connect Work Queue Actions) — the evaluation type a task's
// current stage owns, mirroring tenant-evaluations.ts's own
// EVAL_TYPE_OWNED_STAGE in reverse. Only the 4 evaluation-relevant stages
// resolve to one; 'inspection'/'payment'/'releasing' have their own pages
// (Inspections/Payments/Permit Release) and are never mid-evaluation, so
// "Continue Evaluation" has nothing to open for a task at one of those
// stages — see canContinueEvaluation()/evalTypeForStage() below.
const STAGE_EVAL_TYPE: Partial<Record<WorkQueueStage, EvalTypeKeyLike>> = {
  applicant: 'initial',
  zoning: 'zoning',
  'fire-safety': 'fire',
  'obo-review': 'obo',
};

export function evalTypeForStage(stage: WorkQueueStage): EvalTypeKeyLike | null {
  return STAGE_EVAL_TYPE[stage] ?? null;
}

export function canContinueEvaluation(stage: WorkQueueStage): boolean {
  return evalTypeForStage(stage) !== null;
}

// Phase 16 — Smart Work Queue Canonical Integration. WorkQueueTask now
// carries an explicit applicationId, and every field that used to be an
// independent literal (applicant/permitType/location/currentStage/
// assignedOfficer/assignedRole/department/assignedDate/slaDueDate/status)
// is now DERIVED from that application's canonical record — see
// buildWorkQueueTasks() below. `id` is kept (not renamed to a separate
// `taskId`) since every helper function in this file, the component, and
// the template already key off `task.id`; for these 35 promoted
// applications id and applicationId are always the same value; keeping
// both make the relationship explicit without touching any of that
// existing code.
export interface WorkQueueTask {
  id: string;
  applicationId: string;
  applicant: string;
  permitType: string;
  location: string;
  currentStage: WorkQueueStage;
  assignedRole: RoleKey;
  assignedOfficer: string;
  department: string;
  assignedDate: string;
  slaDueDate: string;
  daysRemaining: number;
  slaStatus: QueueSlaStatus;
  priority: QueuePriority;
  status: 'Approved' | 'Pending' | 'Rejected';
  isNew: boolean;
  isUnread: boolean;
  /** Phase 4 — Due Today. Day-level daysRemaining (0) isn't granular enough
   *  for "requires action today" — only set when slaStatus === 'due-today'. */
  dueTodayMinutesRemaining?: number;
  /** Phase 5 — High Priority Queue. Why this task was escalated to critical
   *  priority — only set when priority === 'critical'. */
  escalationReason?: EscalationReason;
  /** Phase 6 — Returned Applications. Set only when the task has been
   *  returned to the applicant for compliance (isReturned === true); the
   *  five fields below travel together and are only meaningful as a group. */
  isReturned?: boolean;
  returnReason?: string;
  returnedBy?: string;
  dateReturned?: string;
  applicantResponseStatus?: ApplicantResponseStatus;
  returnedCount?: number;
  /** Phase 7 — Recently Assigned. Absent (defaults to a plain new
   *  assignment) for the rest of the roster; 'reassigned' only travels
   *  with the two fields below, which are only meaningful as a group. */
  assignmentType?: AssignmentType;
  previousEvaluator?: string;
  reassignedDate?: string;
}

// Fields that genuinely belong to the Work Queue view rather than to the
// application itself (SLA countdown, unread/new badges, escalation,
// return-tracking, reassignment-tracking) — kept separate from
// CanonicalApplication so other modules (Payments, Permit Release,
// Evaluations) never have to carry queue-triage concepts they don't need.
// daysRemaining specifically has no canonical home either: processingTarget
// only stores dueDate (a display string) and slaStatus, not a raw day
// count, and this mock dataset has no reliable notion of "today" to
// recompute it from dueDate — see UNASSIGNED_DAYS's identical caveat in
// applications-data.ts.
interface QueueTaskMeta {
  applicationId: string;
  daysRemaining: number;
  priority: QueuePriority;
  isNew: boolean;
  isUnread: boolean;
  dueTodayMinutesRemaining?: number;
  escalationReason?: EscalationReason;
  isReturned?: boolean;
  returnReason?: string;
  returnedBy?: string;
  dateReturned?: string;
  applicantResponseStatus?: ApplicantResponseStatus;
  returnedCount?: number;
  assignmentType?: AssignmentType;
  previousEvaluator?: string;
  reassignedDate?: string;
}

const QUEUE_TASK_META: QueueTaskMeta[] = WORK_QUEUE_TASK_SEED.map((t) => ({
  applicationId: t.id,
  daysRemaining: t.daysRemaining,
  priority: t.priority,
  isNew: t.isNew,
  isUnread: t.isUnread,
  dueTodayMinutesRemaining: t.dueTodayMinutesRemaining,
  escalationReason: t.escalationReason,
  isReturned: t.isReturned,
  returnReason: t.returnReason,
  returnedBy: t.returnedBy,
  dateReturned: t.dateReturned,
  applicantResponseStatus: t.applicantResponseStatus,
  returnedCount: t.returnedCount,
  assignmentType: t.assignmentType,
  previousEvaluator: t.previousEvaluator,
  reassignedDate: t.reassignedDate,
}));

const WORK_QUEUE_STAGE_KEYS = new Set<string>([
  'applicant',
  'zoning',
  'fire-safety',
  'obo-review',
  'inspection',
  'payment',
  'releasing',
]);
function toWorkQueueStage(stage: string): WorkQueueStage {
  return WORK_QUEUE_STAGE_KEYS.has(stage) ? (stage as WorkQueueStage) : 'applicant';
}

const TASK_STATUSES = new Set<string>(['Approved', 'Pending', 'Rejected']);
function toTaskStatus(status: string): 'Approved' | 'Pending' | 'Rejected' {
  return TASK_STATUSES.has(status) ? (status as 'Approved' | 'Pending' | 'Rejected') : 'Pending';
}

/** Builds the queue's task view by joining QUEUE_TASK_META (queue-specific
 *  metadata) onto whichever canonical applications are passed in — every
 *  business-state field (applicant/type/city/stage/assignment/status) comes
 *  from `apps`, not from a second independent literal. Order follows
 *  QUEUE_TASK_META (which mirrors the original seed's role-lane grouping);
 *  a meta entry whose application isn't present in `apps` (e.g. filtered
 *  out by tenant) is simply skipped rather than fabricated. */
export function buildWorkQueueTasks(apps: CanonicalApplication[]): WorkQueueTask[] {
  const byId = new Map(apps.map((a) => [a.applicationId, a]));
  return QUEUE_TASK_META.flatMap((meta) => {
    const app = byId.get(meta.applicationId);
    if (!app || !app.assignment.assignedRole) return [];
    return [
      {
        id: app.applicationId,
        applicationId: app.applicationId,
        applicant: app.applicant.fullName,
        permitType: app.project.type,
        location: app.property.city,
        currentStage: toWorkQueueStage(app.workflow.stage),
        assignedRole: app.assignment.assignedRole,
        assignedOfficer: app.assignment.assignedOfficer ?? '',
        department: app.assignment.department ?? '',
        assignedDate: app.assignment.assignedDate ?? '',
        slaDueDate: app.processingTarget?.dueDate ?? '',
        daysRemaining: meta.daysRemaining,
        slaStatus: app.processingTarget?.slaStatus ?? 'on-track',
        priority: meta.priority,
        status: toTaskStatus(app.workflow.status),
        isNew: meta.isNew,
        isUnread: meta.isUnread,
        dueTodayMinutesRemaining: meta.dueTodayMinutesRemaining,
        escalationReason: meta.escalationReason,
        isReturned: meta.isReturned,
        returnReason: meta.returnReason,
        returnedBy: meta.returnedBy,
        dateReturned: meta.dateReturned,
        applicantResponseStatus: meta.applicantResponseStatus,
        returnedCount: meta.returnedCount,
        assignmentType: meta.assignmentType,
        previousEvaluator: meta.previousEvaluator,
        reassignedDate: meta.reassignedDate,
      },
    ];
  });
}

/** Personal queue for one of the 7 "own queue" roles, filtered from an
 *  already-built task pool. Tenant Administrator uses that same pool
 *  directly (supervisory view), not this function. */
export function tasksForRole(tasks: WorkQueueTask[], role: RoleKey): WorkQueueTask[] {
  return tasks.filter((t) => t.assignedRole === role);
}

export function slaChipLabel(task: WorkQueueTask): string {
  if (task.daysRemaining < 0) return `+${Math.abs(task.daysRemaining)}d overdue`;
  if (task.daysRemaining === 0) return 'Due today';
  return `${task.daysRemaining}d remaining`;
}

// Same tier vocabulary as core/notifications.ts's severityTier() — maps
// straight onto the existing .status-pill modifier classes.
export function priorityTier(priority: QueuePriority): 'rejected' | 'pending' | 'info' {
  if (priority === 'critical') return 'rejected';
  if (priority === 'high') return 'pending';
  return 'info';
}

export function priorityLabel(priority: QueuePriority): string {
  if (priority === 'critical') return 'Critical';
  if (priority === 'high') return 'High';
  return 'Normal';
}

// --- Phase 3 — Overdue Reviews ---
// A distinct dimension from `priority` — priority is business importance
// (set at assignment); overdue severity is purely how badly the SLA has
// already been missed. A normal-priority task can still be badly overdue,
// and a critical-priority task can be freshly overdue. Only meaningful
// where slaStatus === 'overdue' (daysRemaining is negative).
export type OverdueSeverity = 'warning' | 'critical';

export function overdueSeverity(task: WorkQueueTask): OverdueSeverity {
  return Math.abs(task.daysRemaining) >= 3 ? 'critical' : 'warning';
}

export function overdueSeverityTier(severity: OverdueSeverity): 'rejected' | 'pending' {
  return severity === 'critical' ? 'rejected' : 'pending';
}

export function overdueSeverityLabel(severity: OverdueSeverity): string {
  return severity === 'critical' ? 'Critical' : 'Warning';
}

// --- Phase 4 — Due Today ---
// A distinct dimension from overdue severity — this is same-day urgency
// for tasks that have not yet breached SLA (slaStatus === 'due-today' only).
export function dueTodayCountdownLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
}

export type DueTodayUrgency = 'critical' | 'warning' | 'normal';

export function dueTodayUrgency(minutes: number): DueTodayUrgency {
  if (minutes < 60) return 'critical';
  if (minutes <= 180) return 'warning';
  return 'normal';
}

export function dueTodayUrgencyTier(urgency: DueTodayUrgency): 'rejected' | 'pending' | 'info' {
  if (urgency === 'critical') return 'rejected';
  if (urgency === 'warning') return 'pending';
  return 'info';
}

// Phase 12 — accessibility audit: the Time Remaining pill previously
// communicated urgency by color (+ a pulsing dot) alone, with the text
// being just a countdown. This makes the tier explicit in words too.
export function dueTodayUrgencyLabel(urgency: DueTodayUrgency): string {
  if (urgency === 'critical') return 'Urgent';
  if (urgency === 'warning') return 'Soon';
  return '';
}

// --- Phase 6 — Returned Applications ---
export function applicantResponseLabel(status: ApplicantResponseStatus): string {
  if (status === 'resubmitted') return 'Resubmitted';
  if (status === 'no-response') return 'No Response';
  return 'Awaiting Response';
}

// 'resubmitted' is good news (applicant acted) — 'no-response' is the one
// that needs follow-up; 'awaiting-response' is still within normal wait time.
export function applicantResponseTier(status: ApplicantResponseStatus): 'approved' | 'rejected' | 'pending' {
  if (status === 'resubmitted') return 'approved';
  if (status === 'no-response') return 'rejected';
  return 'pending';
}

// --- Phase 7 — Recently Assigned ---
// Derives a day-offset from the existing assignedDate display string
// ('Today' / 'Yesterday' / 'N days ago') rather than adding a parallel
// numeric field — assignedDate is the one place that recency already
// lives, this just makes it sortable/comparable. Unrecognized formats
// sort to the very end rather than crashing or floating to the top.
export function assignedDaysAgo(task: WorkQueueTask): number {
  const d = task.assignedDate;
  if (d === 'Today') return 0;
  if (d === 'Yesterday') return 1;
  const match = /^(\d+)\s+days?\s+ago$/.exec(d);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

// "Recently assigned" = assigned today or yesterday — a plain frontend
// operational window, not a configured SLA rule.
export function isRecentlyAssigned(task: WorkQueueTask): boolean {
  return assignedDaysAgo(task) <= 1;
}

export type RecentAssignmentBadge = 'new-today' | 'new-yesterday' | 'reassigned';

export function recentAssignmentBadge(task: WorkQueueTask): RecentAssignmentBadge | null {
  if (task.assignmentType === 'reassigned') return 'reassigned';
  const daysAgo = assignedDaysAgo(task);
  if (daysAgo === 0) return 'new-today';
  if (daysAgo === 1) return 'new-yesterday';
  return null;
}

export function recentAssignmentLabel(badge: RecentAssignmentBadge): string {
  if (badge === 'reassigned') return 'Reassigned';
  if (badge === 'new-today') return 'New Today';
  return 'New Yesterday';
}

// Lower rank = more urgent/higher priority, so ascending sort surfaces it first.
function priorityRank(priority: QueuePriority): number {
  if (priority === 'critical') return 0;
  if (priority === 'high') return 1;
  return 2;
}

// --- Phase 8 — Smart Sorting ---
// Global sort across every queue tab. This supersedes Phase 7's
// Recently-Assigned-only sort (newest/oldest/priority) — that was a
// narrower version of exactly this mechanism, and running two separate
// sort controls side by side would have been confusing rather than
// additive, so "Assignment Date" here is that same sort generalized
// across the whole queue instead of duplicated.
export type SortKey = 'urgency' | 'sla' | 'priority' | 'assigned-date' | 'applicant' | 'permit-type' | 'stage';
export type SortDirection = 'asc' | 'desc';

export interface SortOptionDef {
  key: SortKey;
  label: string;
  tooltip: string;
}

export const SORT_OPTIONS: SortOptionDef[] = [
  { key: 'urgency', label: 'Urgency', tooltip: 'Prioritizes overdue, due-today, and high-priority work.' },
  {
    key: 'sla',
    label: 'SLA / Processing Target',
    tooltip: 'Orders by SLA / processing target deadline — soonest or most overdue first.',
  },
  { key: 'priority', label: 'Priority', tooltip: 'Orders by assigned priority level.' },
  { key: 'assigned-date', label: 'Assignment Date', tooltip: 'Orders by when the application was assigned to you.' },
  { key: 'applicant', label: 'Applicant Name', tooltip: 'Orders alphabetically by applicant name.' },
  { key: 'permit-type', label: 'Permit Type', tooltip: 'Groups applications by permit type.' },
  { key: 'stage', label: 'Current Stage', tooltip: 'Orders by where the application is in the review workflow.' },
];

// Conceptual ordering only — a frontend operational heuristic to help an
// evaluator answer "what should I work on first" from data the queue
// already has, not an official DILG/government priority algorithm or
// SLA rule. Tiers, low (most urgent) to high:
//   0 Overdue + Critical Priority     4 High/Critical Priority (else)
//   1 Overdue (other priority)        5 Returned, applicant resubmitted
//   2 Due Today + High/Critical       6 Recently Assigned (today/yesterday)
//   3 Due Today (other priority)      7 Normal assigned tasks
// "Due Today + High/Critical" is read broadly (critical counts as at
// least as urgent as high) since the brief's own list only names "Due
// Today + High Priority" without saying where a due-today critical task
// should rank — treating it as at least that urgent is the safer default.
function urgencyRank(task: WorkQueueTask): number {
  if (task.slaStatus === 'overdue' && task.priority === 'critical') return 0;
  if (task.slaStatus === 'overdue') return 1;
  if (task.slaStatus === 'due-today' && (task.priority === 'high' || task.priority === 'critical')) return 2;
  if (task.slaStatus === 'due-today') return 3;
  if (task.priority === 'critical' || task.priority === 'high') return 4;
  if (task.isReturned && task.applicantResponseStatus === 'resubmitted') return 5;
  if (assignedDaysAgo(task) <= 1) return 6;
  return 7;
}

// The natural process order a permit application moves through — reused
// for "Current Stage" sorting instead of alphabetical, since workflow
// order is the more meaningful reading of "sort by stage."
const STAGE_ORDER: WorkQueueStage[] = [
  'applicant',
  'zoning',
  'fire-safety',
  'obo-review',
  'inspection',
  'payment',
  'releasing',
];

function stageRank(task: WorkQueueTask): number {
  const i = STAGE_ORDER.indexOf(task.currentStage);
  return i === -1 ? STAGE_ORDER.length : i;
}

function compareAscending(a: WorkQueueTask, b: WorkQueueTask, key: SortKey): number {
  switch (key) {
    case 'urgency':
      return urgencyRank(a) - urgencyRank(b);
    case 'sla':
      return a.daysRemaining - b.daysRemaining;
    case 'priority':
      return priorityRank(a.priority) - priorityRank(b.priority);
    case 'assigned-date':
      return assignedDaysAgo(a) - assignedDaysAgo(b);
    case 'applicant':
      return a.applicant.localeCompare(b.applicant);
    case 'permit-type':
      return a.permitType.localeCompare(b.permitType);
    case 'stage':
      return stageRank(a) - stageRank(b);
  }
}

// A fresh, sorted copy — never mutates the array passed in, so this is
// safe to call on a signal's underlying array without corrupting it.
// Direction is applied by flipping comparator argument order rather than
// reversing the sorted array afterward, so ties keep their original
// relative order in both directions (a genuinely stable sort either way).
export function sortTasks(tasks: WorkQueueTask[], key: SortKey, direction: SortDirection): WorkQueueTask[] {
  const sorted = [...tasks];
  sorted.sort((a, b) => (direction === 'asc' ? compareAscending(a, b, key) : compareAscending(b, a, key)));
  return sorted;
}

// --- Phase 10 — Queue Insights / Summary ---
// Workload awareness, not a performance dashboard: every number here is a
// plain count already derivable from data that exists elsewhere in this
// feature (or, for "Unassigned," from tenant-applications.ts, the one
// place that concept actually lives — WorkQueueTask has no unassigned
// state at all, every task already carries an assignedOfficer). Nothing
// here ranks, times, or scores an individual officer.

// "Unassigned" isn't tracked anywhere in work-queue-data.ts itself — every
// WorkQueueTask is, by construction, already assigned to someone. The one
// place an application can genuinely be unassigned is the canonical
// dataset (Tenant Applications' own Unassigned tab reads the same
// assignment.assignedOfficer === null state as of Phase 4) — reusing that
// real, existing count rather than inventing a fake one for this feature's
// own dataset.
export function unassignedApplicationsCount(): number {
  return CANONICAL_APPLICATIONS.filter((a) => a.assignment.assignedOfficer === null).length;
}

export interface DepartmentWorkloadStat {
  department: string;
  count: number;
}

// A plain per-department breakdown of the given task pool — grouping the
// same `department` field every row already carries, not a new dimension.
export function departmentWorkload(tasks: WorkQueueTask[]): DepartmentWorkloadStat[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    counts.set(t.department, (counts.get(t.department) ?? 0) + 1);
  }
  return Array.from(counts, ([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count);
}
