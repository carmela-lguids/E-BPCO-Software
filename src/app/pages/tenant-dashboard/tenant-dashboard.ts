import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Session } from '../../core/session';
import { ApplicationStore } from '../../core/application-store';
import { CanonicalApplication } from '../../core/application-model';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { StatCard, StatDelta } from '../../shared/stat-card/stat-card';
import { StackedBarChart } from '../../shared/stacked-bar-chart/stacked-bar-chart';
import { HBarChart, HBarRow } from '../../shared/h-bar-chart/h-bar-chart';
import { buildPermitQueueRows } from '../../shared/permit-queue/permit-queue';
import { AppStage, STAGE_ORDER } from '../tenant-applications/applications-data';
import { buildWorkQueueTasks, sortTasks } from '../tenant-work-queue/work-queue-data';
import { STAGE_STATS, StageStat, isBottleneck } from '../../shared/workflow-monitor/stage-summary-data';
import { DEPARTMENT_WORKLOAD, DepartmentWorkloadRow } from '../../shared/workflow-monitor/department-workload-data';
import { AvailabilityStatus, staffForTenant, activityRosterForTenant } from '../../core/staff-availability-data';
import { Notifications } from '../../core/notifications';
import {
  SYSTEM_HEALTH_CHECKS,
  SystemHealthStatus,
  overallSystemStatus,
  statusTier,
  statusLabel,
} from '../../core/system-health-data';
import {
  LGU_PERFORMANCE,
  nationalAverage,
  complianceTier,
  complianceLabel,
  performanceStatusLabel,
  performanceTierPillClass,
} from '../../core/lgu-performance-data';

// Phase 2 KPI card shape — see dashboard.ts (Super Admin) for the matching
// definition; kept duplicated per this codebase's existing per-page
// mock-data convention rather than shared.
interface KpiCardData {
  icon: string;
  iconBg: string;
  tint: string;
  label: string;
  value: string;
  deltas: StatDelta[];
  footnote?: string;
  route?: string;
  ariaLabel: string;
}

// Phase 3 — SLA Monitoring row shape. Supersedes the old OverdueItem, which
// only modeled a subjective Low/Medium/High severity with no actual due
// date or countdown. slaStatus/daysRemaining/slaDueDate follow the brief's
// suggested mock fields directly.
type SlaStatus = 'due-soon' | 'due-today' | 'overdue';

interface SlaWatchItem {
  id: string;
  applicant: string;
  currentStage: string;
  assignedOfficer: string;
  slaDueDate: string;
  daysRemaining: number;
  slaStatus: SlaStatus;
}

interface ApplicationRow {
  id: string;
  applicant: string;
  location: string;
  type: string;
  dateSubmitted: string;
  officer: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

// Phase 18 — Recent Applications + Dashboard Consistency. This widget's 7
// rows used to be an independent hardcoded literal that had already
// partially drifted from the real application data (e.g. #WA-2026 showed
// officer: 'Engr. Doe'/status: 'Approved' here, while the real record has
// officer: ''/status: 'Pending' — found during Phase 11's audit). Now
// derived from ApplicationStore, tenant-scoped, capped to 7 to preserve
// this widget's existing footprint on the page (a "Recent Applications"
// preview, not the full Applications table) — same 7 canonical applications
// as before (#WA-2026 down to #WA-2020, canonical order), now with accurate
// field values instead of a second, independently-drifted copy.
const RECENT_APPLICATIONS_LIMIT = 7;

const APP_STATUSES = new Set<string>(['Approved', 'Pending', 'Rejected']);
function toDashboardStatus(status: string): 'Approved' | 'Pending' | 'Rejected' {
  return APP_STATUSES.has(status) ? (status as 'Approved' | 'Pending' | 'Rejected') : 'Pending';
}

function recentApplicationsFrom(apps: CanonicalApplication[]): ApplicationRow[] {
  return apps.slice(0, RECENT_APPLICATIONS_LIMIT).map((app) => ({
    id: app.applicationId,
    applicant: app.applicant.fullName,
    location: app.property.city,
    type: app.project.type,
    dateSubmitted: app.dateSubmitted,
    officer: app.assignment.assignedOfficer ?? '',
    status: toDashboardStatus(app.workflow.status),
  }));
}

// Phase 1 (Unify Workflow Stage Names) — mirrors work-queue-data.ts's own
// canonicalStageLabel(): 'inspection' has no Applications/Workflow Monitor
// equivalent (this widget only ever shows Building-Permit-track stages
// today), every other stage resolves through the same STAGE_ORDER every
// other "Current Stage" display already reads from.
function canonicalStageLabel(stage: string): string {
  if (stage === 'inspection') return 'Site Inspection';
  return STAGE_ORDER.find((s) => s.key === stage)?.label ?? stage;
}

export type DateRangeKey = 'today' | 'week' | 'month' | 'year' | 'custom';

// Phase 8 — Quick Actions. `route` and `scrollTargetId` are mutually
// exclusive per entry; every route named here already exists in
// app.routes.ts and every scrollTargetId already exists as an id on this
// same page (Phase 3, Phase 4) — no dead buttons.
interface QuickAction {
  icon: string;
  label: string;
  description: string;
  route?: string;
  scrollTargetId?: string;
}

@Component({
  selector: 'app-tenant-dashboard',
  imports: [Topbar, Icon, Avatar, StatCard, StackedBarChart, HBarChart, FormsModule, RouterLink, EmptyState],
  templateUrl: './tenant-dashboard.html',
  styleUrl: './tenant-dashboard.scss',
})
export class TenantDashboard {
  private readonly session = inject(Session);
  private readonly applicationStore = inject(ApplicationStore);

  // --- Executive Command Center shell (Phase 1: filter only; no LGU
  // filter here — a Tenant Administrator has exactly one LGU in scope). ---
  protected readonly dateRange = signal<DateRangeKey>('month');
  protected readonly lguName = computed(() => this.session.activeTenant() ?? 'Unassigned LGU');

  // Phase 2 — Live KPI Dashboard (Tier 1), scoped to this one LGU. Same
  // internal-consistency rule as the Super Admin set: Pending + Under
  // Review + Approved + Rejected = Total Applications
  // (268 + 512 + 926 + 118 = 1,824); Released Permits is a subset of
  // Approved. No "Active LGUs" card — a Tenant Administrator has exactly
  // one LGU in scope, so that KPI doesn't apply here.
  protected readonly kpiCards: KpiCardData[] = [
    {
      icon: 'logs',
      iconBg: '#2563eb',
      tint: 'tint-blue',
      label: 'Total Applications',
      value: '1,824',
      footnote: 'This LGU, all time',
      route: '/tenant/applications',
      deltas: [
        { text: '+2.4% vs yesterday', direction: 'up', tone: 'good' },
        { text: '+14.2% vs last month', direction: 'up', tone: 'good' },
      ],
      ariaLabel:
        'Total Applications: 1,824. Up 2.4 percent versus yesterday, up 14.2 percent versus last month. View applications.',
    },
    {
      icon: 'alert-circle',
      iconBg: '#f59e0b',
      tint: 'tint-neutral',
      label: 'Pending Applications',
      value: '268',
      footnote: 'Submitted, not yet assigned',
      route: '/tenant/applications',
      deltas: [
        { text: '+6.7% vs yesterday', direction: 'up', tone: 'bad' },
        { text: '-3.5% vs last month', direction: 'down', tone: 'good' },
      ],
      ariaLabel:
        'Pending Applications: 268. Up 6.7 percent versus yesterday, down 3.5 percent versus last month. View applications.',
    },
    {
      icon: 'workflow',
      iconBg: '#2563eb',
      tint: 'tint-blue',
      label: 'Under Review',
      value: '512',
      footnote: 'Initial Eval, Zoning, Fire Safety, OBO Review',
      route: '/tenant/workflow',
      deltas: [
        { text: '+2.2% vs yesterday', direction: 'up', tone: 'good' },
        { text: '+5.1% vs last month', direction: 'up', tone: 'good' },
      ],
      ariaLabel:
        'Under Review: 512. Up 2.2 percent versus yesterday, up 5.1 percent versus last month. View the workflow monitor.',
    },
    {
      icon: 'check-circle',
      iconBg: '#16a34a',
      tint: 'tint-green',
      label: 'Approved Applications',
      value: '926',
      route: '/tenant/applications',
      deltas: [
        { text: '+1.5% vs yesterday', direction: 'up', tone: 'good' },
        { text: '+8.0% vs last month', direction: 'up', tone: 'good' },
      ],
      ariaLabel:
        'Approved Applications: 926. Up 1.5 percent versus yesterday, up 8 percent versus last month. View applications.',
    },
    {
      icon: 'alert-triangle',
      iconBg: '#dc2626',
      tint: 'tint-red',
      label: 'Rejected Applications',
      value: '118',
      route: '/tenant/applications',
      deltas: [
        { text: '-1.1% vs yesterday', direction: 'down', tone: 'good' },
        { text: '+2.4% vs last month', direction: 'up', tone: 'bad' },
      ],
      ariaLabel:
        'Rejected Applications: 118. Down 1.1 percent versus yesterday, up 2.4 percent versus last month. View applications.',
    },
    {
      icon: 'file-check',
      iconBg: '#16a34a',
      tint: 'tint-green',
      label: 'Released Permits',
      value: '738',
      footnote: 'Subset of Approved',
      route: '/tenant/permit-release',
      deltas: [
        { text: '+3.0% vs yesterday', direction: 'up', tone: 'good' },
        { text: '+10.1% vs last month', direction: 'up', tone: 'good' },
      ],
      ariaLabel:
        'Released Permits: 738. Up 3 percent versus yesterday, up 10.1 percent versus last month. View permit release.',
    },
    {
      icon: 'calendar',
      iconBg: '#7c3aed',
      tint: 'tint-purple',
      label: "Today's Applications",
      value: '14',
      route: '/tenant/applications',
      deltas: [
        { text: '+2 vs yesterday', direction: 'up', tone: 'good' },
        { text: '+7.8% vs 30-day avg', direction: 'up', tone: 'good' },
      ],
      ariaLabel:
        "Today's Applications: 14. Up 2 versus yesterday, up 7.8 percent versus the 30-day average. View applications.",
    },
    {
      icon: 'user-check',
      iconBg: '#7c3aed',
      tint: 'tint-purple',
      label: 'Active Users',
      value: '22',
      deltas: [
        { text: '+3.2% vs yesterday', direction: 'up', tone: 'good' },
        { text: '-2.0% vs last month', direction: 'down', tone: 'bad' },
      ],
      ariaLabel: 'Active Users: 22. Up 3.2 percent versus yesterday, down 2 percent versus last month.',
    },
  ];

  // One stacked bar per permit type — bar length is that permit's total
  // queue volume, and the fill is its own Pending/Approved/Rejected split.
  protected readonly permitQueueRows = buildPermitQueueRows();

  // Phase 8 (Connect Operational Dashboards) — real per-stage application
  // counts for this LGU, replacing static sample numbers (130/340/380/270/
  // 650) that bore no relationship to Esperanza's actual ~45 Building
  // Permit applications. The 5 categories themselves are unchanged (this
  // widget's own existing "under review" breakdown, not the full pipeline
  // — payment/releasing/inspection were never shown here either); only the
  // counts now come from the canonical store.
  private readonly pendingStageLabels: { stage: AppStage; label: string }[] = [
    { stage: 'applicant', label: 'Initial Evaluation' },
    { stage: 'zoning', label: 'Zoning Review' },
    { stage: 'fire-safety', label: 'Fire Review' },
    { stage: 'obo-review', label: 'OBO Review' },
    { stage: 'building-official', label: 'Final Approval' },
  ];

  protected readonly pendingRows = computed<HBarRow[]>(() => {
    const apps = this.applicationStore
      .applicationsForTenant(this.session.activeTenant())
      .filter((a) => a.permitTrack === 'building-permit');
    return this.pendingStageLabels.map(({ stage, label }) => ({
      label,
      value: apps.filter((a) => a.workflow.stage === stage).length,
    }));
  });

  // The chart's fixed 700-ceiling scale was calibrated to the old static
  // sample data (max 650) — real counts for one LGU's ~45 applications are
  // far smaller, so the scale must follow the real data or every bar would
  // read as nearly empty.
  protected readonly pendingRowsMax = computed(() => {
    const max = Math.max(1, ...this.pendingRows().map((r) => r.value));
    return Math.ceil(max / 5) * 5 || 5;
  });

  protected readonly pendingRowsTicks = computed(() => {
    const max = this.pendingRowsMax();
    return [0, Math.round(max / 4), Math.round(max / 2), Math.round((max * 3) / 4), max];
  });

  // Phase 8 (Connect Operational Dashboards) — membership is now the same
  // live overdue/due-soon/due-today computation Work Queue's own Overdue
  // Reviews tab already uses (work-queue-data.ts's buildWorkQueueTasks,
  // whose slaStatus is derived from each canonical application's own
  // processingTarget), worst-offender first via that same module's
  // sortTasks('urgency') — not a fixed 5-application seed list. An
  // application with no real SLA tracking data defaults to slaStatus
  // 'on-track' there and is correctly filtered out below, never shown with
  // fabricated urgency it was never actually given.
  protected readonly slaWatchItems = computed<SlaWatchItem[]>(() => {
    const apps = this.applicationStore
      .applicationsForTenant(this.session.activeTenant())
      .filter((a) => a.permitTrack === 'building-permit');
    const overdueOrDueSoon = sortTasks(
      buildWorkQueueTasks(apps).filter((t) => t.slaStatus !== 'on-track'),
      'urgency',
      'asc',
    );
    return overdueOrDueSoon.slice(0, 5).map((t) => ({
      id: t.applicationId,
      applicant: t.applicant,
      currentStage: canonicalStageLabel(t.currentStage),
      assignedOfficer: t.assignedOfficer,
      slaDueDate: t.slaDueDate,
      daysRemaining: t.daysRemaining,
      slaStatus: t.slaStatus as SlaStatus,
    }));
  });

  protected slaChipLabel(item: SlaWatchItem): string {
    if (item.daysRemaining < 0) return `+${Math.abs(item.daysRemaining)}d overdue`;
    if (item.daysRemaining === 0) return 'Due today';
    return `${item.daysRemaining}d remaining`;
  }

  protected readonly slaOverdueCount = computed(() => this.slaWatchItems().filter((i) => i.slaStatus === 'overdue').length);
  protected readonly slaDueTodayCount = computed(() => this.slaWatchItems().filter((i) => i.slaStatus === 'due-today').length);

  // Bottleneck detection reuses the existing Workflow Monitor's own
  // STAGE_STATS + isBottleneck() rather than a second calculation.
  protected readonly stageStats = STAGE_STATS;
  protected readonly bottleneckedStages = STAGE_STATS.filter(isBottleneck);
  protected readonly avgProcessingDays = (
    STAGE_STATS.reduce((sum, s) => sum + s.avgDwellDays, 0) / STAGE_STATS.length
  ).toFixed(1);

  // A bare href="#sla-monitoring" resolves against <base href="/"> (see
  // index.html), not the current path — the browser sends it to "/" and the
  // router's empty-path route redirects to /login. Intercept the click and
  // scroll manually instead of relying on native fragment resolution.
  protected scrollToSlaMonitoring(event: Event): void {
    event.preventDefault();
    document.getElementById('sla-monitoring')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected complianceFor(stat: StageStat): number {
    return Math.round(Math.min(100, (stat.targetDays / stat.avgDwellDays) * 100));
  }

  protected complianceTier(stat: StageStat): 'approved' | 'pending' | 'rejected' {
    const pct = this.complianceFor(stat);
    if (pct >= 90) return 'approved';
    if (pct >= 75) return 'pending';
    return 'rejected';
  }

  protected complianceLabel(stat: StageStat): string {
    const pct = this.complianceFor(stat);
    if (pct >= 90) return 'Compliant';
    if (pct >= 75) return 'At Risk';
    return 'Non-Compliant';
  }

  // --- Phase 4 — Department Workload ---
  // Same DEPARTMENT_WORKLOAD as the Super Admin Command Center — see
  // dashboard.ts for why this is intentionally shared rather than split by
  // scope (mirrors the existing STAGE_STATS precedent).
  protected readonly departmentWorkload = DEPARTMENT_WORKLOAD;

  protected workloadTier(row: DepartmentWorkloadRow): 'approved' | 'pending' | 'rejected' {
    if (row.workloadState === 'critical') return 'rejected';
    if (row.workloadState === 'elevated') return 'pending';
    return 'approved';
  }

  protected workloadLabel(row: DepartmentWorkloadRow): string {
    if (row.workloadState === 'critical') return 'Critical';
    if (row.workloadState === 'elevated') return 'Elevated';
    return 'Normal';
  }

  // --- Phase 5 — Staff Availability ---
  // Reads from the existing mock account roster (core/mock-accounts.ts),
  // scoped to this LGU via the same Session.activeTenant() the header
  // badge already uses — not a separate staff list. This is simulated
  // presence, stated explicitly in the widget's own caption.
  protected readonly myStaff = computed(() => staffForTenant(this.session.activeTenant()));

  protected availabilityLabel(status: AvailabilityStatus): string {
    switch (status) {
      case 'on-leave':
        return 'On Leave';
      case 'recently-active':
        return 'Recently Active';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  // Phase 8 — status communicated via icon + text label, not color alone.
  protected activityStatusIcon(status: AvailabilityStatus): string {
    switch (status) {
      case 'available':
        return 'check-circle';
      case 'busy':
        return 'dots-horizontal';
      case 'recently-active':
        return 'clock';
      case 'on-leave':
        return 'calendar';
      default:
        return 'logout';
    }
  }

  // "Last active: Online now" is redundant — "Active now" reads cleaner.
  // Only used by the Active Users list, not Staff Availability (Phase 5),
  // which keeps its existing wording untouched.
  protected activityRecencyLabel(lastLogin: string): string {
    return lastLogin === 'Online now' ? 'Active now' : `Last active ${lastLogin}`;
  }

  // --- Phase 6 — Recent Incidents + System Health ---
  // Filters the existing Notifications service rather than a second feed.
  // Tenant scope = high/critical-priority notifications already targeted
  // at tenant-admin — the role filter (forCurrentRole) already keeps this
  // to this LGU's own workflow events, since that's how the mock account
  // roles are tagged.
  protected readonly notifications = inject(Notifications);

  protected readonly recentIncidents = computed(() =>
    this.notifications.forCurrentRole().filter((n) => n.priority === 'critical' || n.priority === 'high'),
  );

  // System Health is platform infrastructure, not LGU-specific — the same
  // simulated checks as the National Command Center, shown read-only here.
  protected readonly healthChecks = SYSTEM_HEALTH_CHECKS;
  protected readonly overallHealth = overallSystemStatus();
  protected readonly overallHealthTier = statusTier(this.overallHealth);
  protected readonly overallHealthLabel = statusLabel(this.overallHealth);

  protected healthTier(status: SystemHealthStatus): 'approved' | 'pending' | 'rejected' | 'info' {
    return statusTier(status);
  }

  protected healthLabel(status: SystemHealthStatus): string {
    return statusLabel(status);
  }

  // --- Phase 7 — This LGU vs. National Average ---
  // Tenant Administrators don't see the nationwide ranking table (Super
  // Admin only) — instead, a local scorecard comparing this LGU's own
  // figures against the average across every LGU in the same underlying
  // ranking dataset (core/lgu-performance-data.ts), so the two Command
  // Centers are reading the same numbers, not two independent ones.
  protected readonly myLguPerformance = computed(() =>
    LGU_PERFORMANCE.find((r) => r.name === this.session.activeTenant()),
  );
  protected readonly lguNationalAverage = nationalAverage();
  protected readonly lguCount = LGU_PERFORMANCE.length;

  protected lguComplianceTier(pct: number): 'approved' | 'pending' | 'rejected' {
    return complianceTier(pct);
  }

  protected lguComplianceLabel(pct: number): string {
    return complianceLabel(pct);
  }

  protected lguPerformanceLabel(score: number): string {
    return performanceStatusLabel(score);
  }

  protected lguPerformanceTierClass(score: number): 'approved' | 'info' | 'pending' | 'rejected' {
    return performanceTierPillClass(score);
  }

  // --- Phase 8 — Active Users — Prototype Activity ---
  // A broadened view of the same Phase 5 staff roster (available/busy/
  // recently-active), scoped to this LGU only via the same
  // Session.activeTenant() used throughout this page — never another
  // LGU's staff, and not a second dataset.
  protected readonly activeUsersList = computed(() => activityRosterForTenant(this.session.activeTenant()));

  // --- Phase 8 — Quick Actions ---
  // Every action routes to a page that already exists in app.routes.ts —
  // no dead buttons.
  protected readonly quickActions: QuickAction[] = [
    { icon: 'user-check', label: 'Assign Applications', description: 'Route new applications to staff', route: '/tenant/applications' },
    { icon: 'users', label: 'Manage Staff', description: 'Accounts and department roles', route: '/tenant/users' },
    { icon: 'wallet', label: 'View Payments', description: 'Payment verification queue', route: '/tenant/payments' },
    { icon: 'file-check', label: 'View Permit Release', description: 'Permits ready for release', route: '/tenant/permit-release' },
    { icon: 'trend-up', label: 'View Reports', description: 'This LGU’s reporting', route: '/tenant/reports' },
    { icon: 'alert-triangle', label: 'Review Bottlenecks', description: 'Workflow stages over target', route: '/tenant/workflow' },
  ];

  protected readonly applications = signal<ApplicationRow[]>(
    recentApplicationsFrom(this.applicationStore.applicationsForTenant(this.session.activeTenant())),
  );

  protected readonly searchTerm = signal('');

  protected readonly filteredApplications = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const rows = this.applications();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(term) ||
        r.applicant.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term),
    );
  });

  // --- Recent applications row actions (view / edit / delete) ---
  protected readonly appRowModal = signal<'view' | 'edit' | 'delete' | null>(null);
  protected readonly selectedAppRow = signal<ApplicationRow | null>(null);
  protected editAppRowForm: ApplicationRow = {
    id: '',
    applicant: '',
    location: '',
    type: '',
    dateSubmitted: '',
    officer: '',
    status: 'Pending',
  };

  viewAppRow(row: ApplicationRow): void {
    this.selectedAppRow.set(row);
    this.appRowModal.set('view');
  }

  editAppRow(row: ApplicationRow): void {
    this.selectedAppRow.set(row);
    this.editAppRowForm = { ...row };
    this.appRowModal.set('edit');
  }

  deleteAppRow(row: ApplicationRow): void {
    this.selectedAppRow.set(row);
    this.appRowModal.set('delete');
  }

  closeAppRowModal(): void {
    this.appRowModal.set(null);
    this.selectedAppRow.set(null);
  }

  saveAppRow(): void {
    const original = this.selectedAppRow();
    if (!original) return;
    const updated = { ...this.editAppRowForm };
    this.applications.update((list) => list.map((r) => (r === original ? updated : r)));
    this.closeAppRowModal();
  }

  confirmDeleteAppRow(): void {
    const original = this.selectedAppRow();
    if (!original) return;
    this.applications.update((list) => list.filter((r) => r !== original));
    this.closeAppRowModal();
  }
}
