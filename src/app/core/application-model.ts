// Canonical frontend application data model — Phase 2 (type definitions only).
//
// This is the single cross-module vocabulary every application-related page
// (Tenant Applications, Smart Work Queue, Evaluations, Payments, Permit
// Release, Inspections, Records, Workflow Monitor, Dashboards, Reports) will
// eventually read from. Nothing in the app constructs or consumes this type
// yet — no existing dataset, page, route, or RBAC check is affected by this
// file. See core/session.ts / roles.ts / capabilities.ts for the existing
// RBAC model this deliberately does not touch or duplicate.
//
// Primary identifier: `applicationId` (e.g. 'BP-2026-00124'). Applicant name
// and officer name are never identifiers — both are attributes, not keys.
// Tenant isolation is always the explicit `tenant.tenantId` field below,
// never inferred from role, officer, city text, or route.

import { RoleKey } from './roles';

/** The one identifier every module joins on. Never an applicant/officer name. */
export type ApplicationId = string;

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------

/** Explicit tenant scoping — mirrors Session.activeTenant's tenantId string
 *  (core/session.ts), the one place tenant resolution is already done
 *  correctly today. Every canonical application carries this explicitly;
 *  no consumer may infer tenant from role, officer name, city, or route. */
export interface ApplicationTenant {
  tenantId: string;
  tenantName: string;
}

// ---------------------------------------------------------------------------
// Applicant
// ---------------------------------------------------------------------------

export interface ApplicationApplicant {
  fullName: string;
  email?: string;
  contactNumber?: string;
  govIdType?: string;
  tin?: string;
}

// ---------------------------------------------------------------------------
// Project / Property
// ---------------------------------------------------------------------------

/** What is being built — mirrors AppRow.type + AppDetail.project (tenant-applications/applications-data.ts). */
export interface ApplicationProject {
  type: string;
  lotArea?: string;
  floorArea?: string;
  floors?: string;
}

/** Where it is being built — kept separate from ApplicationProject so
 *  "what" and "where" can evolve independently (e.g. multiple structures
 *  on one lot later) without reshaping the project fields. */
export interface ApplicationProperty {
  city: string;
  region?: string;
  address?: string;
  lotOwnerName?: string;
  ownershipType?: string;
}

// ---------------------------------------------------------------------------
// Professionals
// ---------------------------------------------------------------------------

export interface ApplicationProfessionals {
  architect?: string;
  civilEngineer?: string;
  electricalEngineer?: string;
}

// ---------------------------------------------------------------------------
// Workflow — pipeline position only, deliberately separate from every
// per-domain status below (evaluation/payment/inspection/release each keep
// their own status vocabulary; workflow.stage never conflates with them).
// ---------------------------------------------------------------------------

/** Union of AppStage (applications-data.ts: 7 stages including
 *  'building-official') and WorkQueueStage (work-queue-data.ts: 7 stages
 *  including 'inspection', but missing 'building-official'). Phase 1 found
 *  these two existing stage enums are not identical — this reconciles them
 *  into one 8-value canonical stage rather than picking one and losing the
 *  other's stage. */
export type WorkflowStage =
  | 'applicant'
  | 'zoning'
  | 'fire-safety'
  | 'obo-review'
  | 'building-official'
  | 'inspection'
  | 'payment'
  | 'releasing';

/** Phase 4 (Separate Building Permit and Occupancy) — Certificate of
 *  Occupancy's own stage sequence, as given directly in the phase brief:
 *  Documentary Review -> Inspection -> FSIC -> Final Review -> Payment ->
 *  Release. Deliberately its own union rather than added onto
 *  WorkflowStage — a Building Permit application's stage and a Certificate
 *  of Occupancy application's stage are not the same concept, even where
 *  the English label overlaps (both tracks have a "Payment"/"Release" step,
 *  but they are separate transactions with separate state). */
export type OccupancyWorkflowStage = 'documentary-review' | 'inspection' | 'fsic' | 'final-review' | 'payment' | 'releasing';

/** Overall decision status — mirrors AppStatus ('Approved'|'Pending'|'Rejected')
 *  extended with evaluations' 'Return for Revision' (evaluations-data.ts'
 *  RowStatus), since Phase 1 found that value has no equivalent in AppStatus. */
export type ApplicationDecisionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Return for Revision';

/** Phase 4 — which transaction this canonical record is. Every existing
 *  application is 'building-permit' (nothing pre-Phase-4 changes meaning).
 *  A 'occupancy' record is a genuinely separate transaction — see
 *  CanonicalApplication.relatedApplicationId for how the two are linked. */
export type PermitTrack = 'building-permit' | 'occupancy';

export interface ApplicationWorkflow {
  /** WorkflowStage for a 'building-permit' record, OccupancyWorkflowStage
   *  for an 'occupancy' one — CanonicalApplication.permitTrack says which. */
  stage: WorkflowStage | OccupancyWorkflowStage;
  status: ApplicationDecisionStatus;
}

// ---------------------------------------------------------------------------
// Assignment
// ---------------------------------------------------------------------------

/** Mirrors AppRow.officer (applications-data.ts) and
 *  WorkQueueTask.assignedOfficer/assignedRole/department (work-queue-data.ts).
 *  `assignedOfficer: null` is the canonical "unassigned" state — the same
 *  concept applications-data.ts represents today as officer === ''. */
export interface ApplicationAssignment {
  assignedOfficer: string | null;
  assignedRole?: RoleKey;
  department?: string;
  assignedDate?: string;
  daysUnassigned?: number;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

/** Mirrors DocumentItem (applications-data.ts) as-is — no shape change. */
export interface ApplicationDocumentRequirement {
  name: string;
  filename: string;
  uploadedDate: string;
  status: 'Approved' | 'Rejected' | 'Missing' | 'Pending';
  version?: number;
  previousUploadedDate?: string;
  /** Phase 3/4 — which castilla-document-requirements.ts group this item
   *  belongs to (string, not a hard type import, to avoid this core model
   *  file depending on a page-level module). */
  group?: string;
}

// ---------------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------------

/** Mirrors EvalTypeKey (evaluations-data.ts). */
export type EvaluationType = 'initial' | 'zoning' | 'fire' | 'obo' | 'final';

/** Mirrors Stage (evaluations-data.ts) — kept as its own vocabulary rather
 *  than reused for workflow.stage, since Phase 1 found the two are not the
 *  same concept (this tracks per-evaluation review progress; workflow.stage
 *  tracks the application's overall pipeline position). */
export type EvaluationStage = 'pending-review' | 'under-review' | 'returned' | 'passed';

export interface ApplicationEvaluation {
  type: EvaluationType;
  stage: EvaluationStage;
  officer: string | null;
  missingDocuments?: number;
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

/** Mirrors PayStatus / VerifyResult (payments-seed.ts). `paymentReference`
 *  is the secondary identifier a receipt or payment record would carry —
 *  distinct from applicationId, never used as a join key by other modules. */
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending';
export type PaymentVerifyResult = 'success' | 'incomplete' | 'no-authority';

export interface ApplicationPayment {
  status: PaymentStatus;
  method?: string;
  verifyResult?: PaymentVerifyResult;
  verified: boolean;
  paymentReference?: string;
  receiptNumber?: string;
}

// ---------------------------------------------------------------------------
// Inspection
// ---------------------------------------------------------------------------

/** Mirrors InspectionStatus (tenant-inspections.ts). `inspectionReference`
 *  mirrors InspectionRow.id (e.g. 'INS-2026') — a module-local identifier,
 *  never the applicationId. */
export type InspectionStatus = 'Scheduled' | 'In Progress' | 'Passed' | 'Needs Correction';

export interface ApplicationInspection {
  inspectionReference?: string;
  status: InspectionStatus;
  scheduledDate?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Release
// ---------------------------------------------------------------------------

/** Mirrors PermitStatus (permit-seed.ts). `permitNumber` and
 *  `occupancyCertificateNumber` are secondary identifiers a printed permit
 *  or CO would carry — distinct from applicationId. */
export type ReleaseStatus = 'Ready' | 'Released' | 'Voided';

export interface ApplicationRelease {
  status: ReleaseStatus;
  permitNumber?: string;
  occupancyCertificateNumber?: string;
  releasedDate?: string;
  releasedBy?: string;
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

/** Mirrors TimelineItem / SHARED_TIMELINE (applications-data.ts). */
export interface ApplicationTimelineEvent {
  label: string;
  date: string;
  who?: string;
  role?: string;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Processing target (SLA)
// ---------------------------------------------------------------------------

/** Mirrors WorkQueueTask's slaDueDate/daysRemaining/slaStatus fields
 *  (work-queue-data.ts) generalized to any canonical application, not just
 *  ones currently in a work queue. */
export type ProcessingSlaStatus = 'on-track' | 'due-soon' | 'due-today' | 'overdue';

export interface ApplicationProcessingTarget {
  targetDays?: number;
  dueDate?: string;
  slaStatus?: ProcessingSlaStatus;
}

// ---------------------------------------------------------------------------
// Canonical composite
// ---------------------------------------------------------------------------

/** The single source-of-truth shape for one application, composed from the
 *  sections above rather than one flat interface — each section maps to
 *  roughly one existing module's slice of data (see Phase 1 audit), so a
 *  module migrating later only needs to read/write its own section. */
export interface CanonicalApplication {
  applicationId: ApplicationId;
  dateSubmitted: string;

  /** Phase 4 — which transaction this record is. Required (not optional)
   *  so every consumer must consciously handle both tracks rather than
   *  silently assuming 'building-permit' by omission. */
  permitTrack: PermitTrack;
  /** Phase 4 — the other record in this Building Permit <-> Certificate of
   *  Occupancy relationship, if one exists. Two-way (set on both records)
   *  so either detail page can link to the other without a reverse lookup.
   *  Never a third concept — a Building Permit links to at most one
   *  Certificate of Occupancy in this model, and vice versa. */
  relatedApplicationId?: ApplicationId;

  tenant: ApplicationTenant;
  applicant: ApplicationApplicant;
  project: ApplicationProject;
  property: ApplicationProperty;
  professionals?: ApplicationProfessionals;

  workflow: ApplicationWorkflow;
  assignment: ApplicationAssignment;

  documents: ApplicationDocumentRequirement[];
  evaluations: ApplicationEvaluation[];
  payment?: ApplicationPayment;
  inspection?: ApplicationInspection;
  release?: ApplicationRelease;

  timeline: ApplicationTimelineEvent[];
  processingTarget?: ApplicationProcessingTarget;
}
