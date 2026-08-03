export type EvalTypeKey = 'initial' | 'zoning' | 'fire' | 'obo' | 'final';
export type Stage = 'pending-review' | 'under-review' | 'returned' | 'passed';
export type RowStatus = 'Approved' | 'Pending' | 'Return for Revision';

export interface EvalTypeCard {
  key: EvalTypeKey;
  title: string;
  description: string;
  count: number;
  icon: string;
  accent: string;
  tint: string;
  solid?: boolean;
}

export interface EvalRow {
  id: string;
  applicant: string;
  missingDocuments: number;
  type: string;
  dateSubmitted: string;
  officer: string;
  status: RowStatus;
  stage: Stage;
  evalType: EvalTypeKey;
}

const EVAL_TYPE_META: Record<
  EvalTypeKey,
  { title: string; description: string; icon: string; accent: string; tint: string; solid?: boolean; officer: string }
> = {
  initial: {
    title: 'Initial Evaluation',
    description: 'Review and process building permit applications.',
    icon: 'file-check',
    accent: '#d97706',
    tint: '#fdf1e3',
    officer: 'Engr. Doe',
  },
  zoning: {
    title: 'Zoning Evaluation',
    description: 'A local authority review for compliance with zoning and building regulations.',
    icon: 'map',
    accent: '#2563eb',
    tint: '#e8f1ff',
    officer: 'Denese Martin',
  },
  fire: {
    title: 'Fire Safety Evaluation',
    description: "An assessment of a building's compliance with fire safety standards.",
    icon: 'shield',
    accent: '#dc2626',
    tint: '#fdecec',
    officer: 'Raul Villa',
  },
  obo: {
    title: 'OBO Evaluation',
    description: 'An OBO review for fire and building code compliance.',
    icon: 'building',
    accent: '#374151',
    tint: '#eef0f4',
    officer: 'Engr. Maria Santos',
  },
  final: {
    title: 'Final Evaluation',
    description: 'A final sign-off confirming the application is ready for permit release.',
    icon: 'check-circle',
    accent: '#16a34a',
    tint: '#16a34a',
    solid: true,
    officer: 'Engr. Maria Santos',
  },
};

const EVAL_TYPE_ORDER: EvalTypeKey[] = ['initial', 'zoning', 'fire', 'obo', 'final'];
const STAGES: Stage[] = ['pending-review', 'under-review', 'returned', 'passed'];

const BASE: Array<{
  id: string;
  applicant: string;
  missingDocuments: number;
  type: string;
  dateSubmitted: string;
}> = [
  { id: '#WA-2026', applicant: 'Raul Villa', missingDocuments: 2, type: 'Residential', dateSubmitted: '12 Apr 2024' },
  { id: '#WA-2025', applicant: 'Fea Sims', missingDocuments: 1, type: 'Commercial', dateSubmitted: '24 Apr 2024' },
  { id: '#WA-2024', applicant: 'David Roderick', missingDocuments: 2, type: 'Renovation', dateSubmitted: '25 Apr 2024' },
  { id: '#WA-2023', applicant: 'James Zavel', missingDocuments: 1, type: 'Renovation', dateSubmitted: '14 Dec 2024' },
  { id: '#WA-2022', applicant: 'Denese Martin', missingDocuments: 1, type: 'Renovation', dateSubmitted: '14 Jan 2024' },
  { id: '#WA-2021', applicant: 'Jack Nunnally', missingDocuments: 1, type: 'Renovation', dateSubmitted: '2 Dec 2024' },
  { id: '#WA-2020', applicant: 'James Zavel', missingDocuments: 3, type: 'Residential', dateSubmitted: '14 Dec 2024' },
  { id: '#WA-2019', applicant: 'Anthony Williams', missingDocuments: 2, type: 'Commercial', dateSubmitted: '1 Jul 2024' },
  { id: '#WA-2018', applicant: 'Axie Barnes', missingDocuments: 2, type: 'Commercial', dateSubmitted: '28 Aug 2024' },
  { id: '#WA-2017', applicant: 'Glen Morning', missingDocuments: 1, type: 'Commercial', dateSubmitted: '30 Aug 2024' },
];

// Status is derived from stage (not stored independently) so a row's badge
// never contradicts the stage tab it's filed under — e.g. an application
// filed under "Pending Review" can no longer show an "Approved" badge.
const STAGE_STATUS: Record<Stage, RowStatus> = {
  'pending-review': 'Pending',
  'under-review': 'Pending',
  returned: 'Return for Revision',
  passed: 'Approved',
};

// Each of the five evaluation-type cards used to render the exact same
// EVAL_ROWS regardless of which card was opened — the type only changed the
// heading. EVAL_ROWS is now built per evalType (offsetting the stage cycle
// per type so the tabs don't all land on identical counts either), so
// switching cards actually changes what's in the table.
export const EVAL_ROWS: EvalRow[] = EVAL_TYPE_ORDER.flatMap((evalType, typeIndex) =>
  BASE.map((r, i) => {
    const stage = STAGES[(i + typeIndex) % STAGES.length];
    return {
      ...r,
      officer: EVAL_TYPE_META[evalType].officer,
      stage,
      status: STAGE_STATUS[stage],
      evalType,
    };
  }),
);

export const EVAL_TYPE_CARDS: EvalTypeCard[] = EVAL_TYPE_ORDER.map((key) => ({
  key,
  ...EVAL_TYPE_META[key],
  count: EVAL_ROWS.filter((r) => r.evalType === key).length,
}));

export function ringStatsFor(evalType: EvalTypeKey): { label: string; value: string; color: string; light: string; pct: number }[] {
  const rows = EVAL_ROWS.filter((r) => r.evalType === evalType);
  const total = rows.length;
  const pending = rows.filter((r) => r.stage === 'pending-review' || r.stage === 'under-review').length;
  const returned = rows.filter((r) => r.stage === 'returned').length;
  const approved = rows.filter((r) => r.stage === 'passed').length;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
  return [
    { label: 'Total Applications', value: String(total), color: '#2563eb', light: '#dbeafe', pct: 100 },
    { label: 'Return for Revision', value: String(returned), color: '#991b1b', light: '#fdeceb', pct: pct(returned) },
    { label: 'Pending Review', value: String(pending), color: '#f59e0b', light: '#fef3c7', pct: pct(pending) },
    { label: 'Approved', value: String(approved), color: '#16a34a', light: '#dcfce7', pct: pct(approved) },
  ];
}

export const STAGE_TABS: { key: Stage; label: string; icon: string }[] = [
  { key: 'pending-review', label: 'Pending Review', icon: 'alert-circle' },
  { key: 'under-review', label: 'Under Review', icon: 'eye' },
  { key: 'returned', label: 'Returned', icon: 'alert-triangle' },
  { key: 'passed', label: 'Passed', icon: 'check-circle' },
];

export interface ReviewChecklistItem {
  label: string;
  filename: string;
  status: 'Approved' | 'Pending' | 'Missing';
}

// A representative checklist used to mock out the "Review" modal — every
// row shows the same example set since the app has no per-row document
// data on this page.
export const MOCK_REVIEW_CHECKLIST: ReviewChecklistItem[] = [
  { label: 'Site Development Plan', filename: 'Site_Dev.pdf', status: 'Approved' },
  { label: 'Building Plans', filename: 'Buildingplans.pdf', status: 'Approved' },
  { label: 'Proof of Ownership', filename: 'Landtitle.pdf', status: 'Pending' },
  { label: 'Barangay Clearance', filename: 'BarangayClearance.pdf', status: 'Missing' },
];
