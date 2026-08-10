import { CastillaGroupKey } from './castilla-document-requirements';

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
  /** Phase 4 (Separate Building Permit and Occupancy) — optional so every
   *  existing AppRow literal in this file (all Building Permit) doesn't
   *  need updating; only the live canonical projection (fromCanonical,
   *  tenant-applications.ts) sets these for a real record. */
  permitTrack?: 'building-permit' | 'occupancy';
  relatedApplicationId?: string;
  /** Raw Certificate of Occupancy stage (only set when permitTrack ===
   *  'occupancy') — currentStage above is always the Building Permit
   *  AppStage vocabulary and would otherwise mislabel a CO record's real
   *  stage as 'applicant' via toAppStage()'s fallback. */
  occupancyStage?: string;
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
  /** Phase 3 (Castilla Document Requirements) — which structured
   *  requirement group (castilla-document-requirements.ts) this item
   *  belongs to. Optional so existing non-BP document lists elsewhere
   *  aren't forced to classify themselves. */
  group?: CastillaGroupKey;
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
  /** Phase 5 (Expand Real LGU Evaluation Flow) — shown only for status
   *  'Return', so the applicant/officer sees why, not just that it was
   *  returned. Optional so the other five statuses aren't forced to carry
   *  an empty reason field. */
  returnReason?: string;
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

// Phase 3 (Castilla Document Requirements) — Building Permit documentary
// checklist, grouped per castilla-document-requirements.ts (the full,
// faithfully-transcribed Municipality of Castilla requirement set). One
// representative item per group is shown here, matching this page's
// existing checklist density elsewhere (EVAL_DETAILS' 3-4 items per
// stage) rather than reproducing all ~35 line items from the source form.
export const DOCUMENTS: DocumentItem[] = [
  { name: 'Proof of Ownership (OCT/TCT, Deed of Sale, or equivalent)', filename: 'Landtitle.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Approved', group: 'property-ownership' },
  { name: 'Design Plans (Duly signed & sealed)', filename: 'Buildingplans.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Approved', version: 2, previousUploadedDate: 'Mon-Mar 22, 2021', group: 'technical-plans' },
  { name: 'Valid Licenses of Involved Professionals (PRC/PTR)', filename: 'ProfessionalLicenses.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Approved', group: 'professional-credentials' },
  { name: 'Unified Building Permit Form', filename: 'UnifiedBuildingPermitForm.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Pending', group: 'ancillary-permits' },
  { name: 'Site Development Plan', filename: 'Site_Dev.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Missing', group: 'zoning-locational-clearance' },
  { name: 'Barangay Building Clearance', filename: 'BarangayClearance.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Approved', group: 'zoning-locational-clearance' },
  { name: 'Tax Declaration / COT / OCT', filename: 'tax_declaration.pdf', uploadedDate: 'Sun-Apr 14, 2021', status: 'Rejected', group: 'zoning-locational-clearance' },
  { name: 'Fire Safety Evaluation Clearance (FSEC)', filename: '', uploadedDate: '', status: 'Missing', group: 'fsec' },
  { name: 'Road Clearance (DPWH/PEO)', filename: '', uploadedDate: '', status: 'Pending', group: 'other-regulatory-clearances' },
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
  { key: 'fire', title: 'Fire Safety Evaluation Clearance (FSEC)', statusLabel: 'In Progress', statusTone: 'progress', description: 'Application is still in Progress', documents: 9, comments: 0, officerInitials: ['EF', 'GH'], progressPct: 90 },
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
  // Phase 3 (Castilla Document Requirements) — this checklist is the
  // documentary-completeness check Initial Evaluation actually performs:
  // one representative item from each of the core Building Permit package
  // groups (Property/Ownership, Technical Plans, Professional Credentials,
  // Ancillary Permits — see castilla-document-requirements.ts). Zoning/Fire/
  // OBO keep their own stage-specific checklists below, unchanged; refining
  // those to their own real requirement sets is Phase 5's scope, not this
  // one's.
  // Phase 5 (Expand Real LGU Evaluation Flow) — documentary completeness +
  // complete/incomplete decision (Phase 3) + return reason, shown when a
  // reviewed item comes back 'Return' rather than passing silently (the
  // Design Plans item below is deliberately 'Return', not 'For Review', to
  // demonstrate this — see returnReason on ChecklistItem).
  initial: {
    title: 'Initial Evaluation',
    checklistTitle: 'Documents Checklist',
    checklistSubtitle: 'Documentary completeness check — Municipality of Castilla Building Permit requirements.',
    checklist: [
      { label: 'Unified Building Permit Form', filename: 'UnifiedBuildingPermitForm.pdf', status: 'Approved', checked: true },
      { label: 'Proof of Ownership (OCT/TCT or equivalent)', filename: 'Landtitle.pdf', status: 'Approved', checked: true },
      {
        label: 'Design Plans (Duly signed & sealed)',
        filename: 'Buildingplans.pdf',
        status: 'Return',
        checked: false,
        returnReason: "Missing engineer's signature and seal on sheet 3 of the structural plan.",
      },
      { label: 'Valid Licenses of Involved Professionals (PRC/PTR)', filename: '', status: 'Missing', checked: false },
    ],
    progressDone: 2,
    progressTotal: 4,
    rightPanel: 'preview',
    primaryActionLabel: 'Forward to Zoning Evaluation',
  },
  // Phase 5 — replaces the generic compliance checklist with the Municipal
  // Planning and Development Office's own 5-step procedure (Zoning
  // Checklist, MPDO) and its real document requirements (Zoning Checklist /
  // Zoning-Locational Form). reviewSteps mirrors OBO's existing step-tracker
  // pattern below rather than inventing new UI for this.
  zoning: {
    title: 'Zoning Evaluation',
    checklistTitle: 'Zoning Documentary Requirements',
    checklistSubtitle: 'Municipal Planning and Development Office (Zoning Administrator) checklist.',
    checklist: [
      { label: 'Site Development Plan', filename: 'Site_Dev.pdf', status: 'Approved', checked: true },
      { label: 'Vicinity Map', filename: '', status: 'Approved', checked: true },
      { label: 'Barangay Building Clearance', filename: 'BarangayClearance.pdf', status: 'For Review', checked: false },
      { label: 'Tax Declaration / COT / OCT', filename: 'tax_declaration.pdf', status: 'Pending', checked: false },
    ],
    progressDone: 2,
    progressTotal: 4,
    reviewSteps: [
      { num: '01', label: 'Documentary Review', status: 'Approved', detail: 'Complete documentary requirements verified' },
      { num: '02', label: 'Ocular Site Inspection', status: 'Approved', detail: 'Site visit conducted' },
      { num: '03', label: 'Zoning Findings / Project Evaluation Report', status: 'In Review', detail: 'Current Stage' },
      { num: '04', label: 'Zoning Fee Computation & Order of Payment', status: 'Pending' },
      { num: '05', label: 'Locational / Zoning Clearance Issuance', status: 'Pending' },
    ],
    rightPanel: 'map',
    primaryActionLabel: 'Forward to Fire Safety Evaluation (FSEC)',
  },
  // Phase 5 — explicitly labeled FSEC (Fire Safety Evaluation Clearance),
  // distinct from FSIC (Fire Safety Inspection Certificate — Certificate of
  // Occupancy's own post-construction clearance, Phase 4). Checklist items
  // are the real FSEC application form's attached documentary requirements
  // (BFP FSEC Application Form), not the previous placeholder filenames
  // copy-pasted from other stages.
  fire: {
    title: 'Fire Safety Evaluation Clearance (FSEC)',
    checklistTitle: 'FSEC Documentary Requirements',
    checklistSubtitle: 'Bureau of Fire Protection — Castilla Fire Station. Plan-evaluation stage clearance for Building Permit (not FSIC, the post-construction Occupancy clearance).',
    checklist: [
      { label: 'Architectural, Civil/Structural, Electrical, Mechanical, Plumbing, Electronics, Sanitary & Fire Protection Documents (3 Sets)', filename: 'FSEC_PlanSets.pdf', status: 'Approved', checked: true },
      { label: 'Fire Safety Compliance Report (FSCR)', filename: '', status: 'Approved', checked: true },
      { label: 'Cost Estimates (Signed, Sealed & Notarized)', filename: 'CostEstimate.pdf', status: 'For Review', checked: false },
    ],
    progressDone: 2,
    progressTotal: 3,
    rightPanel: 'qr',
    primaryActionLabel: 'Forward to OBO Review',
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
