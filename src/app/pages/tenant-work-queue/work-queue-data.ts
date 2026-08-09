import { AppStatus, APP_ROWS } from '../tenant-applications/applications-data';
import { RoleKey } from '../../core/roles';

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
// Phase 12 — Tenant Isolation Audit finding: every WorkQueueTask below
// belongs to this one LGU (every assignedOfficer is an Esperanza account —
// see the roster note below). WorkQueueTask itself carries no tenant/LGU
// field. That's fine as long as callers gate by tenant before calling
// tasksForRole() — a role key alone isn't unique across LGUs (e.g. Ana
// Garcia in Manila and Mark Lopez in Cebu hold 'zoning'/'cashier' too), so
// without that gate a non-Esperanza account would see Esperanza's tasks
// relabeled as their own. See tenant-work-queue.ts's myTasks().
export const WORK_QUEUE_TENANT = 'Esperanza';

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

export const STAGE_LABEL: Record<WorkQueueStage, string> = {
  applicant: 'Initial Evaluation',
  zoning: 'Zoning Review',
  'fire-safety': 'Fire Safety Review',
  'obo-review': 'OBO Review',
  inspection: 'Site Inspection',
  payment: 'Payment Verification',
  releasing: 'Permit Release',
};

export interface WorkQueueTask {
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

export type EscalationReason =
  | 'Executive escalation'
  | 'Citizen complaint'
  | 'Critical infrastructure'
  | 'Disaster recovery'
  | 'Urgent processing';

export type ApplicantResponseStatus = 'awaiting-response' | 'resubmitted' | 'no-response';

export type AssignmentType = 'new' | 'reassigned';

export const WORK_QUEUE_TASKS: WorkQueueTask[] = [
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

/** Personal queue for one of the 7 "own queue" roles. Tenant Administrator
 *  uses the full WORK_QUEUE_TASKS array directly (supervisory view), not
 *  this function. */
export function tasksForRole(role: RoleKey): WorkQueueTask[] {
  return WORK_QUEUE_TASKS.filter((t) => t.assignedRole === role);
}

export function slaChipLabel(task: WorkQueueTask): string {
  if (task.daysRemaining < 0) return `+${Math.abs(task.daysRemaining)}d overdue`;
  if (task.daysRemaining === 0) return 'Due today';
  return `${task.daysRemaining}d remaining`;
}

// Same tier vocabulary as core/notifications.ts's severityTier() — maps
// straight onto the existing .status-pill modifier classes.
export function priorityTier(priority: QueuePriority): 'rejected' | 'pending' | 'info' {
  if (priority === 'critical') return 'rejected';
  if (priority === 'high') return 'pending';
  return 'info';
}

export function priorityLabel(priority: QueuePriority): string {
  if (priority === 'critical') return 'Critical';
  if (priority === 'high') return 'High';
  return 'Normal';
}

// --- Phase 3 — Overdue Reviews ---
// A distinct dimension from `priority` — priority is business importance
// (set at assignment); overdue severity is purely how badly the SLA has
// already been missed. A normal-priority task can still be badly overdue,
// and a critical-priority task can be freshly overdue. Only meaningful
// where slaStatus === 'overdue' (daysRemaining is negative).
export type OverdueSeverity = 'warning' | 'critical';

export function overdueSeverity(task: WorkQueueTask): OverdueSeverity {
  return Math.abs(task.daysRemaining) >= 3 ? 'critical' : 'warning';
}

export function overdueSeverityTier(severity: OverdueSeverity): 'rejected' | 'pending' {
  return severity === 'critical' ? 'rejected' : 'pending';
}

export function overdueSeverityLabel(severity: OverdueSeverity): string {
  return severity === 'critical' ? 'Critical' : 'Warning';
}

// --- Phase 4 — Due Today ---
// A distinct dimension from overdue severity — this is same-day urgency
// for tasks that have not yet breached SLA (slaStatus === 'due-today' only).
export function dueTodayCountdownLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
}

export type DueTodayUrgency = 'critical' | 'warning' | 'normal';

export function dueTodayUrgency(minutes: number): DueTodayUrgency {
  if (minutes < 60) return 'critical';
  if (minutes <= 180) return 'warning';
  return 'normal';
}

export function dueTodayUrgencyTier(urgency: DueTodayUrgency): 'rejected' | 'pending' | 'info' {
  if (urgency === 'critical') return 'rejected';
  if (urgency === 'warning') return 'pending';
  return 'info';
}

// Phase 12 — accessibility audit: the Time Remaining pill previously
// communicated urgency by color (+ a pulsing dot) alone, with the text
// being just a countdown. This makes the tier explicit in words too.
export function dueTodayUrgencyLabel(urgency: DueTodayUrgency): string {
  if (urgency === 'critical') return 'Urgent';
  if (urgency === 'warning') return 'Soon';
  return '';
}

// --- Phase 6 — Returned Applications ---
export function applicantResponseLabel(status: ApplicantResponseStatus): string {
  if (status === 'resubmitted') return 'Resubmitted';
  if (status === 'no-response') return 'No Response';
  return 'Awaiting Response';
}

// 'resubmitted' is good news (applicant acted) — 'no-response' is the one
// that needs follow-up; 'awaiting-response' is still within normal wait time.
export function applicantResponseTier(status: ApplicantResponseStatus): 'approved' | 'rejected' | 'pending' {
  if (status === 'resubmitted') return 'approved';
  if (status === 'no-response') return 'rejected';
  return 'pending';
}

// --- Phase 7 — Recently Assigned ---
// Derives a day-offset from the existing assignedDate display string
// ('Today' / 'Yesterday' / 'N days ago') rather than adding a parallel
// numeric field — assignedDate is the one place that recency already
// lives, this just makes it sortable/comparable. Unrecognized formats
// sort to the very end rather than crashing or floating to the top.
export function assignedDaysAgo(task: WorkQueueTask): number {
  const d = task.assignedDate;
  if (d === 'Today') return 0;
  if (d === 'Yesterday') return 1;
  const match = /^(\d+)\s+days?\s+ago$/.exec(d);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

// "Recently assigned" = assigned today or yesterday — a plain frontend
// operational window, not a configured SLA rule.
export function isRecentlyAssigned(task: WorkQueueTask): boolean {
  return assignedDaysAgo(task) <= 1;
}

export type RecentAssignmentBadge = 'new-today' | 'new-yesterday' | 'reassigned';

export function recentAssignmentBadge(task: WorkQueueTask): RecentAssignmentBadge | null {
  if (task.assignmentType === 'reassigned') return 'reassigned';
  const daysAgo = assignedDaysAgo(task);
  if (daysAgo === 0) return 'new-today';
  if (daysAgo === 1) return 'new-yesterday';
  return null;
}

export function recentAssignmentLabel(badge: RecentAssignmentBadge): string {
  if (badge === 'reassigned') return 'Reassigned';
  if (badge === 'new-today') return 'New Today';
  return 'New Yesterday';
}

// Lower rank = more urgent/higher priority, so ascending sort surfaces it first.
function priorityRank(priority: QueuePriority): number {
  if (priority === 'critical') return 0;
  if (priority === 'high') return 1;
  return 2;
}

// --- Phase 8 — Smart Sorting ---
// Global sort across every queue tab. This supersedes Phase 7's
// Recently-Assigned-only sort (newest/oldest/priority) — that was a
// narrower version of exactly this mechanism, and running two separate
// sort controls side by side would have been confusing rather than
// additive, so "Assignment Date" here is that same sort generalized
// across the whole queue instead of duplicated.
export type SortKey = 'urgency' | 'sla' | 'priority' | 'assigned-date' | 'applicant' | 'permit-type' | 'stage';
export type SortDirection = 'asc' | 'desc';

export interface SortOptionDef {
  key: SortKey;
  label: string;
  tooltip: string;
}

export const SORT_OPTIONS: SortOptionDef[] = [
  { key: 'urgency', label: 'Urgency', tooltip: 'Prioritizes overdue, due-today, and high-priority work.' },
  {
    key: 'sla',
    label: 'SLA / Processing Target',
    tooltip: 'Orders by SLA / processing target deadline — soonest or most overdue first.',
  },
  { key: 'priority', label: 'Priority', tooltip: 'Orders by assigned priority level.' },
  { key: 'assigned-date', label: 'Assignment Date', tooltip: 'Orders by when the application was assigned to you.' },
  { key: 'applicant', label: 'Applicant Name', tooltip: 'Orders alphabetically by applicant name.' },
  { key: 'permit-type', label: 'Permit Type', tooltip: 'Groups applications by permit type.' },
  { key: 'stage', label: 'Current Stage', tooltip: 'Orders by where the application is in the review workflow.' },
];

// Conceptual ordering only — a frontend operational heuristic to help an
// evaluator answer "what should I work on first" from data the queue
// already has, not an official DILG/government priority algorithm or
// SLA rule. Tiers, low (most urgent) to high:
//   0 Overdue + Critical Priority     4 High/Critical Priority (else)
//   1 Overdue (other priority)        5 Returned, applicant resubmitted
//   2 Due Today + High/Critical       6 Recently Assigned (today/yesterday)
//   3 Due Today (other priority)      7 Normal assigned tasks
// "Due Today + High/Critical" is read broadly (critical counts as at
// least as urgent as high) since the brief's own list only names "Due
// Today + High Priority" without saying where a due-today critical task
// should rank — treating it as at least that urgent is the safer default.
function urgencyRank(task: WorkQueueTask): number {
  if (task.slaStatus === 'overdue' && task.priority === 'critical') return 0;
  if (task.slaStatus === 'overdue') return 1;
  if (task.slaStatus === 'due-today' && (task.priority === 'high' || task.priority === 'critical')) return 2;
  if (task.slaStatus === 'due-today') return 3;
  if (task.priority === 'critical' || task.priority === 'high') return 4;
  if (task.isReturned && task.applicantResponseStatus === 'resubmitted') return 5;
  if (assignedDaysAgo(task) <= 1) return 6;
  return 7;
}

// The natural process order a permit application moves through — reused
// for "Current Stage" sorting instead of alphabetical, since workflow
// order is the more meaningful reading of "sort by stage."
const STAGE_ORDER: WorkQueueStage[] = [
  'applicant',
  'zoning',
  'fire-safety',
  'obo-review',
  'inspection',
  'payment',
  'releasing',
];

function stageRank(task: WorkQueueTask): number {
  const i = STAGE_ORDER.indexOf(task.currentStage);
  return i === -1 ? STAGE_ORDER.length : i;
}

function compareAscending(a: WorkQueueTask, b: WorkQueueTask, key: SortKey): number {
  switch (key) {
    case 'urgency':
      return urgencyRank(a) - urgencyRank(b);
    case 'sla':
      return a.daysRemaining - b.daysRemaining;
    case 'priority':
      return priorityRank(a.priority) - priorityRank(b.priority);
    case 'assigned-date':
      return assignedDaysAgo(a) - assignedDaysAgo(b);
    case 'applicant':
      return a.applicant.localeCompare(b.applicant);
    case 'permit-type':
      return a.permitType.localeCompare(b.permitType);
    case 'stage':
      return stageRank(a) - stageRank(b);
  }
}

// A fresh, sorted copy — never mutates the array passed in, so this is
// safe to call on a signal's underlying array without corrupting it.
// Direction is applied by flipping comparator argument order rather than
// reversing the sorted array afterward, so ties keep their original
// relative order in both directions (a genuinely stable sort either way).
export function sortTasks(tasks: WorkQueueTask[], key: SortKey, direction: SortDirection): WorkQueueTask[] {
  const sorted = [...tasks];
  sorted.sort((a, b) => (direction === 'asc' ? compareAscending(a, b, key) : compareAscending(b, a, key)));
  return sorted;
}

// --- Phase 10 — Queue Insights / Summary ---
// Workload awareness, not a performance dashboard: every number here is a
// plain count already derivable from data that exists elsewhere in this
// feature (or, for "Unassigned," from tenant-applications.ts, the one
// place that concept actually lives — WorkQueueTask has no unassigned
// state at all, every task already carries an assignedOfficer). Nothing
// here ranks, times, or scores an individual officer.

// "Unassigned" isn't tracked anywhere in work-queue-data.ts itself — every
// WorkQueueTask is, by construction, already assigned to someone. The one
// place an application can genuinely be unassigned is APP_ROWS
// (applications-data.ts already exposes this exact same officer === ''
// check via its own Unassigned tab) — reusing that real, existing count
// rather than inventing a fake one for this feature's own dataset.
export function unassignedApplicationsCount(): number {
  return APP_ROWS.filter((r) => !r.officer).length;
}

export interface DepartmentWorkloadStat {
  department: string;
  count: number;
}

// A plain per-department breakdown of the given task pool — grouping the
// same `department` field every row already carries, not a new dimension.
export function departmentWorkload(tasks: WorkQueueTask[]): DepartmentWorkloadStat[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    counts.set(t.department, (counts.get(t.department) ?? 0) + 1);
  }
  return Array.from(counts, ([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count);
}
