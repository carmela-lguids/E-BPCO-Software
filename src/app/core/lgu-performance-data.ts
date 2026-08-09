// Phase 7 — LGU Performance Ranking. Reuses the same 12 LGU names already
// shown in the Super Admin dashboard's own "Application By Tenants" bar
// list, plus Esperanza (the LGU the Tenant Command Center actually
// represents, per core/mock-accounts.ts) — so the ranking table and the
// Tenant Command Center's "this LGU vs. national average" scorecard are
// describing the same roster, not two parallel ones.
//
// totalApplications across all 13 rows sums to exactly 5,214 — the same
// "Total Applications" figure already shown as a national KPI card — and
// Esperanza's own row uses the exact figures already established for it
// (Total 1,824 / Released 738, from the Tenant Command Center's own KPI
// grid) rather than a second, contradicting set of numbers. The other
// metrics (approval rate, SLA compliance, processing time, etc.) are
// independent structured prototype figures, not reconciled to a second
// decimal — only the headline total is load-bearing enough elsewhere on
// the same page to insist on an exact match.
export interface LguPerformanceRow {
  name: string;
  totalApplications: number;
  approvalRate: number;
  avgProcessingDays: number;
  slaCompliancePct: number;
  releasedPermits: number;
  activeApplications: number;
  trend: 'up' | 'down';
  trendPct: number;
  performanceScore: number;
  rank: number;
}

type LguMeta = Omit<LguPerformanceRow, 'performanceScore' | 'rank'>;

const LGU_META: LguMeta[] = [
  { name: 'Quezon LGU', totalApplications: 714, approvalRate: 91, avgProcessingDays: 11.2, slaCompliancePct: 88, releasedPermits: 520, activeApplications: 93, trend: 'up', trendPct: 3.5 },
  { name: 'Taguig LGU', totalApplications: 571, approvalRate: 94, avgProcessingDays: 9.8, slaCompliancePct: 96, releasedPermits: 429, activeApplications: 57, trend: 'up', trendPct: 5.1 },
  { name: 'Pasig LGU', totalApplications: 428, approvalRate: 87, avgProcessingDays: 14.5, slaCompliancePct: 79, releasedPermits: 298, activeApplications: 64, trend: 'down', trendPct: 1.8 },
  { name: 'Pasay LGU', totalApplications: 350, approvalRate: 90, avgProcessingDays: 10.5, slaCompliancePct: 91, releasedPermits: 252, activeApplications: 42, trend: 'up', trendPct: 2.2 },
  { name: 'Makati LGU', totalApplications: 107, approvalRate: 96, avgProcessingDays: 8.1, slaCompliancePct: 98, releasedPermits: 82, activeApplications: 9, trend: 'up', trendPct: 6.0 },
  { name: 'Dasma LGU', totalApplications: 300, approvalRate: 82, avgProcessingDays: 16.8, slaCompliancePct: 71, releasedPermits: 197, activeApplications: 54, trend: 'down', trendPct: 3.4 },
  { name: 'Bulacan LGU', totalApplications: 271, approvalRate: 88, avgProcessingDays: 12.4, slaCompliancePct: 85, releasedPermits: 191, activeApplications: 38, trend: 'up', trendPct: 1.1 },
  { name: 'Paranaque LGU', totalApplications: 214, approvalRate: 93, avgProcessingDays: 9.6, slaCompliancePct: 92, releasedPermits: 159, activeApplications: 19, trend: 'up', trendPct: 2.9 },
  { name: 'Pateros LGU', totalApplications: 157, approvalRate: 85, avgProcessingDays: 13.9, slaCompliancePct: 80, releasedPermits: 107, activeApplications: 25, trend: 'down', trendPct: 0.5 },
  { name: 'Laguna LGU', totalApplications: 129, approvalRate: 91, avgProcessingDays: 11.0, slaCompliancePct: 89, releasedPermits: 93, activeApplications: 14, trend: 'up', trendPct: 1.7 },
  { name: 'Antipolo LGU', totalApplications: 86, approvalRate: 79, avgProcessingDays: 18.2, slaCompliancePct: 68, releasedPermits: 54, activeApplications: 17, trend: 'down', trendPct: 4.2 },
  { name: 'Cavite LGU', totalApplications: 63, approvalRate: 89, avgProcessingDays: 11.6, slaCompliancePct: 86, releasedPermits: 45, activeApplications: 8, trend: 'up', trendPct: 0.8 },
  // Esperanza's totalApplications/releasedPermits match the Tenant Command
  // Center's own KPI grid exactly (Phase 2) — not re-derived here.
  { name: 'Esperanza', totalApplications: 1824, approvalRate: 88, avgProcessingDays: 12.5, slaCompliancePct: 84, releasedPermits: 738, activeApplications: 780, trend: 'up', trendPct: 2.4 },
];

// A simple, transparent prototype formula — the average of approval rate
// and SLA compliance, both already 0-100 scales. Not a real weighted KPI
// model, just enough to produce a stable, explainable rank order.
function scoreFor(meta: LguMeta): number {
  return (meta.approvalRate + meta.slaCompliancePct) / 2;
}

export const LGU_PERFORMANCE: LguPerformanceRow[] = LGU_META.map((meta) => ({ ...meta, performanceScore: 0, rank: 0 }))
  .sort((a, b) => scoreFor(b) - scoreFor(a))
  .map((row, i) => ({ ...row, performanceScore: Math.round(scoreFor(row)), rank: i + 1 }));

export function complianceTier(pct: number): 'approved' | 'pending' | 'rejected' {
  if (pct >= 90) return 'approved';
  if (pct >= 75) return 'pending';
  return 'rejected';
}

export function complianceLabel(pct: number): string {
  if (pct >= 90) return 'Compliant';
  if (pct >= 75) return 'At Risk';
  return 'Non-Compliant';
}

// Overall performance-status labels for the ranking table — a plain-language
// read of `performanceScore` meant to help an administrator spot which LGUs
// may need operational support, not to rank them competitively. This is an
// E-BPCO prototype indicator (average of approval rate and SLA compliance),
// not an official DILG performance rating or scoring formula. Band cutoffs
// are illustrative only, chosen to spread the current 13-row mock dataset
// (scores ~74-97) across all four labels rather than clustering in one band.
export type PerformanceTier = 'strong' | 'on-track' | 'attention' | 'critical';

export function performanceTier(score: number): PerformanceTier {
  if (score >= 92) return 'strong';
  if (score >= 85) return 'on-track';
  if (score >= 78) return 'attention';
  return 'critical';
}

export function performanceStatusLabel(score: number): string {
  switch (performanceTier(score)) {
    case 'strong':
      return 'Strong Performance';
    case 'on-track':
      return 'On Track';
    case 'attention':
      return 'Needs Attention';
    case 'critical':
      return 'Critical Attention';
  }
}

// Reuses the same 4 status-pill tone classes already used across the app
// (approved/info/pending/rejected) instead of introducing a 5th color.
export function performanceTierPillClass(score: number): 'approved' | 'info' | 'pending' | 'rejected' {
  switch (performanceTier(score)) {
    case 'strong':
      return 'approved';
    case 'on-track':
      return 'info';
    case 'attention':
      return 'pending';
    case 'critical':
      return 'rejected';
  }
}

// Trend as a plain-language state rather than color/icon alone. A small
// magnitude (<1 percentage point) reads as "Stable" regardless of direction
// — the mock data's `trend` field only carries up/down, so the "flat" case
// is derived here from `trendPct`, not stored on the row.
export function trendStateLabel(trend: 'up' | 'down', trendPct: number): 'Improving' | 'Declining' | 'Stable' {
  if (trendPct < 1) return 'Stable';
  return trend === 'up' ? 'Improving' : 'Declining';
}

/** National average across every LGU in the ranking, including Esperanza —
 *  used by the Tenant Command Center's "this LGU vs. national average"
 *  scorecard. */
export function nationalAverage(): {
  approvalRate: number;
  slaCompliancePct: number;
  avgProcessingDays: number;
} {
  const n = LGU_PERFORMANCE.length;
  return {
    approvalRate: Math.round(LGU_PERFORMANCE.reduce((s, r) => s + r.approvalRate, 0) / n),
    slaCompliancePct: Math.round(LGU_PERFORMANCE.reduce((s, r) => s + r.slaCompliancePct, 0) / n),
    avgProcessingDays: Math.round((LGU_PERFORMANCE.reduce((s, r) => s + r.avgProcessingDays, 0) / n) * 10) / 10,
  };
}
