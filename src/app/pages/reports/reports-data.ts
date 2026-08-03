import { StackedBarRow } from '../../shared/stacked-bar-chart/stacked-bar-chart';
import { AreaSeriesInput } from '../../shared/area-chart/area-chart';
import { DonutSegment } from '../../shared/donut-chart/donut-chart';

export type ReportKey =
  | 'application-volume'
  | 'processing-time'
  | 'revenue'
  | 'inspection-outcomes'
  | 'staff-workload';

export type ChartKind = 'stacked-bar' | 'area' | 'donut';

export interface ReportDef {
  key: ReportKey;
  title: string;
  description: string;
  icon: string;
  chartKind: ChartKind;
}

export const REPORT_DEFS: ReportDef[] = [
  {
    key: 'application-volume',
    title: 'Application Volume',
    description: 'New applications received by permit type and status.',
    icon: 'file-check',
    chartKind: 'stacked-bar',
  },
  {
    key: 'processing-time',
    title: 'Processing Time',
    description: 'Average days from submission to decision, by month.',
    icon: 'trend-up',
    chartKind: 'area',
  },
  {
    key: 'revenue',
    title: 'Revenue',
    description: 'Fees collected from verified payments, by month.',
    icon: 'wallet',
    chartKind: 'area',
  },
  {
    key: 'inspection-outcomes',
    title: 'Inspection Outcomes',
    description: 'Share of inspections that passed, needed correction, or failed.',
    icon: 'clipboard-check',
    chartKind: 'donut',
  },
  {
    key: 'staff-workload',
    title: 'Staff Workload',
    description: 'Applications assigned per officer, by completion status.',
    icon: 'user-check',
    chartKind: 'stacked-bar',
  },
];

export const DATE_RANGES = ['This Month', 'Last Month', 'This Quarter', 'This Year'] as const;
export type DateRange = (typeof DATE_RANGES)[number];

export const REPORT_TENANTS = ['All Tenants', 'Esperanza', 'Manila', 'Cebu'] as const;

export interface SummaryRow {
  label: string;
  value: string;
}

export function applicationVolumeRows(): StackedBarRow[] {
  const defs: { label: string; approved: number; pending: number; rejected: number }[] = [
    { label: 'Residential', approved: 42, pending: 18, rejected: 6 },
    { label: 'Commercial', approved: 31, pending: 22, rejected: 9 },
    { label: 'Renovation', approved: 27, pending: 14, rejected: 4 },
  ];
  return defs.map((d) => ({
    label: d.label,
    total: d.approved + d.pending + d.rejected,
    tooltip: `${d.label}: ${d.approved} approved, ${d.pending} pending, ${d.rejected} rejected`,
    segments: [
      { label: 'Approved', value: d.approved, color: '#16a34a' },
      { label: 'Pending', value: d.pending, color: '#f59e0b' },
      { label: 'Rejected', value: d.rejected, color: '#dc2626' },
    ],
  }));
}

export function processingTimeSeries(): AreaSeriesInput[] {
  return [
    { name: 'Avg. Days to Decision', color: '#2563eb', values: [14, 13, 15, 12, 11, 10, 9, 11, 10, 9, 8, 9] },
  ];
}

export function revenueSeries(): AreaSeriesInput[] {
  return [
    {
      name: 'Fees Collected (₱000s)',
      color: '#16a34a',
      values: [180, 210, 195, 240, 260, 255, 300, 285, 310, 330, 320, 345],
    },
  ];
}

export function inspectionOutcomeSegments(): DonutSegment[] {
  return [
    { label: 'Passed', value: 68, color: '#16a34a' },
    { label: 'Needs Correction', value: 21, color: '#f59e0b' },
    { label: 'Failed', value: 11, color: '#dc2626' },
  ];
}

export function staffWorkloadRows(): StackedBarRow[] {
  const defs: { label: string; completed: number; inProgress: number }[] = [
    { label: 'Engr. Doe', completed: 24, inProgress: 5 },
    { label: 'Arch. Santos', completed: 19, inProgress: 8 },
    { label: 'Engr. Reyes', completed: 16, inProgress: 3 },
  ];
  return defs.map((d) => ({
    label: d.label,
    total: d.completed + d.inProgress,
    tooltip: `${d.label}: ${d.completed} completed, ${d.inProgress} in progress`,
    segments: [
      { label: 'Completed', value: d.completed, color: '#2563eb' },
      { label: 'In Progress', value: d.inProgress, color: '#cbd5f5' },
    ],
  }));
}

export function summaryFor(key: ReportKey): SummaryRow[] {
  switch (key) {
    case 'application-volume':
      return [
        { label: 'Total received', value: '173' },
        { label: 'Approved', value: '100' },
        { label: 'Pending', value: '54' },
        { label: 'Rejected', value: '19' },
      ];
    case 'processing-time':
      return [
        { label: 'Average this period', value: '9 days' },
        { label: 'Fastest stage', value: 'Zoning (2.1d avg)' },
        { label: 'Slowest stage', value: 'OBO Review (5.4d avg)' },
      ];
    case 'revenue':
      return [
        { label: 'Total collected', value: '₱3,230,000' },
        { label: 'vs. previous period', value: '+8.4%' },
        { label: 'Refunds issued', value: '₱42,000' },
      ];
    case 'inspection-outcomes':
      return [
        { label: 'Total inspections', value: '96' },
        { label: 'Pass rate', value: '68%' },
        { label: 'Re-inspections scheduled', value: '21' },
      ];
    case 'staff-workload':
      return [
        { label: 'Applications in queue', value: '75' },
        { label: 'Most loaded officer', value: 'Arch. Santos (27)' },
        { label: 'Least loaded officer', value: 'Engr. Reyes (19)' },
      ];
  }
}
