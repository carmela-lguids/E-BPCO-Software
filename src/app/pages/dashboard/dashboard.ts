import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Topbar } from '../../shared/topbar/topbar';
import { StatCard, StatDelta } from '../../shared/stat-card/stat-card';
import { Icon } from '../../shared/icon/icon';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { StackedBarChart } from '../../shared/stacked-bar-chart/stacked-bar-chart';
import { BarList, BarListRow } from '../../shared/bar-list/bar-list';
import { AreaChart } from '../../shared/area-chart/area-chart';
import { Avatar } from '../../shared/avatar/avatar';
import { Pagination } from '../../shared/pagination/pagination';
import { buildPermitQueueRows } from '../../shared/permit-queue/permit-queue';
import { RoleGate } from '../../core/role-gate.directive';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { STAGE_STATS, StageStat, isBottleneck } from '../../shared/workflow-monitor/stage-summary-data';
import { DEPARTMENT_WORKLOAD, DepartmentWorkloadRow } from '../../shared/workflow-monitor/department-workload-data';
import {
  staffSummaryByLgu,
  activeUsers,
  activityRoster,
  AvailabilityStatus,
  StaffAvailabilityRow,
} from '../../core/staff-availability-data';
import { Notifications } from '../../core/notifications';
import { ROLES, EVALUATOR_ROLES, RoleKey } from '../../core/roles';
import {
  LGU_PERFORMANCE,
  LguPerformanceRow,
  complianceTier,
  complianceLabel,
  performanceStatusLabel,
  performanceTierPillClass,
  trendStateLabel,
} from '../../core/lgu-performance-data';
import {
  SYSTEM_HEALTH_CHECKS,
  SystemHealthStatus,
  overallSystemStatus,
  statusTier,
  statusLabel,
} from '../../core/system-health-data';

// Phase 2 KPI card shape — supersedes the old ad hoc statCards array, which
// mixed platform-admin concerns (Total Tenants, Total Users) with reporting
// numbers that overlapped this KPI grid's own definitions (Total
// Applications, Applications In Process/Approved). Kept local to this file
// rather than shared, matching this codebase's existing per-page mock-data
// convention (see TenantApplication below, duplicated rather than shared
// with tenant-dashboard's near-identical ApplicationRow).
interface KpiCardData {
  icon: string;
  iconBg: string;
  tint: string;
  label: string;
  value: string;
  deltas: StatDelta[];
  footnote?: string;
  /** Existing route this KPI drills into — omitted where no real
   *  destination page exists yet, per "don't create dead buttons." */
  route?: string;
  /** Full accessible sentence — value, trend, and comparison periods,
   *  since the visual deltas don't read as a complete sentence on their
   *  own. Includes the drill-down hint when `route` is set. */
  ariaLabel: string;
}

interface TenantApplication {
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
// same page (Phase 3, Phase 6) — no dead buttons.
interface QuickAction {
  icon: string;
  label: string;
  description: string;
  route?: string;
  scrollTargetId?: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    Topbar,
    StatCard,
    Icon,
    DonutChart,
    StackedBarChart,
    BarList,
    AreaChart,
    Avatar,
    Pagination,
    FormsModule,
    RoleGate,
    RouterLink,
    EmptyState,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  // --- Executive Command Center shell (Phase 1: filters only, no widgets
  // read these yet — later phases wire actual data to them). ---
  protected readonly dateRange = signal<DateRangeKey>('month');
  protected readonly lguFilter = signal<string>('all');

  // Phase 2 — Live KPI Dashboard (Tier 1). Structured mock data, internally
  // consistent: Pending + Under Review + Approved + Rejected = Total
  // Applications (742 + 1,318 + 2,840 + 314 = 5,214); Released Permits is a
  // subset of Approved, not an additional bucket. "Under Review" follows the
  // brief's definition — assigned to Initial Evaluation, Zoning, Fire
  // Safety, or OBO Review and actively being processed — as distinct from
  // "Pending" (submitted, not yet assigned to any department).
  protected readonly kpiCards: KpiCardData[] = [
    {
      icon: 'logs',
      iconBg: '#2563eb',
      tint: 'tint-blue',
      label: 'Total Applications',
      value: '5,214',
      footnote: 'All LGUs, all time',
      deltas: [
        { text: '+3.1% vs yesterday', direction: 'up', tone: 'good' },
        { text: '+18.6% vs last month', direction: 'up', tone: 'good' },
      ],
      ariaLabel: 'Total Applications: 5,214. Up 3.1 percent versus yesterday, up 18.6 percent versus last month.',
    },
    {
      icon: 'alert-circle',
      iconBg: '#f59e0b',
      tint: 'tint-neutral',
      label: 'Pending Applications',
      value: '742',
      footnote: 'Submitted, not yet assigned',
      deltas: [
        { text: '+8.4% vs yesterday', direction: 'up', tone: 'bad' },
        { text: '-2.1% vs last month', direction: 'down', tone: 'good' },
      ],
      ariaLabel: 'Pending Applications: 742. Up 8.4 percent versus yesterday, down 2.1 percent versus last month.',
    },
    {
      icon: 'workflow',
      iconBg: '#2563eb',
      tint: 'tint-blue',
      label: 'Under Review',
      value: '1,318',
      footnote: 'Initial Eval, Zoning, Fire Safety, OBO Review',
      route: '/workflow',
      deltas: [
        { text: '+1.9% vs yesterday', direction: 'up', tone: 'good' },
        { text: '+6.0% vs last month', direction: 'up', tone: 'good' },
      ],
      ariaLabel:
        'Under Review: 1,318. Up 1.9 percent versus yesterday, up 6 percent versus last month. View the workflow monitor.',
    },
    {
      icon: 'check-circle',
      iconBg: '#16a34a',
      tint: 'tint-green',
      label: 'Approved Applications',
      value: '2,840',
      deltas: [
        { text: '+1.2% vs yesterday', direction: 'up', tone: 'good' },
        { text: '+9.4% vs last month', direction: 'up', tone: 'good' },
      ],
      ariaLabel: 'Approved Applications: 2,840. Up 1.2 percent versus yesterday, up 9.4 percent versus last month.',
    },
    {
      icon: 'alert-triangle',
      iconBg: '#dc2626',
      tint: 'tint-red',
      label: 'Rejected Applications',
      value: '314',
      deltas: [
        { text: '-0.6% vs yesterday', direction: 'down', tone: 'good' },
        { text: '+3.1% vs last month', direction: 'up', tone: 'bad' },
      ],
      ariaLabel: 'Rejected Applications: 314. Down 0.6 percent versus yesterday, up 3.1 percent versus last month.',
    },
    {
      icon: 'file-check',
      iconBg: '#16a34a',
      tint: 'tint-green',
      label: 'Released Permits',
      value: '2,102',
      footnote: 'Subset of Approved',
      deltas: [
        { text: '+2.0% vs yesterday', direction: 'up', tone: 'good' },
        { text: '+11.3% vs last month', direction: 'up', tone: 'good' },
      ],
      ariaLabel: 'Released Permits: 2,102. Up 2 percent versus yesterday, up 11.3 percent versus last month.',
    },
    {
      icon: 'calendar',
      iconBg: '#7c3aed',
      tint: 'tint-purple',
      label: "Today's Applications",
      value: '46',
      deltas: [
        { text: '+4 vs yesterday', direction: 'up', tone: 'good' },
        { text: '+9.5% vs 30-day avg', direction: 'up', tone: 'good' },
      ],
      ariaLabel: "Today's Applications: 46. Up 4 versus yesterday, up 9.5 percent versus the 30-day average.",
    },
    {
      icon: 'user-check',
      iconBg: '#7c3aed',
      tint: 'tint-purple',
      label: 'Active Users',
      value: '142',
      route: '/security/dashboard',
      deltas: [
        { text: '+5.1% vs yesterday', direction: 'up', tone: 'good' },
        { text: '-1.8% vs last month', direction: 'down', tone: 'bad' },
      ],
      ariaLabel:
        'Active Users: 142. Up 5.1 percent versus yesterday, down 1.8 percent versus last month. View session monitoring.',
    },
    {
      icon: 'building',
      iconBg: '#2563eb',
      tint: 'tint-blue',
      label: 'Active LGUs',
      value: '28',
      footnote: '28 of 30 onboarded LGUs',
      route: '/tenants',
      deltas: [
        { text: '28 Active', direction: 'up', tone: 'good' },
        { text: '2 Inactive', direction: 'up', tone: 'bad' },
      ],
      ariaLabel: 'Active LGUs: 28 of 30 onboarded. 2 inactive. View tenants.',
    },
  ];

  // --- Phase 3 — Alert Band + SLA Monitoring ---
  // Bottleneck detection reuses the existing Workflow Monitor's own
  // STAGE_STATS + isBottleneck() rather than a second calculation — the
  // same stage data already backs /workflow and /tenant/workflow.
  protected readonly stageStats = STAGE_STATS;
  protected readonly bottleneckedStages = STAGE_STATS.filter(isBottleneck);
  protected readonly avgProcessingDays = (
    STAGE_STATS.reduce((sum, s) => sum + s.avgDwellDays, 0) / STAGE_STATS.length
  ).toFixed(1);

  // No named-application rows nationally — there's no cross-LGU application
  // list page to drill into (applications only exist under /tenant/...), so
  // the national SLA summary stays aggregate rather than inventing
  // per-application rows with nowhere to click through to. These are
  // structured prototype operational targets, not derived legal SLA
  // durations.
  protected readonly slaOverdueCount: number = 47;
  protected readonly slaDueTodayCount: number = 63;
  protected readonly slaNearDeadlineCount: number = 118;

  // A bare href="#some-id" resolves against <base href="/"> (see
  // index.html), not the current path — the browser sends it to "/" and the
  // router's empty-path route redirects to /login. Intercept the click and
  // scroll manually instead of relying on native fragment resolution.
  // Shared by every in-page "jump to section" link on this dashboard
  // (SLA Monitoring, and Quick Actions' "Review Critical Incidents").
  protected scrollToSection(id: string, event: Event): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  // Reuses the same DEPARTMENT_WORKLOAD (built on STAGE_STATS) shown on the
  // Tenant Command Center, matching the existing precedent that STAGE_STATS
  // itself is already shared identically between /workflow and
  // /tenant/workflow rather than split by scope.
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
  // Super Admin sees an aggregated-by-LGU summary, not a national roster —
  // reads from the same mock account data as the Tenant Command Center's
  // per-person list, just rolled up. Only the LGUs with real mock records
  // (Esperanza, Manila, Cebu — the same three TENANT_STATUS tracks) appear;
  // this widget doesn't fabricate staff counts for the other "onboarded"
  // LGUs the KPI grid's Active LGUs card refers to.
  protected readonly lguStaffSummary = staffSummaryByLgu();

  // --- Phase 6 — Recent Incidents + System Health ---
  // Filters the existing Notifications service rather than a second feed.
  // National scope = system/security-type notifications only (platform-wide
  // operational/security events) — the tenant-scoped workflow notifications
  // (assignment/payment/evaluation/...) belong on the Tenant Command Center
  // instead, not here.
  protected readonly notifications = inject(Notifications);

  protected readonly recentIncidents = computed(() =>
    this.notifications.forCurrentRole().filter((n) => n.type === 'system' || n.type === 'security'),
  );

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

  // --- Phase 7 — LGU Performance Ranking (Super Administrator only) ---
  // Extends the existing data-table conventions (status-pill, table-wrap,
  // the same view-modal pattern already used below for Recent Tenants)
  // rather than a bespoke leaderboard component.
  protected readonly lguPerformance = LGU_PERFORMANCE;

  protected readonly lguSearchTerm = signal('');
  protected readonly lguTierFilter = signal<'all' | 'approved' | 'pending' | 'rejected'>('all');
  protected readonly lguSortKey = signal<keyof LguPerformanceRow>('rank');
  protected readonly lguSortDir = signal<'asc' | 'desc'>('asc');
  protected readonly lguPage = signal(1);
  protected readonly lguPageSize = 5;

  // Reuses the existing header "LGU" filter (Phase 1 shell) as an
  // additional narrowing condition on the ranking table, rather than
  // leaving it purely decorative. The header "Date range" filter is NOT
  // wired here — the mock dataset has no per-period history to filter by,
  // and fabricating one would misrepresent static prototype figures as
  // real time-series data.
  protected readonly lguFilteredSorted = computed(() => {
    const term = this.lguSearchTerm().trim().toLowerCase();
    const tier = this.lguTierFilter();
    const scopedLgu = this.lguFilter();
    const filtered = this.lguPerformance.filter(
      (r) =>
        (!term || r.name.toLowerCase().includes(term)) &&
        (tier === 'all' || complianceTier(r.slaCompliancePct) === tier) &&
        (scopedLgu === 'all' || r.name === scopedLgu),
    );
    const key = this.lguSortKey();
    const dir = this.lguSortDir() === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  });

  protected readonly lguPaged = computed(() => {
    const start = (this.lguPage() - 1) * this.lguPageSize;
    return this.lguFilteredSorted().slice(start, start + this.lguPageSize);
  });

  onLguSearchChange(): void {
    this.lguPage.set(1);
  }

  onLguFilterChange(): void {
    this.lguPage.set(1);
  }

  onLguHeaderFilterChange(): void {
    this.lguPage.set(1);
  }

  setLguSort(key: keyof LguPerformanceRow): void {
    if (this.lguSortKey() === key) {
      this.lguSortDir.set(this.lguSortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.lguSortKey.set(key);
      this.lguSortDir.set(key === 'rank' ? 'asc' : 'desc');
    }
    this.lguPage.set(1);
  }

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

  protected lguTrendLabel(row: LguPerformanceRow): string {
    return trendStateLabel(row.trend, row.trendPct);
  }

  protected lguTrendIcon(row: LguPerformanceRow): string {
    const label = this.lguTrendLabel(row);
    if (label === 'Stable') return 'trend-flat';
    return label === 'Improving' ? 'trend-up' : 'trend-down';
  }

  // Drives both a visible sort-direction chevron and aria-sort, so the
  // active sort column is clear visually and to assistive tech.
  protected lguSortAria(key: keyof LguPerformanceRow): 'ascending' | 'descending' | null {
    if (this.lguSortKey() !== key) return null;
    return this.lguSortDir() === 'asc' ? 'ascending' : 'descending';
  }

  // --- LGU row drill-down (view only — reuses the same modal markup
  // pattern as the Recent Tenants table below, not a new component) ---
  protected readonly selectedLguRow = signal<LguPerformanceRow | null>(null);

  viewLgu(row: LguPerformanceRow): void {
    this.selectedLguRow.set(row);
  }

  closeLguModal(): void {
    this.selectedLguRow.set(null);
  }

  // --- Phase 8 — Active Users — Prototype Activity ---
  // Reuses the same Phase 5 staff roster (staff-availability-data.ts),
  // broadened to available/busy/recently-active (activityRoster()) rather
  // than the narrower activeUsers() (available/busy only) used for the
  // headline count — so someone who stepped away recently is still visible
  // for operational awareness, distinguishable by their status badge. This
  // is simulated, session-derived frontend data, not a real presence feed —
  // every label here says so explicitly rather than implying live status.
  protected readonly activeUserRoster: StaffAvailabilityRow[] = activityRoster();

  protected readonly staffStatusFilter = signal<'all' | 'available' | 'busy' | 'recently-active'>('all');
  protected readonly staffLguFilter = signal<string>('all');
  protected readonly staffRoleFilter = signal<'all' | RoleKey>('all');
  protected readonly staffDeptFilter = signal<string>('all');

  // Filter option lists are derived from the roster itself, not a separate
  // hardcoded set — so a filter never offers a choice with zero possible
  // matches.
  protected readonly staffLguOptions = Array.from(
    new Set(this.activeUserRoster.map((r) => r.account.tenant).filter((t): t is string => !!t)),
  ).sort();

  protected readonly staffRoleOptions = Array.from(new Set(this.activeUserRoster.map((r) => r.account.role))).sort(
    (a, b) => ROLES[a].label.localeCompare(ROLES[b].label),
  );

  protected readonly staffDeptOptions = Array.from(new Set(this.activeUserRoster.map((r) => r.account.department))).sort();

  protected roleLabelFor(key: RoleKey): string {
    return ROLES[key].label;
  }

  protected readonly filteredActiveUsers = computed(() => {
    const status = this.staffStatusFilter();
    const lgu = this.staffLguFilter();
    const role = this.staffRoleFilter();
    const dept = this.staffDeptFilter();
    return this.activeUserRoster.filter(
      (r) =>
        (status === 'all' || r.availabilityStatus === status) &&
        (lgu === 'all' || r.account.tenant === lgu) &&
        (role === 'all' || r.account.role === role) &&
        (dept === 'all' || r.account.department === dept),
    );
  });

  // Recommended national summary (spec 8.1): breaks the roster down by what
  // an administrator actually needs to scan for — how many are live right
  // now vs. recently stepped away, how much of that is tenant leadership
  // vs. evaluators, and how many LGUs have any representation at all today.
  protected readonly staffActivitySummary = computed(() => {
    const roster = this.activeUserRoster;
    return {
      activeCount: activeUsers().length,
      recentlyActiveCount: roster.filter((r) => r.availabilityStatus === 'recently-active').length,
      tenantAdminsActiveCount: roster.filter((r) => r.account.role === 'tenant-admin').length,
      evaluatorsActiveCount: roster.filter((r) => EVALUATOR_ROLES.includes(r.account.role)).length,
      lgusWithActivityCount: new Set(roster.map((r) => r.account.tenant).filter(Boolean)).size,
    };
  });

  protected activityStatusLabel(status: AvailabilityStatus): string {
    switch (status) {
      case 'on-leave':
        return 'On Leave';
      case 'recently-active':
        return 'Recently Active';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

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

  // "Last active: Online now" is redundant — "Active now" reads cleaner,
  // matching the rest of the recency strings ("15m ago", "1h ago", ...)
  // which already read fine with a "Last active" prefix in the template.
  protected activityRecencyLabel(lastLogin: string): string {
    return lastLogin === 'Online now' ? 'Active now' : `Last active ${lastLogin}`;
  }

  // --- Phase 8 — Quick Actions ---
  // Every action routes to a page that already exists in app.routes.ts, or
  // scrolls to a section already built on this same dashboard (Phase 3/6) —
  // no dead buttons. None of these perform LGU evaluation work directly —
  // they all open a module or jump to a section already on this page.
  protected readonly quickActions: QuickAction[] = [
    { icon: 'plus', label: 'Create Tenant', description: 'Onboard a new LGU', route: '/tenants' },
    { icon: 'users', label: 'Manage Users', description: 'Roles and account access', route: '/user-roles' },
    { icon: 'trend-up', label: 'View Reports', description: 'Platform-wide reporting', route: '/reports' },
    { icon: 'logs', label: 'Open System Logs', description: 'Audit and activity trail', route: '/system-logs' },
    { icon: 'workflow', label: 'Open Workflow', description: 'National workflow monitor', route: '/workflow' },
    {
      icon: 'alert-triangle',
      label: 'Review Critical Incidents',
      description: 'Jump to Recent Incidents below',
      scrollTargetId: 'recent-incidents',
    },
  ];

  // One stacked bar per permit type — bar length is that permit's total
  // queue volume, and the fill is its own Pending/Approved/Rejected split.
  protected readonly permitQueueRows = buildPermitQueueRows();

  // Colors are the validated 4-slot categorical palette (dataviz skill
  // validate_palette.js: CVD separation + lightness band + chroma floor all
  // PASS) — info blue, success green, warning amber, and a 4th violet slot
  // for "Return" so it doesn't collide with the Pending/warning meaning.
  protected readonly statusSegments: DonutSegment[] = [
    { label: 'For Evaluation', value: 30, color: '#2563eb' },
    { label: 'Approved', value: 20, color: '#16a34a' },
    { label: 'Return', value: 20, color: '#7c3aed' },
    { label: 'Pending', value: 30, color: '#f59e0b' },
  ];

  protected readonly statusTotal = this.statusSegments.reduce((sum, s) => sum + s.value, 0);

  protected statusPercent(seg: DonutSegment): number {
    return Math.round((seg.value / this.statusTotal) * 100);
  }

  protected readonly tenantRows: BarListRow[] = [
    { name: 'Quezon LGU', value: 100 },
    { name: 'Taguig LGU', value: 80 },
    { name: 'Pasig LGU', value: 60 },
    { name: 'Pasay LGU', value: 49 },
    { name: 'Makati LGU', value: 15 },
    { name: 'Dasma LGU', value: 42 },
    { name: 'Bulacan LGU', value: 38 },
    { name: 'Paranaque LGU', value: 30 },
    { name: 'Pateros LGU', value: 22 },
    { name: 'Laguna LGU', value: 18 },
    { name: 'Antipolo LGU', value: 12 },
    { name: 'Cavite LGU', value: 9 },
  ];

  // Reuses the same LGU names already shown in the tenant bar-list rather
  // than inventing a second mock roster for the Command Center's LGU filter.
  protected readonly lguOptions = this.tenantRows.map((r) => r.name);

  protected readonly tenantPage = signal(1);
  protected readonly tenantPageSize = 5;

  protected readonly pagedTenantRows = computed(() => {
    const start = (this.tenantPage() - 1) * this.tenantPageSize;
    return this.tenantRows.slice(start, start + this.tenantPageSize);
  });

  protected readonly recentTenants = signal<TenantApplication[]>([
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

  // --- Recent tenants row actions (view / edit / delete) ---
  protected readonly tenantAppModal = signal<'view' | 'edit' | 'delete' | null>(null);
  protected readonly selectedTenantApp = signal<TenantApplication | null>(null);
  protected editTenantAppForm: TenantApplication = {
    id: '',
    applicant: '',
    location: '',
    type: '',
    dateSubmitted: '',
    officer: '',
    status: 'Pending',
  };

  viewTenantApp(row: TenantApplication): void {
    this.selectedTenantApp.set(row);
    this.tenantAppModal.set('view');
  }

  editTenantApp(row: TenantApplication): void {
    this.selectedTenantApp.set(row);
    this.editTenantAppForm = { ...row };
    this.tenantAppModal.set('edit');
  }

  deleteTenantApp(row: TenantApplication): void {
    this.selectedTenantApp.set(row);
    this.tenantAppModal.set('delete');
  }

  closeTenantAppModal(): void {
    this.tenantAppModal.set(null);
    this.selectedTenantApp.set(null);
  }

  saveTenantApp(): void {
    const original = this.selectedTenantApp();
    if (!original) return;
    const updated = { ...this.editTenantAppForm };
    this.recentTenants.update((list) => list.map((r) => (r === original ? updated : r)));
    this.closeTenantAppModal();
  }

  confirmDeleteTenantApp(): void {
    const original = this.selectedTenantApp();
    if (!original) return;
    this.recentTenants.update((list) => list.filter((r) => r !== original));
    this.closeTenantAppModal();
  }
}
