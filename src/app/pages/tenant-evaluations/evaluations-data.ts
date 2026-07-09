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
}

export const EVAL_TYPE_CARDS: EvalTypeCard[] = [
  {
    key: 'initial',
    title: 'Initial Evaluation',
    description: 'Review and process building permit applications.',
    count: 750,
    icon: 'file-check',
    accent: '#d97706',
    tint: '#fdf1e3',
  },
  {
    key: 'zoning',
    title: 'Zoning Evaluation',
    description: 'A local authority review for compliance with zoning and building regulations.',
    count: 750,
    icon: 'map',
    accent: '#2563eb',
    tint: '#e8f1ff',
  },
  {
    key: 'fire',
    title: 'Fire Safety Evaluation',
    description: "An assessment of a building's compliance with fire safety standards.",
    count: 750,
    icon: 'shield',
    accent: '#dc2626',
    tint: '#fdecec',
  },
  {
    key: 'obo',
    title: 'OBO Evaluation',
    description: 'An OBO review for fire and building code compliance.',
    count: 750,
    icon: 'building',
    accent: '#374151',
    tint: '#eef0f4',
  },
  {
    key: 'final',
    title: 'Final Evaluation',
    description: 'An OBO review for fire and building code compliance.',
    count: 750,
    icon: 'check-circle',
    accent: '#16a34a',
    tint: '#16a34a',
    solid: true,
  },
];

const STAGES: Stage[] = ['pending-review', 'under-review', 'returned', 'passed'];

const BASE: Array<{
  id: string;
  applicant: string;
  missingDocuments: number;
  type: string;
  dateSubmitted: string;
  status: RowStatus;
}> = [
  { id: '#WA-2026', applicant: 'Raul Villa', missingDocuments: 2, type: 'Residential', dateSubmitted: '12 Apr 2024', status: 'Approved' },
  { id: '#WA-2025', applicant: 'Fea Sims', missingDocuments: 1, type: 'Commercial', dateSubmitted: '24 Apr 2024', status: 'Pending' },
  { id: '#WA-2024', applicant: 'David Roderick', missingDocuments: 2, type: 'Renovation', dateSubmitted: '25 Apr 2024', status: 'Approved' },
  { id: '#WA-2023', applicant: 'James Zavel', missingDocuments: 1, type: 'Renovation', dateSubmitted: '14 Dec 2024', status: 'Approved' },
  { id: '#WA-2022', applicant: 'Denese Martin', missingDocuments: 1, type: 'Renovation', dateSubmitted: '14 Jan 2024', status: 'Return for Revision' },
  { id: '#WA-2021', applicant: 'Jack Nunnally', missingDocuments: 1, type: 'Renovation', dateSubmitted: '2 Dec 2024', status: 'Pending' },
  { id: '#WA-2020', applicant: 'James Zavel', missingDocuments: 3, type: 'Residential', dateSubmitted: '14 Dec 2024', status: 'Approved' },
  { id: '#WA-2019', applicant: 'Anthony Williams', missingDocuments: 2, type: 'Commercial', dateSubmitted: '1 Jul 2024', status: 'Return for Revision' },
  { id: '#WA-2018', applicant: 'Axie Barnes', missingDocuments: 2, type: 'Commercial', dateSubmitted: '28 Aug 2024', status: 'Approved' },
  { id: '#WA-2017', applicant: 'Glen Morning', missingDocuments: 1, type: 'Commercial', dateSubmitted: '30 Aug 2024', status: 'Pending' },
];

export const EVAL_ROWS: EvalRow[] = BASE.map((r, i) => ({
  ...r,
  officer: 'Engr. Doe',
  stage: STAGES[i % STAGES.length],
}));

export const EVAL_RING_STATS = [
  { label: 'Total Applications', value: '1,749', color: '#3b82f6', light: '#dbe8fd', pct: 85 },
  { label: 'Return for Revision', value: '376', color: '#ef4444', light: '#fbdada', pct: 30 },
  { label: 'Pending Review', value: '524', color: '#f5c518', light: '#fdf1c7', pct: 45 },
  { label: 'Approved', value: '849', color: '#22c55e', light: '#d7f5df', pct: 75 },
];

export const STAGE_TABS: { key: Stage; label: string }[] = [
  { key: 'pending-review', label: 'Pending Review' },
  { key: 'under-review', label: 'Under Review' },
  { key: 'returned', label: 'Returned' },
  { key: 'passed', label: 'Passed' },
];
