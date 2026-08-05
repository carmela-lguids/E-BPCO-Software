import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Session } from '../../core/session';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { StatCard, StatDelta } from '../../shared/stat-card/stat-card';
import { StackedBarChart } from '../../shared/stacked-bar-chart/stacked-bar-chart';
import { HBarChart, HBarRow } from '../../shared/h-bar-chart/h-bar-chart';
import { buildPermitQueueRows } from '../../shared/permit-queue/permit-queue';
import { STAGE_STATS, StageStat, isBottleneck } from '../../shared/workflow-monitor/stage-summary-data';
import { DEPARTMENT_WORKLOAD, DepartmentWorkloadRow } from '../../shared/workflow-monitor/department-workload-data';
import { AvailabilityStatus, staffForTenant, activeUsersForTenant } from '../../core/staff-availability-data';
import { Notifications } from '../../core/notifications';
import {
  SYSTEM_HEALTH_CHECKS,
  SystemHealthStatus,
  overallSystemStatus,
  statusTier,
  statusLabel,
} from '../../core/system-health-data';
import { LGU_PERFORMANCE, nationalAverage, complianceTier, complianceLabel } from '../../core/lgu-performance-data';

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

export type DateRangeKey = 'today' | 'week' | 'month' | 'year' | 'custom';

// Phase 8 — Quick Actions. `route` and `scrollTargetId` are mutually
// exclusive per entry; every route named here already exists in
// app.routes.ts and every scrollTargetId already exists as an id on this
// same page (Phase 3, Phase 4) — no dead buttons.
interface QuickAction {
  icon: string;
  label: string;
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

  protected readonly pendingRows: HBarRow[] = [
    { label: 'Initial Evaluation', value: 130 },
    { label: 'Zoning Review', value: 340 },
    { label: 'Fire Review', value: 380 },
    { label: 'OBO Review', value: 270 },
    { label: 'Final Approval', value: 650 },
  ];

  // Phase 3 — SLA Monitoring, worst-offender first. Structured prototype
  // mock data — daysRemaining/slaDueDate are configurable operational
  // targets, not derived legal SLA durations.
  protected readonly slaWatchItems: SlaWatchItem[] = [
    {
      id: '#WA-2025',
      applicant: 'Fea Sims',
      currentStage: 'Zoning',
      assignedOfficer: 'Engr. Doe',
      slaDueDate: '30 Jul 2026',
      daysRemaining: -3,
      slaStatus: 'overdue',
    },
    {
      id: '#WA-2021',
      applicant: 'Jack Nunnally',
      currentStage: 'Fire Safety',
      assignedOfficer: 'Arch. Santos',
      slaDueDate: '01 Aug 2026',
      daysRemaining: -1,
      slaStatus: 'overdue',
    },
    {
      id: '#WA-2017',
      applicant: 'Glen Morning',
      currentStage: 'OBO Review',
      assignedOfficer: 'Engr. Reyes',
      slaDueDate: '03 Aug 2026',
      daysRemaining: 0,
      slaStatus: 'due-today',
    },
    {
      id: '#WA-2022',
      applicant: 'Denese Martin',
      currentStage: 'Zoning',
      assignedOfficer: 'Arch. Santos',
      slaDueDate: '05 Aug 2026',
      daysRemaining: 2,
      slaStatus: 'due-soon',
    },
    {
      id: '#WA-2019',
      applicant: 'Anthony Williams',
      currentStage: 'OBO Review',
      assignedOfficer: 'Arch. Santos',
      slaDueDate: '07 Aug 2026',
      daysRemaining: 4,
      slaStatus: 'due-soon',
    },
  ];

  protected slaChipLabel(item: SlaWatchItem): string {
    if (item.daysRemaining < 0) return `+${Math.abs(item.daysRemaining)}d overdue`;
    if (item.daysRemaining === 0) return 'Due today';
    return `${item.daysRemaining}d remaining`;
  }

  protected readonly slaOverdueCount = this.slaWatchItems.filter((i) => i.slaStatus === 'overdue').length;
  protected readonly slaDueTodayCount = this.slaWatchItems.filter((i) => i.slaStatus === 'due-today').length;

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
    if (status === 'on-leave') return 'On Leave';
    return status.charAt(0).toUpperCase() + status.slice(1);
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

  // --- Phase 8 — Active Users ---
  // A filtered view of the same Phase 5 staff roster (available/busy only),
  // scoped to this LGU via the same Session.activeTenant() used throughout
  // this page — not a second dataset.
  protected readonly activeUsersList = computed(() => activeUsersForTenant(this.session.activeTenant()));

  // --- Phase 8 — Quick Actions ---
  // Every action routes to a page that already exists in app.routes.ts —
  // no dead buttons.
  protected readonly quickActions: QuickAction[] = [
    { icon: 'user-check', label: 'Assign Applications', route: '/tenant/applications' },
    { icon: 'users', label: 'Manage Staff', route: '/tenant/users' },
    { icon: 'wallet', label: 'View Payments', route: '/tenant/payments' },
    { icon: 'file-check', label: 'View Permit Release', route: '/tenant/permit-release' },
    { icon: 'trend-up', label: 'View Reports', route: '/tenant/reports' },
    { icon: 'alert-triangle', label: 'Review Bottlenecks', route: '/tenant/workflow' },
  ];

  protected readonly applications = signal<ApplicationRow[]>([
    {
      id: '#WA-2026',
      applicant: 'Raul Villa',
      location: 'Taguig City',
      type: 'Residential',
      dateSubmitted: '12 Apr 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
    {
      id: '#WA-2025',
      applicant: 'Fea Sims',
      location: 'Quezon City',
      type: 'Commercial',
      dateSubmitted: '24 Apr 2024',
      officer: 'Engr. Doe',
      status: 'Pending',
    },
    {
      id: '#WA-2024',
      applicant: 'David Roderick',
      location: 'Pasig City',
      type: 'Renovation',
      dateSubmitted: '25 Apr 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
    {
      id: '#WA-2023',
      applicant: 'James Zavel',
      location: 'Pasay City',
      type: 'Renovation',
      dateSubmitted: '14 Dec 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
    {
      id: '#WA-2022',
      applicant: 'Denese Martin',
      location: 'Makati City',
      type: 'Renovation',
      dateSubmitted: '14 Jan 2024',
      officer: 'Engr. Doe',
      status: 'Rejected',
    },
    {
      id: '#WA-2021',
      applicant: 'Jack Nunnally',
      location: 'Paranaque City',
      type: 'Renovation',
      dateSubmitted: '2 Dec 2024',
      officer: 'Engr. Doe',
      status: 'Pending',
    },
    {
      id: '#WA-2020',
      applicant: 'James Zavel',
      location: 'Bulacan City',
      type: 'Residential',
      dateSubmitted: '14 Dec 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
  ]);

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
