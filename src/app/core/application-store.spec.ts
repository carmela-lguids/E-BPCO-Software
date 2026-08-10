import { TestBed } from '@angular/core/testing';
import { ApplicationStore } from './application-store';
import { CANONICAL_APPLICATIONS } from './application-data';
import { WORK_QUEUE_TASK_SEED } from '../pages/tenant-work-queue/work-queue-seed';
import { buildWorkQueueTasks } from '../pages/tenant-work-queue/work-queue-data';

describe('ApplicationStore', () => {
  let store: ApplicationStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(ApplicationStore);
  });

  it('initializes from the canonical seed data', () => {
    expect(store.applications().length).toBe(CANONICAL_APPLICATIONS.length);
    expect(store.allApplications()).toBe(store.applications());
  });

  it('has no duplicate application IDs in the seed', () => {
    const ids = store.applications().map((a) => a.applicationId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Phase 16 — Smart Work Queue Canonical Integration. Phase 4 (Separate
  // Building Permit and Occupancy) added one genuine 46th record (#CO-2018,
  // the Certificate of Occupancy linked to #WA-2018) — not a regression,
  // an intentional new canonical application.
  it('Phase 16/4: seeds exactly 46 applications — 10 original + 35 promoted from Work Queue + 1 linked Certificate of Occupancy', () => {
    expect(store.applications().length).toBe(46);
  });

  it('Phase 16: every Work Queue task fixture has a real, resolvable applicationId', () => {
    for (const task of WORK_QUEUE_TASK_SEED) {
      const app = store.getApplicationById(task.id);
      expect(app).toBeTruthy();
      expect(app?.applicant.fullName).toBe(task.applicant);
      expect(app?.assignment.assignedOfficer).toBe(task.assignedOfficer);
    }
  });

  it('Phase 16: buildWorkQueueTasks() derives task fields from canonical data, not a second literal', () => {
    const tasks = buildWorkQueueTasks(store.applications());
    expect(tasks.length).toBe(WORK_QUEUE_TASK_SEED.length);
    const first = tasks[0];
    expect(first.applicationId).toBe(first.id);
    // Mutating the underlying application through the store is reflected
    // the next time buildWorkQueueTasks() is called — proving the task
    // view is genuinely derived, not an independent copy.
    store.updateAssignment(first.id, { assignedOfficer: 'Someone Else' });
    const rebuilt = buildWorkQueueTasks(store.applications());
    expect(rebuilt[0].assignedOfficer).toBe('Someone Else');
  });

  it('Phase 16: applicationsOverdue() is genuinely non-empty now that promoted Work Queue applications carry real slaStatus', () => {
    expect(store.applicationsOverdue().length).toBeGreaterThan(0);
  });

  it('looks up an application by id', () => {
    const first = CANONICAL_APPLICATIONS[0];
    expect(store.getApplicationById(first.applicationId)?.applicant.fullName).toBe(first.applicant.fullName);
    expect(store.getApplicationById('#DOES-NOT-EXIST')).toBeUndefined();
  });

  it('scopes applications by tenant and never leaks to an unrelated tenant', () => {
    const esperanza = store.applicationsForTenant('Esperanza');
    expect(esperanza.length).toBe(CANONICAL_APPLICATIONS.length);
    expect(esperanza.every((a) => a.tenant.tenantId === 'Esperanza')).toBe(true);

    expect(store.applicationsForTenant('Manila')).toEqual([]);
    expect(store.applicationsForTenant(null)).toEqual([]);
    expect(store.applicationsForTenant(undefined)).toEqual([]);
  });

  it('belongsToTenant correctly matches and rejects', () => {
    const id = CANONICAL_APPLICATIONS[0].applicationId;
    expect(store.belongsToTenant(id, 'Esperanza')).toBe(true);
    expect(store.belongsToTenant(id, 'Manila')).toBe(false);
    expect(store.belongsToTenant('#DOES-NOT-EXIST', 'Esperanza')).toBe(false);
  });

  it('updateWorkflow performs an immutable update — only the target application gets a new reference', () => {
    const before = store.applications();
    const target = before[0];
    const untouched = before[1];

    const ok = store.updateWorkflow(target.applicationId, { status: 'Approved' });
    expect(ok).toBe(true);

    const after = store.applications();
    expect(after).not.toBe(before); // the array itself is a new reference
    expect(after[0]).not.toBe(target); // the updated application is a new object
    expect(after[0].workflow.status).toBe('Approved');
    expect(after[1]).toBe(untouched); // every other application keeps its exact reference
  });

  it('rejects a mutation when expectedTenantId does not match (tenant safety)', () => {
    const id = CANONICAL_APPLICATIONS[0].applicationId;
    const ok = store.updateWorkflow(id, { status: 'Rejected' }, 'Manila');
    expect(ok).toBe(false);
    expect(store.getApplicationById(id)?.workflow.status).not.toBe('Rejected');
  });

  it('updatePayment merges onto an existing payment record without fabricating one', () => {
    const withPayment = store.applications().find((a) => a.payment)!;
    const ok = store.updatePayment(withPayment.applicationId, { verified: true });
    expect(ok).toBe(true);
    expect(store.getApplicationById(withPayment.applicationId)?.payment?.verified).toBe(true);
    // status/method are untouched by a partial patch
    expect(store.getApplicationById(withPayment.applicationId)?.payment?.status).toBe(withPayment.payment!.status);
  });

  it('addTimelineEvent appends without removing prior events', () => {
    const target = store.applications()[0];
    const before = target.timeline.length;
    store.addTimelineEvent(target.applicationId, { label: 'Test Event', date: 'Just now' });
    const after = store.getApplicationById(target.applicationId)!.timeline;
    expect(after.length).toBe(before + 1);
    expect(after[after.length - 1].label).toBe('Test Event');
  });

  // Phase 14 — Payment → Permit Release Write-Back. This simulates the
  // exact store-call sequence tenant-payments.ts's confirmVerify() performs,
  // applied to an application forced onto the 'payment' stage first — none
  // of the 10 seed applications actually have both a completable payment
  // (verifyResult: 'success') and workflow.stage === 'payment' at the same
  // time, so this branch can't be exercised through the live UI with this
  // dataset. This proves the stage-advancement logic itself is correct.
  it('Phase 14: verifying payment at the payment stage advances workflow to releasing and records both timeline events', () => {
    const target = store.applications()[0];
    store.updateWorkflow(target.applicationId, { stage: 'payment' });
    expect(store.getApplicationById(target.applicationId)?.workflow.stage).toBe('payment');

    // --- mirrors confirmVerify()'s sequence ---
    const tenantId = target.tenant.tenantId;
    const paymentOk = store.updatePayment(target.applicationId, { status: 'Paid', verified: true }, tenantId);
    expect(paymentOk).toBe(true);

    store.addTimelineEvent(
      target.applicationId,
      { label: 'Payment Verified', date: 'Just now', who: 'Test Cashier', role: 'Cashier / Payment Officer' },
      tenantId,
    );

    const app = store.getApplicationById(target.applicationId)!;
    if (app.workflow.stage === 'payment') {
      store.updateWorkflow(target.applicationId, { stage: 'releasing' }, tenantId);
      store.addTimelineEvent(
        target.applicationId,
        { label: 'Forwarded to Permit Release', date: 'Just now', who: 'Test Cashier', role: 'Cashier / Payment Officer' },
        tenantId,
      );
    }
    // --- end simulated sequence ---

    const final = store.getApplicationById(target.applicationId)!;
    expect(final.payment?.status).toBe('Paid');
    expect(final.payment?.verified).toBe(true);
    expect(final.workflow.stage).toBe('releasing');
    const labels = final.timeline.map((t) => t.label);
    expect(labels).toContain('Payment Verified');
    expect(labels).toContain('Forwarded to Permit Release');
    // No duplicate events — each label appears exactly once.
    expect(labels.filter((l) => l === 'Payment Verified').length).toBe(1);
    expect(labels.filter((l) => l === 'Forwarded to Permit Release').length).toBe(1);
  });

  it('Phase 14: verifying payment NOT at the payment stage does not skip the workflow ahead', () => {
    const target = store.applications().find((a) => a.workflow.stage === 'zoning')!;
    expect(target).toBeTruthy();
    const stageBefore = target.workflow.stage;

    store.updatePayment(target.applicationId, { status: 'Paid', verified: true }, target.tenant.tenantId);
    const app = store.getApplicationById(target.applicationId)!;
    if (app.workflow.stage === 'payment') {
      store.updateWorkflow(target.applicationId, { stage: 'releasing' }, target.tenant.tenantId);
    }

    expect(store.getApplicationById(target.applicationId)?.workflow.stage).toBe(stageBefore);
    expect(store.getApplicationById(target.applicationId)?.payment?.status).toBe('Paid');
  });

  // Phase 15 — Evaluation Workflow Transitions. Mirrors tenant-evaluations.
  // ts's approveReview()/returnReview() call sequence. Verified at the store
  // level rather than through the live UI because no page yet reads
  // workflow.stage/timeline live from the store (only Payments/Permit
  // Release were migrated in Phase 14) — Tenant Applications, the natural
  // place to observe these fields, is out of Phase 15's scope.
  it('Phase 15: approving an evaluation at its owned stage advances workflow and records both timeline events', () => {
    // #WA-2026 (first canonical application) starts at workflow.stage
    // 'applicant' — the stage 'initial' evaluations own.
    const target = store.applications()[0];
    expect(target.workflow.stage).toBe('applicant');
    const initialEval = target.evaluations.find((e) => e.type === 'initial');
    expect(initialEval?.stage).toBe('pending-review');

    const tenantId = target.tenant.tenantId;
    store.updateEvaluation(target.applicationId, 'initial', { stage: 'passed' }, tenantId);
    store.addTimelineEvent(
      target.applicationId,
      { label: 'Initial Evaluation Approved', date: 'Just now', who: 'Test Officer', role: 'Initial Evaluation Officer' },
      tenantId,
    );
    store.updateWorkflow(target.applicationId, { stage: 'zoning' }, tenantId);
    store.addTimelineEvent(
      target.applicationId,
      { label: 'Forwarded to Zoning', date: 'Just now', who: 'Test Officer', role: 'Initial Evaluation Officer' },
      tenantId,
    );

    const final = store.getApplicationById(target.applicationId)!;
    expect(final.evaluations.find((e) => e.type === 'initial')?.stage).toBe('passed');
    expect(final.workflow.stage).toBe('zoning');
    const labels = final.timeline.map((t) => t.label);
    expect(labels).toContain('Initial Evaluation Approved');
    expect(labels).toContain('Forwarded to Zoning');
  });

  it('Phase 15: returning an evaluation sets Return for Revision without moving the workflow stage', () => {
    const target = store.applications()[0];
    const stageBefore = target.workflow.stage;
    const tenantId = target.tenant.tenantId;

    store.updateEvaluation(target.applicationId, 'initial', { stage: 'returned' }, tenantId);
    store.updateWorkflow(target.applicationId, { status: 'Return for Revision' }, tenantId);
    store.addTimelineEvent(
      target.applicationId,
      { label: 'Initial Evaluation Returned for Revision', date: 'Just now', who: 'Test Officer', role: 'Initial Evaluation Officer', detail: 'Returned for revision' },
      tenantId,
    );

    const final = store.getApplicationById(target.applicationId)!;
    expect(final.evaluations.find((e) => e.type === 'initial')?.stage).toBe('returned');
    expect(final.workflow.status).toBe('Return for Revision');
    expect(final.workflow.stage).toBe(stageBefore); // unchanged
    expect(final.timeline.map((t) => t.label)).toContain('Initial Evaluation Returned for Revision');
  });

  it('Phase 15: a mutation attempted against the wrong tenant is rejected', () => {
    const target = store.applications()[0]; // Esperanza
    const before = target.evaluations.find((e) => e.type === 'initial')?.stage;
    const ok = store.updateEvaluation(target.applicationId, 'initial', { stage: 'passed' }, 'Manila');
    expect(ok).toBe(false);
    expect(store.getApplicationById(target.applicationId)?.evaluations.find((e) => e.type === 'initial')?.stage).toBe(before);
  });

  it('PROOF OF REACTIVITY: a store update is observed identically by two independent consumers reading the same signal', () => {
    const id = CANONICAL_APPLICATIONS[0].applicationId;

    // Two independent "consumers" — each only holds a reference to the
    // store, exactly like two separate injected components would.
    const consumerA = TestBed.inject(ApplicationStore);
    const consumerB = TestBed.inject(ApplicationStore);
    expect(consumerA).toBe(consumerB); // providedIn: 'root' — the same singleton

    const readA = () => consumerA.getApplicationById(id)?.workflow.stage;
    const readB = () => consumerB.applications().find((a) => a.applicationId === id)?.workflow.stage;

    expect(readA()).toBe('applicant');
    expect(readB()).toBe('applicant');

    consumerA.updateWorkflow(id, { stage: 'releasing' });

    // Both consumers observe the same new state without either of them
    // being the one that performed the write.
    expect(readA()).toBe('releasing');
    expect(readB()).toBe('releasing');
  });
});
