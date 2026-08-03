import { STAGE_STATS, StageStat, isBottleneck } from './stage-summary-data';

// Phase 4 — Department Workload. Extends the existing Workflow Monitor's
// STAGE_STATS with staffing/capacity fields rather than standing up a
// second mock dataset — count/avgDwellDays/targetDays/oldestDays are read
// straight from STAGE_STATS, so this widget and /workflow (and
// /tenant/workflow) can never disagree about what's actually bottlenecked.
//
// Only 6 of STAGE_STATS' 7 stages are shown here. "Building Official" is
// tracked by the Workflow Monitor but isn't one of the 6 departments this
// widget's brief names, so it's filtered out rather than force-fit in.
//
// assignedStaff/capacity/overdueCount are structured prototype mock
// numbers (not derived from any real staffing system) — reused as-is by
// both the Super Admin and Tenant Admin dashboards, the same way
// STAGE_STATS itself is already shown identically at both /workflow and
// /tenant/workflow.
export type WorkloadState = 'normal' | 'elevated' | 'critical';

interface DepartmentMeta {
  key: string;
  label: string;
  assignedStaff: number;
  capacity: number;
  overdueCount: number;
  trend: 'up' | 'down';
  trendLabel: string;
}

const DEPARTMENT_META: DepartmentMeta[] = [
  {
    key: 'applicant',
    label: 'Initial Evaluation',
    assignedStaff: 4,
    capacity: 20,
    overdueCount: 1,
    trend: 'down',
    trendLabel: '-2 this week',
  },
  {
    key: 'zoning',
    label: 'Zoning',
    assignedStaff: 3,
    capacity: 10,
    overdueCount: 4,
    trend: 'up',
    trendLabel: '+3 this week',
  },
  {
    key: 'fire-safety',
    label: 'Fire Safety',
    assignedStaff: 2,
    capacity: 10,
    overdueCount: 1,
    trend: 'down',
    trendLabel: '-1 this week',
  },
  {
    key: 'obo-review',
    label: 'OBO Review',
    assignedStaff: 3,
    capacity: 12,
    overdueCount: 5,
    trend: 'up',
    trendLabel: '+4 this week',
  },
  {
    key: 'payment',
    label: 'Cashier',
    assignedStaff: 2,
    capacity: 15,
    overdueCount: 2,
    trend: 'up',
    trendLabel: '+1 this week',
  },
  {
    key: 'releasing',
    label: 'Permit Release',
    assignedStaff: 2,
    capacity: 10,
    overdueCount: 0,
    trend: 'down',
    trendLabel: '-1 this week',
  },
];

export interface DepartmentWorkloadRow extends StageStat, DepartmentMeta {
  capacityPct: number;
  workloadState: WorkloadState;
}

// Bottleneck (STAGE_STATS' own signal) is the primary driver; capacity is a
// corroborating secondary signal, not a second bottleneck calculation.
function workloadStateFor(stat: StageStat, capacityPct: number): WorkloadState {
  const bottleneck = isBottleneck(stat);
  if (bottleneck && capacityPct >= 90) return 'critical';
  if (bottleneck || capacityPct >= 75) return 'elevated';
  return 'normal';
}

export const DEPARTMENT_WORKLOAD: DepartmentWorkloadRow[] = DEPARTMENT_META.map((meta) => {
  const stat = STAGE_STATS.find((s) => s.key === meta.key)!;
  const capacityPct = Math.round((stat.count / meta.capacity) * 100);
  return {
    ...stat,
    ...meta,
    capacityPct,
    workloadState: workloadStateFor(stat, capacityPct),
  };
});
