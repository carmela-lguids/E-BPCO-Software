// Work Queue's raw task fixtures — kept separate from work-queue-data.ts so
// core/application-data.ts can import this seed directly to build canonical
// applications from it (Phase 16 — Smart Work Queue Canonical Integration)
// without creating a circular import: work-queue-data.ts already imports
// CANONICAL_TENANT_ID from core/application-data.ts, so application-data.ts
// importing back from work-queue-data.ts would cycle. Same reasoning
// payments-seed.ts/permit-seed.ts already documented for the identical
// problem with SearchIndex.
//
// Phase 2 — My Assigned Tasks. There is no existing per-officer assignment
// dataset to extend: AppRow.officer (applications-data.ts) only has 10 rows
// shared across every role, and EvalRow.officer (evaluations-data.ts) is
// fixed per eval type, not per individual account. This is genuinely new
// structured mock data — grounded in the real mock accounts already used
// throughout the app (core/mock-accounts.ts) for assignedOfficer/department,
// and in the same applicant/city/permit-type vocabulary already established
// in applications-data.ts, extended with fresh applicant names chosen to
// NOT collide with any staff account name already in active use elsewhere
// this session (Jonny Doe, Denese Martin, Raul Villa, Engr. Maria Santos,
// Fea Sims, David Roderick, James Zavel) or the evaluator roster
// (Engr. Doe, Arch. Santos, Engr. Reyes).

import { AppStatus } from '../tenant-applications/applications-data';
import { RoleKey } from '../../core/roles';

export type QueuePriority = 'critical' | 'high' | 'normal';
export type QueueSlaStatus = 'on-track' | 'due-soon' | 'due-today' | 'overdue';

// A superset of AppStage (applications-data.ts) — Work Queue also covers
// Inspector/Cashier/Releasing lanes, which already have their own pages
// (tenant-inspections, tenant-payments, tenant-permit-release) but aren't
// represented as a distinct stage in AppStage itself. 'inspection' is the
// one genuinely new stage value; the rest reuse AppStage's own keys.
export type WorkQueueStage =
  | 'applicant'
  | 'zoning'
  | 'fire-safety'
  | 'obo-review'
  | 'inspection'
  | 'payment'
  | 'releasing';

export type EscalationReason =
  | 'Executive escalation'
  | 'Citizen complaint'
  | 'Critical infrastructure'
  | 'Disaster recovery'
  | 'Urgent processing';

export type ApplicantResponseStatus = 'awaiting-response' | 'resubmitted' | 'no-response';

export type AssignmentType = 'new' | 'reassigned';

export interface WorkQueueTaskSeed {
  id: string;
  applicant: string;
  permitType: string;
  location: string;
  currentStage: WorkQueueStage;
  assignedRole: RoleKey;
  assignedOfficer: string;
  department: string;
  assignedDate: string;
  slaDueDate: string;
  daysRemaining: number;
  slaStatus: QueueSlaStatus;
  priority: QueuePriority;
  status: AppStatus;
  isNew: boolean;
  isUnread: boolean;
  /** Phase 4 — Due Today. Day-level daysRemaining (0) isn't granular enough
   *  for "requires action today" — only set when slaStatus === 'due-today'. */
  dueTodayMinutesRemaining?: number;
  /** Phase 5 — High Priority Queue. Why this task was escalated to critical
   *  priority — only set when priority === 'critical'. */
  escalationReason?: EscalationReason;
  /** Phase 6 — Returned Applications. Set only when the task has been
   *  returned to the applicant for compliance (isReturned === true); the
   *  five fields below travel together and are only meaningful as a group. */
  isReturned?: boolean;
  returnReason?: string;
  returnedBy?: string;
  dateReturned?: string;
  applicantResponseStatus?: ApplicantResponseStatus;
  returnedCount?: number;
  /** Phase 7 — Recently Assigned. Absent (defaults to a plain new
   *  assignment) for the rest of the roster; 'reassigned' only travels
   *  with the two fields below, which are only meaningful as a group. */
  assignmentType?: AssignmentType;
  previousEvaluator?: string;
  reassignedDate?: string;
}

export const WORK_QUEUE_TASK_SEED: WorkQueueTaskSeed[] = [
  // --- Initial Evaluation Officer (Jonny Doe, Office of the Building Official) ---
  { id: '#WA-3001', applicant: 'Marites Uy', permitType: 'Residential', location: 'Taguig City', currentStage: 'applicant', assignedRole: 'initial-eval', assignedOfficer: 'Jonny Doe', department: 'Office of the Building Official', assignedDate: '3 days ago', slaDueDate: '06 Aug 2026', daysRemaining: 2, slaStatus: 'due-soon', priority: 'normal', status: 'Pending', isNew: false, isUnread: false },
  { id: '#WA-3002', applicant: 'Ramon dela Peña', permitType: 'Commercial', location: 'Quezon City', currentStage: 'applicant', assignedRole: 'initial-eval', assignedOfficer: 'Jonny Doe', department: 'Office of the Building Official', assignedDate: 'Today', slaDueDate: '09 Aug 2026', daysRemaining: 5, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: true, isUnread: true },
  { id: '#WA-3003', applicant: 'Corazon Ibañez', permitType: 'Renovation', location: 'Pasig City', currentStage: 'applicant', assignedRole: 'initial-eval', assignedOfficer: 'Jonny Doe', department: 'Office of the Building Official', assignedDate: '6 days ago', slaDueDate: '03 Aug 2026', daysRemaining: -1, slaStatus: 'overdue', priority: 'high', status: 'Pending', isNew: false, isUnread: false },
  { id: '#WA-3004', applicant: 'Teodoro Bautista', permitType: 'Industrial', location: 'Bulacan City', currentStage: 'applicant', assignedRole: 'initial-eval', assignedOfficer: 'Jonny Doe', department: 'Office of the Building Official', assignedDate: 'Yesterday', slaDueDate: '04 Aug 2026', daysRemaining: 0, slaStatus: 'due-today', priority: 'high', status: 'Pending', isNew: false, isUnread: true, dueTodayMinutesRemaining: 105 },
  { id: '#WA-3005', applicant: 'Luz Villanueva', permitType: 'Institutional', location: 'Makati City', currentStage: 'applicant', assignedRole: 'initial-eval', assignedOfficer: 'Jonny Doe', department: 'Office of the Building Official', assignedDate: '1 day ago', slaDueDate: '08 Aug 2026', daysRemaining: 4, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: false, isUnread: false, isReturned: true, returnReason: 'Incomplete requirements', returnedBy: 'Jonny Doe', dateReturned: '2 days ago', applicantResponseStatus: 'awaiting-response', returnedCount: 1 },

  // --- Zoning Officer (Denese Martin, Zoning and Land Use Office) ---
  { id: '#WA-3011', applicant: 'Efren Castillo', permitType: 'Residential', location: 'Pasay City', currentStage: 'zoning', assignedRole: 'zoning', assignedOfficer: 'Denese Martin', department: 'Zoning and Land Use Office', assignedDate: 'Today', slaDueDate: '07 Aug 2026', daysRemaining: 3, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: true, isUnread: true },
  { id: '#WA-3012', applicant: 'Amelia Rosales', permitType: 'Commercial', location: 'Taguig City', currentStage: 'zoning', assignedRole: 'zoning', assignedOfficer: 'Denese Martin', department: 'Zoning and Land Use Office', assignedDate: '4 days ago', slaDueDate: '05 Aug 2026', daysRemaining: 1, slaStatus: 'due-soon', priority: 'high', status: 'Pending', isNew: false, isUnread: false },
  { id: '#WA-3013', applicant: 'Bayani Cruz', permitType: 'Renovation', location: 'Paranaque City', currentStage: 'zoning', assignedRole: 'zoning', assignedOfficer: 'Denese Martin', department: 'Zoning and Land Use Office', assignedDate: '7 days ago', slaDueDate: '02 Aug 2026', daysRemaining: -2, slaStatus: 'overdue', priority: 'critical', status: 'Pending', isNew: false, isUnread: false, escalationReason: 'Citizen complaint' },
  { id: '#WA-3014', applicant: 'Josefina Lim', permitType: 'Industrial', location: 'Quezon City', currentStage: 'zoning', assignedRole: 'zoning', assignedOfficer: 'Denese Martin', department: 'Zoning and Land Use Office', assignedDate: 'Yesterday', slaDueDate: '04 Aug 2026', daysRemaining: 0, slaStatus: 'due-today', priority: 'high', status: 'Pending', isNew: false, isUnread: true, dueTodayMinutesRemaining: 250 },
  { id: '#WA-3015', applicant: 'Rodrigo Aquino', permitType: 'Residential', location: 'Makati City', currentStage: 'zoning', assignedRole: 'zoning', assignedOfficer: 'Denese Martin', department: 'Zoning and Land Use Office', assignedDate: '2 days ago', slaDueDate: '09 Aug 2026', daysRemaining: 5, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: false, isUnread: false, isReturned: true, returnReason: 'Non-compliant lot boundary', returnedBy: 'Denese Martin', dateReturned: '4 days ago', applicantResponseStatus: 'resubmitted', returnedCount: 1 },

  // --- Fire Safety Officer (Raul Villa, Bureau of Fire Protection Liaison) ---
  { id: '#WA-3021', applicant: 'Nenita Flores', permitType: 'Commercial', location: 'Pasig City', currentStage: 'fire-safety', assignedRole: 'fire-safety', assignedOfficer: 'Raul Villa', department: 'Bureau of Fire Protection Liaison', assignedDate: 'Today', slaDueDate: '06 Aug 2026', daysRemaining: 2, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: true, isUnread: true, assignmentType: 'reassigned', previousEvaluator: 'Roberto Ferrer', reassignedDate: 'Today' },
  { id: '#WA-3022', applicant: 'Wilfredo Garcia', permitType: 'Institutional', location: 'Bulacan City', currentStage: 'fire-safety', assignedRole: 'fire-safety', assignedOfficer: 'Raul Villa', department: 'Bureau of Fire Protection Liaison', assignedDate: '5 days ago', slaDueDate: '03 Aug 2026', daysRemaining: -1, slaStatus: 'overdue', priority: 'critical', status: 'Pending', isNew: false, isUnread: false, escalationReason: 'Critical infrastructure' },
  { id: '#WA-3023', applicant: 'Perla Mendez', permitType: 'Residential', location: 'Taguig City', currentStage: 'fire-safety', assignedRole: 'fire-safety', assignedOfficer: 'Raul Villa', department: 'Bureau of Fire Protection Liaison', assignedDate: 'Yesterday', slaDueDate: '04 Aug 2026', daysRemaining: 0, slaStatus: 'due-today', priority: 'high', status: 'Pending', isNew: false, isUnread: true, dueTodayMinutesRemaining: 25 },
  { id: '#WA-3024', applicant: 'Domingo Tolentino', permitType: 'Renovation', location: 'Quezon City', currentStage: 'fire-safety', assignedRole: 'fire-safety', assignedOfficer: 'Raul Villa', department: 'Bureau of Fire Protection Liaison', assignedDate: '3 days ago', slaDueDate: '07 Aug 2026', daysRemaining: 3, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: false, isUnread: false, isReturned: true, returnReason: 'Missing fire exit plan', returnedBy: 'Raul Villa', dateReturned: '1 day ago', applicantResponseStatus: 'awaiting-response', returnedCount: 2 },
  { id: '#WA-3025', applicant: 'Herminia Cruz', permitType: 'Commercial', location: 'Pasay City', currentStage: 'fire-safety', assignedRole: 'fire-safety', assignedOfficer: 'Raul Villa', department: 'Bureau of Fire Protection Liaison', assignedDate: '1 day ago', slaDueDate: '08 Aug 2026', daysRemaining: 4, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: false, isUnread: false },

  // --- Office of the Building Official (Engr. Maria Santos) ---
  { id: '#WA-3031', applicant: 'Alfredo Navarro', permitType: 'Institutional', location: 'Makati City', currentStage: 'obo-review', assignedRole: 'obo', assignedOfficer: 'Engr. Maria Santos', department: 'Office of the Building Official', assignedDate: 'Today', slaDueDate: '07 Aug 2026', daysRemaining: 3, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: true, isUnread: true },
  { id: '#WA-3032', applicant: 'Remedios Aguilar', permitType: 'Commercial', location: 'Paranaque City', currentStage: 'obo-review', assignedRole: 'obo', assignedOfficer: 'Engr. Maria Santos', department: 'Office of the Building Official', assignedDate: '6 days ago', slaDueDate: '01 Aug 2026', daysRemaining: -3, slaStatus: 'overdue', priority: 'critical', status: 'Pending', isNew: false, isUnread: false, escalationReason: 'Executive escalation' },
  { id: '#WA-3033', applicant: 'Cesar Villareal', permitType: 'Residential', location: 'Pasig City', currentStage: 'obo-review', assignedRole: 'obo', assignedOfficer: 'Engr. Maria Santos', department: 'Office of the Building Official', assignedDate: 'Yesterday', slaDueDate: '04 Aug 2026', daysRemaining: 0, slaStatus: 'due-today', priority: 'high', status: 'Pending', isNew: false, isUnread: true, dueTodayMinutesRemaining: 180 },
  { id: '#WA-3034', applicant: 'Leonora Pascual', permitType: 'Renovation', location: 'Taguig City', currentStage: 'obo-review', assignedRole: 'obo', assignedOfficer: 'Engr. Maria Santos', department: 'Office of the Building Official', assignedDate: '2 days ago', slaDueDate: '05 Aug 2026', daysRemaining: 1, slaStatus: 'due-soon', priority: 'high', status: 'Pending', isNew: false, isUnread: false, isReturned: true, returnReason: 'Unsigned structural plan', returnedBy: 'Engr. Maria Santos', dateReturned: '3 days ago', applicantResponseStatus: 'no-response', returnedCount: 1 },
  { id: '#WA-3035', applicant: 'Bienvenido Ocampo', permitType: 'Industrial', location: 'Bulacan City', currentStage: 'obo-review', assignedRole: 'obo', assignedOfficer: 'Engr. Maria Santos', department: 'Office of the Building Official', assignedDate: '1 day ago', slaDueDate: '09 Aug 2026', daysRemaining: 5, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: false, isUnread: false },

  // --- Building Inspector (Fea Sims, Office of the Building Official) ---
  { id: '#WA-3041', applicant: 'Salvacion Torres', permitType: 'Residential', location: 'Quezon City', currentStage: 'inspection', assignedRole: 'inspector', assignedOfficer: 'Fea Sims', department: 'Office of the Building Official', assignedDate: 'Today', slaDueDate: '06 Aug 2026', daysRemaining: 2, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: true, isUnread: true },
  { id: '#WA-3042', applicant: 'Gregorio Manalo', permitType: 'Commercial', location: 'Pasay City', currentStage: 'inspection', assignedRole: 'inspector', assignedOfficer: 'Fea Sims', department: 'Office of the Building Official', assignedDate: '5 days ago', slaDueDate: '03 Aug 2026', daysRemaining: -1, slaStatus: 'overdue', priority: 'high', status: 'Pending', isNew: false, isUnread: false },
  { id: '#WA-3043', applicant: 'Felicidad Ortega', permitType: 'Institutional', location: 'Makati City', currentStage: 'inspection', assignedRole: 'inspector', assignedOfficer: 'Fea Sims', department: 'Office of the Building Official', assignedDate: 'Yesterday', slaDueDate: '04 Aug 2026', daysRemaining: 0, slaStatus: 'due-today', priority: 'critical', status: 'Pending', isNew: false, isUnread: true, dueTodayMinutesRemaining: 55, escalationReason: 'Disaster recovery' },
  { id: '#WA-3044', applicant: 'Marcelino Diaz', permitType: 'Renovation', location: 'Paranaque City', currentStage: 'inspection', assignedRole: 'inspector', assignedOfficer: 'Fea Sims', department: 'Office of the Building Official', assignedDate: '3 days ago', slaDueDate: '07 Aug 2026', daysRemaining: 3, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: false, isUnread: false, isReturned: true, returnReason: 'Site not ready for inspection', returnedBy: 'Fea Sims', dateReturned: 'Today', applicantResponseStatus: 'awaiting-response', returnedCount: 1 },
  { id: '#WA-3045', applicant: 'Purificacion Bernardo', permitType: 'Industrial', location: 'Pasig City', currentStage: 'inspection', assignedRole: 'inspector', assignedOfficer: 'Fea Sims', department: 'Office of the Building Official', assignedDate: '1 day ago', slaDueDate: '08 Aug 2026', daysRemaining: 4, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: false, isUnread: false },

  // --- Cashier (David Roderick, Treasury / Cashiering) ---
  { id: '#WA-3051', applicant: 'Honorato Villafuerte', permitType: 'Residential', location: 'Taguig City', currentStage: 'payment', assignedRole: 'cashier', assignedOfficer: 'David Roderick', department: 'Treasury / Cashiering', assignedDate: 'Today', slaDueDate: '05 Aug 2026', daysRemaining: 1, slaStatus: 'due-soon', priority: 'normal', status: 'Pending', isNew: true, isUnread: true },
  { id: '#WA-3052', applicant: 'Concepcion Rivera', permitType: 'Commercial', location: 'Quezon City', currentStage: 'payment', assignedRole: 'cashier', assignedOfficer: 'David Roderick', department: 'Treasury / Cashiering', assignedDate: '4 days ago', slaDueDate: '02 Aug 2026', daysRemaining: -2, slaStatus: 'overdue', priority: 'high', status: 'Pending', isNew: false, isUnread: false },
  { id: '#WA-3053', applicant: 'Anselmo Guevarra', permitType: 'Renovation', location: 'Bulacan City', currentStage: 'payment', assignedRole: 'cashier', assignedOfficer: 'David Roderick', department: 'Treasury / Cashiering', assignedDate: 'Yesterday', slaDueDate: '04 Aug 2026', daysRemaining: 0, slaStatus: 'due-today', priority: 'high', status: 'Pending', isNew: false, isUnread: true, dueTodayMinutesRemaining: 380, assignmentType: 'reassigned', previousEvaluator: 'Teresita Navarro', reassignedDate: 'Yesterday' },
  { id: '#WA-3054', applicant: 'Milagros Espino', permitType: 'Institutional', location: 'Makati City', currentStage: 'payment', assignedRole: 'cashier', assignedOfficer: 'David Roderick', department: 'Treasury / Cashiering', assignedDate: '2 days ago', slaDueDate: '06 Aug 2026', daysRemaining: 2, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: false, isUnread: false, isReturned: true, returnReason: 'Incorrect assessment amount', returnedBy: 'David Roderick', dateReturned: '5 days ago', applicantResponseStatus: 'resubmitted', returnedCount: 3 },
  { id: '#WA-3055', applicant: 'Restituto Pineda', permitType: 'Industrial', location: 'Pasay City', currentStage: 'payment', assignedRole: 'cashier', assignedOfficer: 'David Roderick', department: 'Treasury / Cashiering', assignedDate: '1 day ago', slaDueDate: '07 Aug 2026', daysRemaining: 3, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: false, isUnread: false },

  // --- Permit Releasing Officer (James Zavel, Releasing Unit) ---
  { id: '#WA-3061', applicant: 'Adoracion Salvador', permitType: 'Residential', location: 'Pasig City', currentStage: 'releasing', assignedRole: 'releasing', assignedOfficer: 'James Zavel', department: 'Releasing Unit', assignedDate: 'Today', slaDueDate: '06 Aug 2026', daysRemaining: 2, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: true, isUnread: true },
  { id: '#WA-3062', applicant: 'Bonifacio Mercado', permitType: 'Commercial', location: 'Taguig City', currentStage: 'releasing', assignedRole: 'releasing', assignedOfficer: 'James Zavel', department: 'Releasing Unit', assignedDate: '3 days ago', slaDueDate: '03 Aug 2026', daysRemaining: -1, slaStatus: 'overdue', priority: 'critical', status: 'Pending', isNew: false, isUnread: false, escalationReason: 'Urgent processing' },
  { id: '#WA-3063', applicant: 'Encarnacion Domingo', permitType: 'Renovation', location: 'Quezon City', currentStage: 'releasing', assignedRole: 'releasing', assignedOfficer: 'James Zavel', department: 'Releasing Unit', assignedDate: 'Yesterday', slaDueDate: '04 Aug 2026', daysRemaining: 0, slaStatus: 'due-today', priority: 'high', status: 'Pending', isNew: false, isUnread: true, dueTodayMinutesRemaining: 150 },
  { id: '#WA-3064', applicant: 'Fructuoso Alvarez', permitType: 'Institutional', location: 'Paranaque City', currentStage: 'releasing', assignedRole: 'releasing', assignedOfficer: 'James Zavel', department: 'Releasing Unit', assignedDate: '2 days ago', slaDueDate: '05 Aug 2026', daysRemaining: 1, slaStatus: 'due-soon', priority: 'normal', status: 'Pending', isNew: false, isUnread: false, isReturned: true, returnReason: 'Missing claim stub', returnedBy: 'James Zavel', dateReturned: '2 days ago', applicantResponseStatus: 'no-response', returnedCount: 1 },
  { id: '#WA-3065', applicant: 'Guadalupe Nazario', permitType: 'Industrial', location: 'Makati City', currentStage: 'releasing', assignedRole: 'releasing', assignedOfficer: 'James Zavel', department: 'Releasing Unit', assignedDate: '1 day ago', slaDueDate: '08 Aug 2026', daysRemaining: 4, slaStatus: 'on-track', priority: 'normal', status: 'Pending', isNew: false, isUnread: false },
];
