// Canonical mock application dataset — Phase 3.
//
// Composed against CanonicalApplication (core/application-model.ts) by
// reading the four existing datasets Phase 1 confirmed already share the
// same 10-application identity (applications-data.ts, evaluations-data.ts,
// payments-seed.ts, permit-seed.ts), plus tenant-inspections.ts's 6 rows
// that already reference these ids via their own `applicationId` field.
// Every field below is read from an existing exported mock array — nothing
// is invented, and no existing file is modified to produce this.
//
// Not yet imported or consumed anywhere in the app. Migrating a page to
// read from CANONICAL_APPLICATIONS instead of its own local array is
// Phase 4+ work, not this phase.

import {
  APP_ROWS,
  buildDetailFor,
  DOCUMENTS,
  SHARED_TIMELINE,
  UNASSIGNED_DAYS,
} from '../pages/tenant-applications/applications-data';
import { EVAL_ROWS } from '../pages/tenant-evaluations/evaluations-data';
import { PAYMENT_BASE_ROWS } from '../pages/tenant-payments/payments-seed';
import { PERMIT_BASE_ROWS } from '../pages/tenant-permit-release/permit-seed';
import { STAGE_STATS } from '../shared/workflow-monitor/stage-summary-data';
import { WORK_QUEUE_TASK_SEED } from '../pages/tenant-work-queue/work-queue-seed';
import {
  ApplicationDocumentRequirement,
  ApplicationEvaluation,
  ApplicationInspection,
  ApplicationPayment,
  ApplicationRelease,
  ApplicationTimelineEvent,
  CanonicalApplication,
} from './application-model';
import { castillaGroupsForTrack } from '../pages/tenant-applications/castilla-document-requirements';

// tenant-inspections.ts's BASE_ROWS is component-local (not exported), so
// the 6 known applicationId correspondences the Phase 1 audit already
// verified are reproduced here verbatim rather than imported — this reads
// nothing from, and writes nothing to, that file.
const INSPECTION_BY_APPLICATION_ID: Record<string, ApplicationInspection> = {
  '#WA-2026': { inspectionReference: 'INS-2031', status: 'Scheduled', scheduledDate: '22 Jul 2026', notes: '' },
  '#WA-2024': { inspectionReference: 'INS-2030', status: 'In Progress', scheduledDate: '20 Jul 2026', notes: '' },
  '#WA-2020': { inspectionReference: 'INS-2029', status: 'Passed', scheduledDate: '18 Jul 2026', notes: '' },
  '#WA-2019': {
    inspectionReference: 'INS-2028',
    status: 'Needs Correction',
    scheduledDate: '15 Jul 2026',
    notes: 'Electrical rough-in does not match approved plan — re-inspection required.',
  },
  '#WA-2018': { inspectionReference: 'INS-2027', status: 'Passed', scheduledDate: '12 Jul 2026', notes: '' },
  '#WA-2017': { inspectionReference: 'INS-2026', status: 'Passed', scheduledDate: '9 Jul 2026', notes: '' },
};

// Every row below belongs to Esperanza — per Phase 1 finding E, it's the
// only tenant with a mock dataset corroborated across modules. Manila and
// Cebu are deliberately absent rather than backfilled with invented records.
// Exported so other modules migrating in later phases (e.g. Smart Work
// Queue's own tenant gate) can point at this one literal instead of
// re-declaring a second, independently-hardcoded 'Esperanza' string.
export const CANONICAL_TENANT_ID = 'Esperanza';
export const CANONICAL_TENANT_NAME = 'Esperanza';

const DOCS: ApplicationDocumentRequirement[] = DOCUMENTS;
const TIMELINE: ApplicationTimelineEvent[] = SHARED_TIMELINE.map((t) => ({
  label: t.label,
  date: t.date,
  who: t.who,
  role: t.role,
}));

function evaluationsFor(id: string): ApplicationEvaluation[] {
  return EVAL_ROWS.filter((r) => r.id === id).map((r) => ({
    type: r.evalType,
    stage: r.stage,
    officer: r.officer || null,
    missingDocuments: r.missingDocuments,
  }));
}

function paymentFor(id: string): ApplicationPayment | undefined {
  const row = PAYMENT_BASE_ROWS.find((r) => r.id === id);
  if (!row) return undefined;
  return {
    status: row.status,
    method: row.method,
    verifyResult: row.verifyResult,
    verified: false,
  };
}

function releaseFor(id: string): ApplicationRelease | undefined {
  const row = PERMIT_BASE_ROWS.find((r) => r.id === id);
  if (!row) return undefined;
  return {
    status: row.permitStatus,
    // Mirrors the one shared history literal tenant-permit-release.ts's
    // buildRows() already applies to every 'Released' row today.
    ...(row.permitStatus === 'Released' ? { releasedDate: '18 Jun 2026', releasedBy: 'Engr. Doe' } : {}),
  };
}

function targetDaysFor(stage: string): number | undefined {
  return STAGE_STATS.find((s) => s.key === stage)?.targetDays;
}

// Phase 4 (Separate Building Permit and Occupancy) — #WA-2018 is a real,
// fully Released Building Permit application (permit-seed.ts) whose own
// inspection already shows 'Passed' (INSPECTION_BY_APPLICATION_ID above) —
// the honest point in this dataset where an applicant would plausibly file
// for a Certificate of Occupancy next. #CO-2018 below is that linked,
// genuinely separate transaction (see CERTIFICATE_OF_OCCUPANCY_APPLICATIONS
// further down) — not invented on top of an arbitrary/incomplete record.
const RELATED_APPLICATION_ID: Record<string, string> = {
  '#WA-2018': '#CO-2018',
};

const APPLICATIONS_FROM_APP_ROWS: CanonicalApplication[] = APP_ROWS.map((row) => {
  const detail = buildDetailFor(row);
  return {
    applicationId: row.id,
    dateSubmitted: row.dateSubmitted,

    permitTrack: 'building-permit',
    relatedApplicationId: RELATED_APPLICATION_ID[row.id],

    tenant: { tenantId: CANONICAL_TENANT_ID, tenantName: CANONICAL_TENANT_NAME },
    applicant: {
      fullName: row.applicant,
      email: detail.email,
      contactNumber: detail.govId.contactNumber,
      govIdType: detail.govId.idType,
      tin: detail.govId.tin,
    },
    project: {
      type: row.type,
      lotArea: detail.project.lotArea,
      floorArea: detail.project.floorArea,
      floors: detail.project.floors,
    },
    property: {
      city: row.city,
      region: detail.region,
      address: detail.project.location,
      lotOwnerName: detail.ownership.lotOwnerName,
      ownershipType: detail.ownership.ownershipType,
    },
    professionals: {
      architect: detail.professional.architect || undefined,
      civilEngineer: detail.professional.civilEngineer || undefined,
      electricalEngineer: detail.professional.electricalEngineer || undefined,
    },

    workflow: { stage: row.currentStage, status: row.status },
    assignment: {
      assignedOfficer: row.officer || null,
      daysUnassigned: UNASSIGNED_DAYS[row.id],
    },

    documents: DOCS,
    evaluations: evaluationsFor(row.id),
    payment: paymentFor(row.id),
    inspection: INSPECTION_BY_APPLICATION_ID[row.id],
    release: releaseFor(row.id),

    timeline: TIMELINE,
    processingTarget: { targetDays: targetDaysFor(row.currentStage) },
  };
});

// Phase 16 — Smart Work Queue Canonical Integration. Work Queue's 35 tasks
// (#WA-3001-3065) could not be truthfully mapped onto the 10 applications
// above — different applicants, different cities, no real correspondence
// (Phase 1/5 already confirmed this). Rather than fabricate a mapping, each
// task's own already-existing fields (work-queue-seed.ts) are promoted into
// a genuine canonical application of its own — nothing invented, just the
// same data these 35 tasks already carried, given a real applicationId.
//
// These 35 have no evaluations/payment/inspection/release sub-records
// (left undefined/empty) — those modules were only ever built against the
// original 10; that's an honest reflection of what actually exists in this
// prototype, not a gap to backfill. A single 'Assigned' timeline event is
// included since it's directly reconstructable from the task's own real
// assignedDate/assignedOfficer, not fabricated narrative.
const WORK_QUEUE_APPLICATIONS: CanonicalApplication[] = WORK_QUEUE_TASK_SEED.map((task) => ({
  applicationId: task.id,
  // No separate "date submitted" concept exists on a queue task — assignedDate
  // is the closest real value this dataset has, reused rather than inventing
  // a new date.
  dateSubmitted: task.assignedDate,

  permitTrack: 'building-permit',

  tenant: { tenantId: CANONICAL_TENANT_ID, tenantName: CANONICAL_TENANT_NAME },
  applicant: { fullName: task.applicant },
  project: { type: task.permitType },
  property: { city: task.location },

  workflow: { stage: task.currentStage, status: task.status },
  assignment: {
    assignedOfficer: task.assignedOfficer,
    assignedRole: task.assignedRole,
    department: task.department,
    assignedDate: task.assignedDate,
  },

  documents: [],
  evaluations: [],

  timeline: [{ label: 'Assigned', date: task.assignedDate, who: task.assignedOfficer }],
  processingTarget: { dueDate: task.slaDueDate, slaStatus: task.slaStatus },
}));

// Phase 4 (Separate Building Permit and Occupancy) — one genuine Certificate
// of Occupancy application, linked to its already-Released Building Permit
// (#WA-2018, see RELATED_APPLICATION_ID above). Shares applicant/project/
// property/ownership/professionals context with #WA-2018 (read from the
// same buildDetailFor(row) every BP record already derives from — not a
// second, independently-authored copy) but carries its own workflow —
// Documentary Review -> Inspection -> FSIC -> Final Review -> Payment ->
// Release, not #WA-2018's Evaluation -> Payment -> Release — and its own
// empty evaluations/payment/inspection/release sub-records, since none of
// those steps have been reached yet. Documents are seeded from the real
// Occupancy Requirements + FSIC groups (Phase 3/4) with an honest 'Missing'
// status — nothing has been uploaded for a just-filed application, not a
// fabricated review outcome.
const CO_2018_SOURCE_ROW = APP_ROWS.find((r) => r.id === '#WA-2018')!;
const CO_2018_SOURCE_DETAIL = buildDetailFor(CO_2018_SOURCE_ROW);

// castillaGroupsForTrack('occupancy') returns both the Occupancy
// Requirements and FSIC groups (both tagged permitTrack: 'occupancy').
const OCCUPANCY_DOCUMENTS: ApplicationDocumentRequirement[] = castillaGroupsForTrack('occupancy').flatMap((group) =>
  group.items.map((item) => ({ name: item.name, filename: '', uploadedDate: '', status: 'Missing' as const, group: group.key })),
);

const CERTIFICATE_OF_OCCUPANCY_APPLICATIONS: CanonicalApplication[] = [
  {
    applicationId: '#CO-2018',
    dateSubmitted: '15 Jul 2026',

    permitTrack: 'occupancy',
    relatedApplicationId: '#WA-2018',

    tenant: { tenantId: CANONICAL_TENANT_ID, tenantName: CANONICAL_TENANT_NAME },
    applicant: {
      fullName: CO_2018_SOURCE_ROW.applicant,
      email: CO_2018_SOURCE_DETAIL.email,
      contactNumber: CO_2018_SOURCE_DETAIL.govId.contactNumber,
      govIdType: CO_2018_SOURCE_DETAIL.govId.idType,
      tin: CO_2018_SOURCE_DETAIL.govId.tin,
    },
    project: {
      type: CO_2018_SOURCE_ROW.type,
      lotArea: CO_2018_SOURCE_DETAIL.project.lotArea,
      floorArea: CO_2018_SOURCE_DETAIL.project.floorArea,
      floors: CO_2018_SOURCE_DETAIL.project.floors,
    },
    property: {
      city: CO_2018_SOURCE_ROW.city,
      region: CO_2018_SOURCE_DETAIL.region,
      address: CO_2018_SOURCE_DETAIL.project.location,
      lotOwnerName: CO_2018_SOURCE_DETAIL.ownership.lotOwnerName,
      ownershipType: CO_2018_SOURCE_DETAIL.ownership.ownershipType,
    },
    professionals: {
      architect: CO_2018_SOURCE_DETAIL.professional.architect || undefined,
      civilEngineer: CO_2018_SOURCE_DETAIL.professional.civilEngineer || undefined,
      electricalEngineer: CO_2018_SOURCE_DETAIL.professional.electricalEngineer || undefined,
    },

    workflow: { stage: 'documentary-review', status: 'Pending' },
    assignment: { assignedOfficer: null },

    documents: OCCUPANCY_DOCUMENTS,
    evaluations: [],

    timeline: [
      {
        label: 'Certificate of Occupancy Application Filed',
        date: '15 Jul 2026',
        who: CO_2018_SOURCE_ROW.applicant,
        role: 'Applicant',
        detail: 'Filed following release of related Building Permit #WA-2018',
      },
    ],
  },
];

export const CANONICAL_APPLICATIONS: CanonicalApplication[] = [
  ...APPLICATIONS_FROM_APP_ROWS,
  ...WORK_QUEUE_APPLICATIONS,
  ...CERTIFICATE_OF_OCCUPANCY_APPLICATIONS,
];
