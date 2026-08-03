export type AppStatus = 'Approved' | 'Pending' | 'Rejected';
export type EvalKey = 'initial' | 'zoning' | 'fire' | 'obo' | 'final';

// Matches the Workflow Monitor's own stage keys (shared/workflow-monitor/
// stage-summary-data.ts) so the per-application progress strip and the
// aggregate bottleneck view are describing the same pipeline.
export type AppStage =
  | 'applicant'
  | 'zoning'
  | 'fire-safety'
  | 'obo-review'
  | 'building-official'
  | 'payment'
  | 'releasing';

export const STAGE_ORDER: { key: AppStage; label: string }[] = [
  { key: 'applicant', label: 'Applicant' },
  { key: 'zoning', label: 'Zoning' },
  { key: 'fire-safety', label: 'Fire Safety' },
  { key: 'obo-review', label: 'OBO Review' },
  { key: 'building-official', label: 'Building Official' },
  { key: 'payment', label: 'Payment' },
  { key: 'releasing', label: 'Releasing' },
];

export interface AppRow {
  id: string;
  applicant: string;
  city: string;
  type: string;
  dateSubmitted: string;
  officer: string;
  status: AppStatus;
  currentStage: AppStage;
}

export interface DocumentItem {
  name: string;
  filename: string;
  uploadedDate: string;
  status: 'Approved' | 'Rejected' | 'Missing' | 'Pending';
  /** Set when this file is a resubmission, so the version trail is visible
   * instead of silently replacing the original with no history. */
  version?: number;
  previousUploadedDate?: string;
}

export interface CommentItem {
  author: string;
  timeAgo: string;
  text: string;
  depth: 0 | 1 | 2;
  thumbnails?: string[];
}

export interface TimelineItem {
  num: string;
  event: string;
  date: string;
  time: string;
  detail: string;
}

export interface EvalCard {
  key: EvalKey;
  title: string;
  statusLabel: string;
  statusTone: 'good' | 'progress';
  description: string;
  documents: number;
  comments: number;
  officerInitials: string[];
  progressPct: number;
}

export interface ChecklistItem {
  label: string;
  filename: string;
  status: 'Approved' | 'For Review' | 'Pending' | 'Return' | 'Reject' | 'Missing';
  checked: boolean;
}

export interface ReviewStep {
  num: string;
  label: string;
  status: 'Approved' | 'In Review' | 'Pending';
  detail?: string;
}

export interface EvalDetailConfig {
  title: string;
  checklistTitle: string;
  checklistSubtitle: string;
  checklist: ChecklistItem[];
  progressDone: number;
  progressTotal: number;
  reviewSteps?: ReviewStep[];
  rightPanel: 'qr' | 'preview' | 'map';
  primaryActionLabel: string;
}

// Three rows (#WA-2026, #WA-2023, #WA-2020) ship with no officer assigned —
// the mock seed for the Unassigned queue in the Application Assignment tab
// (Volume III §01-20). The other seven keep an assigned officer, split
// across a small roster instead of one name everywhere, so evaluator
// workload counts differ.
export const APP_ROWS: AppRow[] = [
  { id: '#WA-2026', applicant: 'Raul Villa', city: 'Taguig City', type: 'Residential', dateSubmitted: '12 Apr 2024', officer: '', status: 'Pending', currentStage: 'applicant' },
  { id: '#WA-2025', applicant: 'Fea Sims', city: 'Quezon City', type: 'Commercial', dateSubmitted: '24 Apr 2024', officer: 'Engr. Doe', status: 'Pending', currentStage: 'zoning' },
  { id: '#WA-2024', applicant: 'David Roderick', city: 'Pasig City', type: 'Renovation', dateSubmitted: '25 Apr 2024', officer: 'Engr. Doe', status: 'Approved', currentStage: 'releasing' },
  { id: '#WA-2023', applicant: 'James Zavel', city: 'Pasay City', type: 'Renovation', dateSubmitted: '14 Dec 2024', officer: '', status: 'Pending', currentStage: 'applicant' },
  { id: '#WA-2022', applicant: 'Denese Martin', city: 'Makati City', type: 'Renovation', dateSubmitted: '14 Jan 2024', officer: 'Arch. Santos', status: 'Rejected', currentStage: 'fire-safety' },
  { id: '#WA-2021', applicant: 'Jack Nunnally', city: 'Paranaque City', type: 'Renovation', dateSubmitted: '2 Dec 2024', officer: 'Engr. Doe', status: 'Pending', currentStage: 'obo-review' },
  { id: '#WA-2020', applicant: 'James Zavel', city: 'Bulacan City', type: 'Residential', dateSubmitted: '14 Dec 2024', officer: '', status: 'Pending', currentStage: 'applicant' },
  { id: '#WA-2019', applicant: 'Anthony Williams', city: 'Mandaluyong City', type: 'Commercial', dateSubmitted: '1 Jul 2024', officer: 'Arch. Santos', status: 'Rejected', currentStage: 'zoning' },
  { id: '#WA-2018', applicant: 'Axie Barnes', city: 'Marikina City', type: 'Commercial', dateSubmitted: '28 Aug 2024', officer: 'Engr. Reyes', status: 'Approved', currentStage: 'releasing' },
  { id: '#WA-2017', applicant: 'Glen Morning', city: 'Caloocan City', type: 'Commercial', dateSubmitted: '30 Aug 2024', officer: 'Engr. Reyes', status: 'Pending', currentStage: 'payment' },
];

// Officers available to receive a new assignment in this tenant — kept
// separate from whatever names appear in APP_ROWS so the roster stays
// stable even as rows get reassigned.
export const EVALUATOR_ROSTER: string[] = ['Engr. Doe', 'Arch. Santos', 'Engr. Reyes'];

// Days sitting unassigned, keyed by application id — a small, explicit mock
// value rather than derived from dateSubmitted (whose year is inconsistent
// with "today" across this seed data).
export const UNASSIGNED_DAYS: Record<string, number> = {
  '#WA-2026': 2,
  '#WA-2023': 6,
  '#WA-2020': 9,
};

export const DOCUMENTS: DocumentItem[] = [
  { name: 'Site Development Plan', filename: 'Site_Dev.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Missing' },
  { name: 'Building Plans', filename: 'Buildingplans.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Approved', version: 2, previousUploadedDate: 'Mon-Mar 22, 2021' },
  { name: 'Proof of Ownership', filename: 'Landtitle.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Approved' },
  { name: 'Barangay Clearance', filename: 'BarangayClearance.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Approved' },
  { name: 'Tax Declaration', filename: 'tax_declaration.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Rejected' },
  { name: 'Lorem ipsum sit ..', filename: 'Santo Agency Group', uploadedDate: 'Sun-Apr 14, 2021', status: 'Approved' },
];

export const COMMENTS: CommentItem[] = [
  { author: 'Engr. Doe', timeAgo: 'about 2 minutes ago', text: 'Initial Interview Done!', depth: 0, thumbnails: ['#8b5a2b', '#1f2430', '#7c3aed'] },
  { author: 'Engr. Joe', timeAgo: 'about 1 hour ago', text: 'Wow impressive!', depth: 0 },
  { author: 'Engr. Arqueto', timeAgo: 'about 2 hours ago', text: 'Wow, that is really nice.', depth: 1 },
  { author: 'Engr. Smith', timeAgo: 'about 3 hours ago', text: 'Nice work, makes me think of The Money Pit.', depth: 2 },
  { author: 'Engr. Larson', timeAgo: 'about 4 hours ago', text: 'Some Documents Are Missing. Please upload a copy of Site Development', depth: 0 },
  { author: 'User', timeAgo: 'about 10 hours ago', text: 'Uploaded the requested Documents.', depth: 0 },
];

export const TIMELINE: TimelineItem[] = [
  { num: '03', event: 'Application Approved', date: '18 Jun, 2021', time: '10:30 AM', detail: 'Application Approved by Engr. Doe' },
  { num: '02', event: 'Under Review', date: '28 May, 2021', time: '11:30 AM', detail: 'Application Reviewed by Engr. Doe' },
  { num: '01', event: 'Application Recieved', date: '13 May, 2021', time: '1:30 PM', detail: 'Application received by Engr. Doe' },
];

export const SHARED_TIMELINE: { label: string; date: string; who: string; role: string }[] = [
  { label: 'Application Submitted', date: 'April 12, 2026 | 10:30 AM', who: 'Jhon Doe', role: 'Applicant' },
  { label: 'Initial Evaluation - Application in Building Approved', date: 'April 13, 2026 | 12:07 AM', who: 'Arnold M. bernas', role: 'Engr.' },
  { label: 'Initial Evaluation - Architectural Permit Approved', date: 'April 13, 2026 | 2:07 AM', who: 'Jonny Does', role: 'Architect' },
];

export const EVAL_CARDS: EvalCard[] = [
  { key: 'initial', title: 'Initial Evaluation', statusLabel: 'Ready to Review', statusTone: 'good', description: 'Application is completed and ready for review', documents: 6, comments: 12, officerInitials: ['ES', 'DM', 'RL'], progressPct: 100 },
  { key: 'zoning', title: 'Zoning Evaluation', statusLabel: 'In Progress', statusTone: 'progress', description: 'Application is still in Progress', documents: 4, comments: 0, officerInitials: ['AB', 'CD'], progressPct: 60 },
  { key: 'fire', title: 'Fire Safety Evaluation', statusLabel: 'In Progress', statusTone: 'progress', description: 'Application is still in Progress', documents: 9, comments: 0, officerInitials: ['EF', 'GH'], progressPct: 90 },
  { key: 'obo', title: 'OBO Review', statusLabel: 'In Progress', statusTone: 'progress', description: 'Application is still in Progress', documents: 0, comments: 0, officerInitials: ['IJ', 'KL', 'MN'], progressPct: 0 },
  { key: 'final', title: 'Final Evaluation', statusLabel: 'In Progress', statusTone: 'progress', description: 'Application is still in Progress', documents: 0, comments: 0, officerInitials: ['OP'], progressPct: 0 },
];

export interface AppDetail {
  row: AppRow;
  region: string;
  email: string;
  phone: string;
  lastUpdated: string;
  meta: { dateSubmitted: string; applicationNumber: string; currentStatus: AppStatus };
  project: { location: string; lotArea: string; floorArea: string; floors: string; projectType: string };
  applicationType: { type: string; ifCompany: string; authorizedRep: string; businessPermit: string };
  govId: { idType: string; contactNumber: string; tin: string };
  professional: { architect: string; civilEngineer: string; electricalEngineer: string };
  ownership: { lotOwnerName: string; relationship: string; ownershipType: string };
}

export function buildDetailFor(row: AppRow): AppDetail {
  const emailHandle = row.applicant.toLowerCase().replace(/\s+/g, '');
  return {
    row,
    region: 'National Capital Region',
    email: `${emailHandle}@gmail.com`,
    phone: '+639123-1230-03',
    lastUpdated: '03/15/2024',
    meta: {
      dateSubmitted: row.dateSubmitted,
      applicationNumber: row.id,
      currentStatus: row.status,
    },
    project: {
      location: '78 Sampaguita Street Barangay Santo Niño Marikina City, Metro Manila, 1800 Philippines',
      lotArea: '150 sqm',
      floorArea: '85 sqm',
      floors: '2',
      projectType: row.type,
    },
    applicationType: {
      type: 'Individual',
      ifCompany: '',
      authorizedRep: '',
      businessPermit: '',
    },
    govId: {
      idType: 'National ID',
      contactNumber: '+214 5632564',
      tin: '123-1242302-4234',
    },
    professional: {
      architect: '',
      civilEngineer: '',
      electricalEngineer: '',
    },
    ownership: {
      lotOwnerName: 'Jhon Doe',
      relationship: 'Customer',
      ownershipType: 'Owned',
    },
  };
}

export const EVAL_DETAILS: Record<EvalKey, EvalDetailConfig> = {
  initial: {
    title: 'Initial Evaluation',
    checklistTitle: 'Documents Checklist',
    checklistSubtitle: 'Lorem ipsum sit dolor amet consecturer.',
    checklist: [
      { label: 'Application for Building Permit', filename: 'ApplicationforBuildingPermit.pdf', status: 'Approved', checked: true },
      { label: 'Architectural Permit', filename: 'ArchitecturaPermit.pdf', status: 'Approved', checked: true },
      { label: 'Civil Structural Permit', filename: 'CivilStructuralPermit.pdf', status: 'Return', checked: false },
      { label: 'Demolition Permit', filename: 'DemolitionPermit.pdf', status: 'Missing', checked: false },
    ],
    progressDone: 2,
    progressTotal: 4,
    rightPanel: 'preview',
    primaryActionLabel: 'Forward to Zoning Evaluation',
  },
  zoning: {
    title: 'Zoning Evaluation',
    checklistTitle: 'Zoning Compliance Checklist',
    checklistSubtitle: 'Lorem ipsum sit dolor amet consecturer.',
    checklist: [
      { label: 'Land Use / Zoning Compliance', filename: '', status: 'Approved', checked: true },
      { label: 'Minimal Area', filename: '', status: 'Approved', checked: true },
      { label: 'Setback Requirements', filename: '', status: 'Pending', checked: false },
      { label: 'Building Coverage', filename: '', status: 'Reject', checked: false },
    ],
    progressDone: 2,
    progressTotal: 10,
    rightPanel: 'map',
    primaryActionLabel: 'Forward to Fire Evaluation',
  },
  fire: {
    title: 'Fire Evaluation',
    checklistTitle: 'Documents Checklist',
    checklistSubtitle: 'Synced from Bureau of Fire Protection evaluation portal',
    checklist: [
      { label: 'BFP Citizens Charter', filename: 'ApplicationforBuildingPermit.pdf', status: 'Approved', checked: true },
      { label: 'Fire Safety Inspection', filename: 'ArchitecturaPermit.pdf', status: 'Approved', checked: true },
      { label: 'Fire Safety Evaluation Report', filename: 'CivilStructuralPermit.pdf', status: 'For Review', checked: false },
    ],
    progressDone: 2,
    progressTotal: 3,
    rightPanel: 'qr',
    primaryActionLabel: 'Forward to Zoning',
  },
  obo: {
    title: 'OBO Evaluation',
    checklistTitle: 'Documents Checklist',
    checklistSubtitle: 'Multi-discipline sign-off records',
    checklist: [
      { label: 'OBO Assessment Form', filename: 'OBOAssessmentForm.pdf', status: 'Approved', checked: true },
      { label: 'Multi-Discipline Sign-off', filename: 'MultiDisciplineSignoff.pdf', status: 'Approved', checked: true },
      { label: 'Building Official Certification', filename: 'BuildingOfficialCert.pdf', status: 'For Review', checked: false },
    ],
    progressDone: 2,
    progressTotal: 3,
    reviewSteps: [
      { num: '01', label: 'Technical Review', status: 'Approved', detail: 'May 4, 2025 | Arch. Doe' },
      { num: '02', label: 'Architectural', status: 'In Review', detail: 'Current Stage' },
      { num: '03', label: 'Civil Structural', status: 'Pending' },
      { num: '04', label: 'Sanitary/Plumbing', status: 'Pending' },
      { num: '05', label: 'Electrical', status: 'Pending' },
      { num: '06', label: 'Mechanical', status: 'Pending' },
      { num: '07', label: 'Electronics', status: 'Pending' },
      { num: '08', label: 'Site Verification', status: 'Pending' },
      { num: '09', label: 'Processing & Assesment', status: 'Pending' },
      { num: '10', label: 'Final Approval', status: 'Pending' },
    ],
    rightPanel: 'preview',
    primaryActionLabel: 'Approve',
  },
  final: {
    title: 'Final Evaluation',
    checklistTitle: 'Documents Checklist',
    checklistSubtitle: 'Final release requirements',
    checklist: [
      { label: 'Order of Payment', filename: 'OrderOfPayment.pdf', status: 'Approved', checked: true },
      { label: 'Final Inspection Report', filename: 'FinalInspectionReport.pdf', status: 'Approved', checked: true },
      { label: 'Certificate of Occupancy Draft', filename: 'CertOfOccupancy.pdf', status: 'For Review', checked: false },
    ],
    progressDone: 2,
    progressTotal: 3,
    rightPanel: 'preview',
    primaryActionLabel: 'Forward to Permit Release',
  },
};
