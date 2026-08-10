// Phase 13 — Shared Reactive Application Store.
//
// The single writable owner of canonical application business state. Every
// module that previously read CANONICAL_APPLICATIONS (core/application-data.ts)
// directly as a plain, frozen-in-place array is expected to migrate to this
// store in a later phase (starting with Payments/Permit Release in Phase 14)
// so that a mutation made in one module becomes visible to every other
// consumer. This phase only establishes that mechanism — no existing page
// reads or writes through it yet, so today's app behavior is unaffected.
//
// Follows the same @Injectable({ providedIn: 'root' }) + signal() pattern
// already used by Session (core/session.ts) and SearchIndex
// (core/search-index.ts) rather than introducing a new state-management
// dependency (no NgRx — the repo doesn't use it, and this dataset/update
// surface doesn't need it).
//
// This is NOT a second RBAC system. Role/permission checks stay in
// roles.ts / capabilities.ts / role-gate.directive.ts exactly as before —
// this store only tracks application business data. Where a mutation is
// tenant-specific, callers can pass expectedTenantId (backed by
// Session.activeTenant()) so a write silently fails closed instead of
// crossing an LGU boundary; this store never infers tenant from role,
// officer, or route on its own.

import { Injectable, computed, signal } from '@angular/core';
import { CANONICAL_APPLICATIONS } from './application-data';
import {
  ApplicationAssignment,
  ApplicationEvaluation,
  ApplicationId,
  ApplicationPayment,
  ApplicationRelease,
  ApplicationTimelineEvent,
  ApplicationWorkflow,
  CanonicalApplication,
  EvaluationType,
  WorkflowStage,
} from './application-model';
import { RoleKey } from './roles';

@Injectable({ providedIn: 'root' })
export class ApplicationStore {
  private readonly _applications = signal<CanonicalApplication[]>(CANONICAL_APPLICATIONS);

  /** The full canonical application list, read-only from the outside —
   *  all mutation goes through the methods below. */
  readonly applications = this._applications.asReadonly();

  /** Named alias for `applications`, matching the selector list this
   *  store was specified against. Same signal, not a copy. */
  readonly allApplications = this.applications;

  // ---------------------------------------------------------------------
  // Selectors
  // ---------------------------------------------------------------------

  getApplicationById(applicationId: ApplicationId): CanonicalApplication | undefined {
    return this._applications().find((a) => a.applicationId === applicationId);
  }

  applicationsForTenant(tenantId: string | null | undefined): CanonicalApplication[] {
    if (!tenantId) return [];
    return this._applications().filter((a) => a.tenant.tenantId === tenantId);
  }

  applicationsForOfficer(officer: string): CanonicalApplication[] {
    return this._applications().filter((a) => a.assignment.assignedOfficer === officer);
  }

  applicationsForRole(role: RoleKey): CanonicalApplication[] {
    return this._applications().filter((a) => a.assignment.assignedRole === role);
  }

  applicationsForStage(stage: WorkflowStage): CanonicalApplication[] {
    return this._applications().filter((a) => a.workflow.stage === stage);
  }

  /** "Awaiting payment" = has a payment record and it isn't Paid yet — a
   *  direct reading of the existing PaymentStatus vocabulary, not a new
   *  business rule. */
  readonly applicationsAwaitingPayment = computed(() =>
    this._applications().filter((a) => a.payment && a.payment.status !== 'Paid'),
  );

  readonly applicationsReadyForRelease = computed(() =>
    this._applications().filter((a) => a.release?.status === 'Ready'),
  );

  /** Empty for the original 10 applications (Phase 3 deliberately left their
   *  processingTarget.slaStatus unset — dateSubmitted's year isn't
   *  consistent with "today" across that mock dataset, so computing a real
   *  overdue/on-track state would mean inventing an SLA rule). Genuinely
   *  populated as of Phase 16 for the 35 applications promoted from Work
   *  Queue's own task fixtures, which already carried a real slaStatus. */
  readonly applicationsOverdue = computed(() =>
    this._applications().filter((a) => a.processingTarget?.slaStatus === 'overdue'),
  );

  /** Tenant-safety helper for callers, not an enforcement policy by itself —
   *  Phase 14+ mutation call-sites are expected to check this (backed by
   *  Session.activeTenant()) before performing a tenant-scoped write, the
   *  same way tasksForRole()/myTasks() already gate Work Queue by tenant. */
  belongsToTenant(applicationId: ApplicationId, tenantId: string | null | undefined): boolean {
    const app = this.getApplicationById(applicationId);
    return !!app && !!tenantId && app.tenant.tenantId === tenantId;
  }

  // ---------------------------------------------------------------------
  // Controlled mutations — all immutable: every update replaces the array
  // and the matching application with new object references rather than
  // mutating nested objects in place, so existing consumers relying on
  // reference equality (e.g. Angular's default change detection) still see
  // a real change. Every method returns `false` (and performs no update)
  // if the application doesn't exist or, when `expectedTenantId` is passed,
  // if it doesn't belong to that tenant — so a caller always gets an
  // explicit signal instead of a silent no-op it can't detect.
  // ---------------------------------------------------------------------

  updateApplication(
    applicationId: ApplicationId,
    updater: (app: CanonicalApplication) => CanonicalApplication,
    expectedTenantId?: string | null,
  ): boolean {
    const current = this.getApplicationById(applicationId);
    if (!current) return false;
    if (expectedTenantId != null && current.tenant.tenantId !== expectedTenantId) return false;

    this._applications.update((apps) =>
      apps.map((a) => (a.applicationId === applicationId ? updater(a) : a)),
    );
    return true;
  }

  updateWorkflow(
    applicationId: ApplicationId,
    patch: Partial<ApplicationWorkflow>,
    expectedTenantId?: string | null,
  ): boolean {
    return this.updateApplication(
      applicationId,
      (app) => ({ ...app, workflow: { ...app.workflow, ...patch } }),
      expectedTenantId,
    );
  }

  updateAssignment(
    applicationId: ApplicationId,
    patch: Partial<ApplicationAssignment>,
    expectedTenantId?: string | null,
  ): boolean {
    return this.updateApplication(
      applicationId,
      (app) => ({ ...app, assignment: { ...app.assignment, ...patch } }),
      expectedTenantId,
    );
  }

  /** Merge-only: every seeded application already has a payment record, so
   *  this deliberately does not fabricate one where none exists — it
   *  returns false rather than guessing default field values (verified,
   *  method, etc.) that would be invented, not real. */
  updatePayment(
    applicationId: ApplicationId,
    patch: Partial<ApplicationPayment>,
    expectedTenantId?: string | null,
  ): boolean {
    const app = this.getApplicationById(applicationId);
    if (!app?.payment) return false;
    return this.updateApplication(
      applicationId,
      (a) => ({ ...a, payment: { ...a.payment!, ...patch } }),
      expectedTenantId,
    );
  }

  /** Merge-only, same reasoning as updatePayment. */
  updateRelease(
    applicationId: ApplicationId,
    patch: Partial<ApplicationRelease>,
    expectedTenantId?: string | null,
  ): boolean {
    const app = this.getApplicationById(applicationId);
    if (!app?.release) return false;
    return this.updateApplication(
      applicationId,
      (a) => ({ ...a, release: { ...a.release!, ...patch } }),
      expectedTenantId,
    );
  }

  /** Patches the one evaluation matching evalType — evaluations is a small
   *  array (one entry per evaluation type), not a single object, so the
   *  match key has to be passed explicitly. No-ops (returns false) if that
   *  application has no evaluation of that type. */
  updateEvaluation(
    applicationId: ApplicationId,
    evalType: EvaluationType,
    patch: Partial<ApplicationEvaluation>,
    expectedTenantId?: string | null,
  ): boolean {
    const app = this.getApplicationById(applicationId);
    if (!app?.evaluations.some((e) => e.type === evalType)) return false;
    return this.updateApplication(
      applicationId,
      (a) => ({
        ...a,
        evaluations: a.evaluations.map((e) => (e.type === evalType ? { ...e, ...patch } : e)),
      }),
      expectedTenantId,
    );
  }

  /** Appends to the end of the timeline — canonical timeline events are
   *  stored oldest-first (mirrors applications-data.ts's SHARED_TIMELINE
   *  ordering), so a newly recorded event is the most recent and belongs
   *  last, not first. */
  addTimelineEvent(
    applicationId: ApplicationId,
    event: ApplicationTimelineEvent,
    expectedTenantId?: string | null,
  ): boolean {
    return this.updateApplication(
      applicationId,
      (app) => ({ ...app, timeline: [...app.timeline, event] }),
      expectedTenantId,
    );
  }
}
