// Mock "live" stage load for the Workflow Monitor summary strip. Keyed to the
// same filter keys used by workflow-flows.ts so a stat and a flow filter are
// always the same thing under two views.
export interface StageStat {
  key: string;
  label: string;
  count: number;
  avgDwellDays: number;
  targetDays: number;
  oldestDays: number;
}

export const STAGE_STATS: StageStat[] = [
  { key: 'applicant', label: 'Applicant', count: 14, avgDwellDays: 1.5, targetDays: 2, oldestDays: 4 },
  { key: 'zoning', label: 'Zoning', count: 9, avgDwellDays: 3.8, targetDays: 3, oldestDays: 9 },
  { key: 'fire-safety', label: 'Fire Safety', count: 6, avgDwellDays: 2.1, targetDays: 3, oldestDays: 5 },
  { key: 'obo-review', label: 'OBO Review', count: 11, avgDwellDays: 5.4, targetDays: 4, oldestDays: 12 },
  { key: 'building-official', label: 'Building Official', count: 4, avgDwellDays: 1.8, targetDays: 2, oldestDays: 3 },
  { key: 'payment', label: 'Payment', count: 7, avgDwellDays: 1.2, targetDays: 1, oldestDays: 3 },
  { key: 'releasing', label: 'Releasing', count: 5, avgDwellDays: 0.8, targetDays: 1, oldestDays: 2 },
];

export function isBottleneck(stat: StageStat): boolean {
  return stat.avgDwellDays > stat.targetDays;
}
