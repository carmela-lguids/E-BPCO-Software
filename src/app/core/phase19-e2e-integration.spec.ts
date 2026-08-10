import { TestBed } from '@angular/core/testing';
import { ApplicationStore } from './application-store';

// Phase 19 — End-to-End Workflow Regression & Final Integration Audit.
//
// Mirrors the exact store-call sequences tenant-evaluations.ts's
// approveReview()/returnReview() and tenant-payments.ts's confirmVerify()
// perform, chained together across one application's full reachable
// lifecycle. This is verified at the store level rather than through a
// single live UI walkthrough because no page currently reads
// workflow.stage/timeline live from the store for the original 10
// applications except Evaluations and Payments themselves (Applications,
// Work Queue's #WA-30xx family, and Permit Release's own write actions
// remain out of every prior phase's explicit scope — see each phase's own
// report) — this test is the one place the complete chained state can
// honestly be inspected field-by-field without adding new UI, which this
// phase is explicitly not allowed to do.
describe('Phase 19 — End-to-End Workflow Regression', () => {
  let store: ApplicationStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(ApplicationStore);
  });

  function approve(applicationId: string, evalType: 'initial' | 'zoning' | 'fire' | 'obo', tenantId: string) {
    const before = store.getApplicationById(applicationId)!;
    store.updateEvaluation(applicationId, evalType, { stage: 'passed' }, tenantId);
    store.addTimelineEvent(applicationId, { label: `${evalType} Approved`, date: 'Just now', who: 'Test Officer' }, tenantId);

    const ownedStageMap: Record<typeof evalType, string> = {
      initial: 'applicant',
      zoning: 'zoning',
      fire: 'fire-safety',
      obo: 'obo-review',
    };
    const ownedStage = ownedStageMap[evalType];
    if (before.workflow.stage === ownedStage) {
      const order = ['applicant', 'zoning', 'fire-safety', 'obo-review', 'building-official', 'payment', 'releasing'];
      const next = order[order.indexOf(ownedStage) + 1];
      store.updateWorkflow(applicationId, { stage: next as never }, tenantId);
      store.addTimelineEvent(applicationId, { label: `Forwarded to ${next}`, date: 'Just now', who: 'Test Officer' }, tenantId);
    }
  }

  it('chains Initial -> Zoning -> Fire -> OBO evaluation approvals, advancing the pipeline one real stage at a time', () => {
    const target = store.applications()[0]; // #WA-2026, Raul Villa, Esperanza
    const id = target.applicationId;
    const tenantId = target.tenant.tenantId;

    // Ground truth before any action — this is the "Application" stage of
    // the diagram (Application -> Evaluation -> ... -> Records).
    expect(id).toBe('#WA-2026');
    expect(tenantId).toBe('Esperanza');
    expect(target.applicant.fullName).toBe('Raul Villa');
    expect(target.project.type).toBe('Residential');
    expect(target.property.city).toBe('Taguig City');
    expect(target.workflow.stage).toBe('applicant');
    const timelineBefore = target.timeline.length;

    approve(id, 'initial', tenantId);
    expect(store.getApplicationById(id)?.workflow.stage).toBe('zoning');
    expect(store.getApplicationById(id)?.evaluations.find((e) => e.type === 'initial')?.stage).toBe('passed');

    approve(id, 'zoning', tenantId);
    expect(store.getApplicationById(id)?.workflow.stage).toBe('fire-safety');

    approve(id, 'fire', tenantId);
    expect(store.getApplicationById(id)?.workflow.stage).toBe('obo-review');

    approve(id, 'obo', tenantId);
    const final = store.getApplicationById(id)!;
    expect(final.workflow.stage).toBe('building-official');

    // Full field checklist required by the Phase 19 spec, verified in one place.
    expect(final.applicationId).toBe('#WA-2026');
    expect(final.tenant.tenantId).toBe('Esperanza');
    expect(final.applicant.fullName).toBe('Raul Villa');
    expect(final.project.type).toBe('Residential');
    expect(final.property.city).toBe('Taguig City');
    // workflow.status (the overall decision) is deliberately never touched
    // by evaluation approval — see Phase 15's report.
    expect(final.workflow.status).toBe('Pending');
    expect(final.assignment.assignedOfficer).toBe(target.assignment.assignedOfficer);
    expect(final.evaluations.filter((e) => ['initial', 'zoning', 'fire', 'obo'].includes(e.type)).every((e) => e.stage === 'passed')).toBe(true);
    // payment/release untouched by evaluation actions
    expect(final.payment?.status).toBe(target.payment?.status);
    expect(final.release?.status).toBe(target.release?.status);
    // 4 approvals x 2 events each (Approved + Forwarded) = 8 new events, no duplicates
    expect(final.timeline.length).toBe(timelineBefore + 8);
    const labels = final.timeline.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('a Return action sets Return for Revision without moving the pipeline, on a different application', () => {
    const target = store.applications()[1]; // #WA-2025, Fea Sims
    const id = target.applicationId;
    const tenantId = target.tenant.tenantId;
    const stageBefore = target.workflow.stage;

    store.updateEvaluation(id, 'initial', { stage: 'returned' }, tenantId);
    store.updateWorkflow(id, { status: 'Return for Revision' }, tenantId);
    store.addTimelineEvent(id, { label: 'Initial Evaluation Returned for Revision', date: 'Just now', who: 'Test Officer', detail: 'Returned for revision' }, tenantId);

    const final = store.getApplicationById(id)!;
    expect(final.evaluations.find((e) => e.type === 'initial')?.stage).toBe('returned');
    expect(final.workflow.status).toBe('Return for Revision');
    expect(final.workflow.stage).toBe(stageBefore);
  });

  it('Payment verification updates payment state and records a timeline event, without inventing a stage jump when not at the payment stage', () => {
    const target = store.applications()[1]; // #WA-2025 — zoning stage, verifyResult success
    const id = target.applicationId;
    const tenantId = target.tenant.tenantId;
    expect(target.workflow.stage).toBe('zoning');

    const ok = store.updatePayment(id, { status: 'Paid', verified: true }, tenantId);
    expect(ok).toBe(true);
    store.addTimelineEvent(id, { label: 'Payment Verified', date: 'Just now', who: 'Test Cashier' }, tenantId);

    const app = store.getApplicationById(id)!;
    if (app.workflow.stage === 'payment') {
      store.updateWorkflow(id, { stage: 'releasing' }, tenantId);
    }

    const final = store.getApplicationById(id)!;
    expect(final.payment?.status).toBe('Paid');
    expect(final.payment?.verified).toBe(true);
    expect(final.workflow.stage).toBe('zoning'); // unchanged — never at the payment stage
    expect(final.timeline.map((t) => t.label)).toContain('Payment Verified');
  });

  it('every mutation above stays tenant-safe: a cross-tenant write is rejected and no application is reassigned to another tenant', () => {
    const id = store.applications()[0].applicationId;
    const rejected = store.updateWorkflow(id, { stage: 'releasing' }, 'Manila');
    expect(rejected).toBe(false);
    expect(store.getApplicationById(id)?.tenant.tenantId).toBe('Esperanza');
    expect(store.applicationsForTenant('Manila')).toEqual([]);
  });

  // Phase 4 (Separate Building Permit and Occupancy) added one genuine 46th
  // record (#CO-2018) — not a regression, an intentional new canonical
  // application. It has no assignedRole and no release yet (still at
  // Documentary Review), so the 35/5 counts below are unaffected.
  it('final data integrity: 46 applications, no duplicate IDs, exactly 35 have a resolvable Work Queue task, exactly 5 are Released', () => {
    const apps = store.applications();
    expect(apps.length).toBe(46);
    const ids = apps.map((a) => a.applicationId);
    expect(new Set(ids).size).toBe(46);

    const withAssignedRole = apps.filter((a) => a.assignment.assignedRole).length;
    expect(withAssignedRole).toBe(35);

    const released = apps.filter((a) => a.release?.status === 'Released').length;
    expect(released).toBe(5);
  });
});
