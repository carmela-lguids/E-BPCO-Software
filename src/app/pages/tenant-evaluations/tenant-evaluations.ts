import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { Pagination } from '../../shared/pagination/pagination';
import { RoleGate } from '../../core/role-gate.directive';
import { Toast } from '../../core/toast';
import { Session } from '../../core/session';
import { EmptyState } from '../../shared/empty-state/empty-state';
import {
  EVAL_TYPE_CARDS,
  ringStatsFor,
  STAGE_TABS,
  MOCK_REVIEW_CHECKLIST,
  EvalTypeCard,
  EvalRow,
  Stage,
  EvalTypeKey,
  STAGE_STATUS,
} from './evaluations-data';
import { AppStage, STAGE_ORDER } from '../tenant-applications/applications-data';
import { ApplicationStore } from '../../core/application-store';
import { CanonicalApplication } from '../../core/application-model';
import { ROLES } from '../../core/roles';

// Phase 15 — Evaluation Workflow Transitions. Each evaluation type owns one
// existing pipeline stage (STAGE_ORDER, applications-data.ts) — this is the
// same mapping tenant-applications.ts's EVALUATOR_EVAL_TYPE already implies
// in reverse (which role/evalType is "at" which stage). Approval only
// advances workflow.stage to the next STAGE_ORDER entry if the application
// is actually at the stage this evalType owns today — not an invented
// transition, just STAGE_ORDER's existing sequence applied consistently.
// 'final' has no owning role in this page's RoleGate (`['obo',
// 'initial-eval', 'zoning', 'fire-safety']` excludes it) so it's included
// here for completeness but is never reachable through the live UI.
const EVAL_TYPE_OWNED_STAGE: Record<EvalTypeKey, AppStage> = {
  initial: 'applicant',
  zoning: 'zoning',
  fire: 'fire-safety',
  obo: 'obo-review',
  final: 'building-official',
};

function nextStage(stage: AppStage): AppStage | null {
  const idx = STAGE_ORDER.findIndex((s) => s.key === stage);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1].key;
}

function stageLabel(stage: AppStage): string {
  return STAGE_ORDER.find((s) => s.key === stage)?.label ?? stage;
}

type View = 'list' | 'detail';

// Phase 6 — Evaluations Migration. This page's row list is now sourced
// from the canonical dataset instead of this module's own EVAL_ROWS.
// EVAL_ROWS was built (evaluations-data.ts) as evalType-major: every
// evalType's 10 rows, in application order, back to back — this rebuilds
// that exact ordering from CANONICAL_APPLICATIONS so the table renders in
// the same row order as before this migration. status is derived from
// stage via the same STAGE_STATUS map evaluations-data.ts already used,
// not duplicated a second time.
function fromCanonical(apps: CanonicalApplication[], typeOrder: EvalTypeKey[]): EvalRow[] {
  return typeOrder.flatMap((evalType) =>
    apps.flatMap((app) => {
      const ev = app.evaluations.find((e) => e.type === evalType);
      if (!ev) return [];
      return [
        {
          id: app.applicationId,
          applicant: app.applicant.fullName,
          missingDocuments: ev.missingDocuments ?? 0,
          type: app.project.type,
          dateSubmitted: app.dateSubmitted,
          officer: ev.officer ?? '',
          status: STAGE_STATUS[ev.stage],
          stage: ev.stage,
          evalType: ev.type,
        },
      ];
    }),
  );
}

@Component({
  selector: 'app-tenant-evaluations',
  imports: [Topbar, Icon, Avatar, DonutChart, Pagination, FormsModule, RoleGate, EmptyState, RouterLink],
  templateUrl: './tenant-evaluations.html',
  styleUrl: './tenant-evaluations.scss',
})
export class TenantEvaluations {
  private readonly toast = inject(Toast);
  private readonly session = inject(Session);
  private readonly applicationStore = inject(ApplicationStore);
  private readonly route = inject(ActivatedRoute);

  // Phase 23 — Evaluations + Payments Linking. Work Queue's "Continue
  // Evaluation" (Phase 22) links here with ?applicationId=... — a one-shot
  // "arrived here about this application" hint, read once (this page has
  // no per-instance route-param navigation the way the detail route does,
  // so a snapshot read is enough, unlike tenant-applications.ts's reactive
  // toSignal()). Pre-fills the existing search box, reusing the filter
  // mechanism already there rather than inventing new UI.
  private readonly routeApplicationId = this.route.snapshot.queryParamMap.get('applicationId');

  // Phase 2 (Connect Work Queue Actions) — ?evalType=... is the specific
  // evaluation stage Work Queue already knows this task is actionable at
  // (work-queue-data.ts's evalTypeForStage, derived from the task's own
  // currentStage, not a guess). When present and valid, opens straight into
  // that card instead of leaving the officer on the card-selection screen —
  // "Continue Evaluation" landing on the correct evaluation stage, not just
  // a filtered list of every stage.
  private readonly routeEvalType = this.route.snapshot.queryParamMap.get('evalType');
  private readonly routeEvalCard = this.routeEvalType
    ? (EVAL_TYPE_CARDS.find((c) => c.key === this.routeEvalType) ?? null)
    : null;

  // ?stage= (only meaningful alongside a resolved routeEvalCard) — e.g.
  // Work Queue's "Resume Review" already knows the row is at the 'returned'
  // stage, not the default 'pending-review'.
  private readonly VALID_STAGES: readonly Stage[] = ['pending-review', 'under-review', 'returned', 'passed'];
  private readonly routeStage = (() => {
    const stage = this.route.snapshot.queryParamMap.get('stage');
    return this.routeEvalCard && this.VALID_STAGES.includes(stage as Stage) ? (stage as Stage) : null;
  })();

  // Phase 15 — live projection of ApplicationStore, tenant-scoped, same
  // pattern as tenant-payments.ts's Phase 14 migration: a computed() so
  // this page reflects its own approveReview()/returnReview() writes
  // immediately, not just on next navigation.
  protected readonly rows = computed<EvalRow[]>(() =>
    fromCanonical(
      this.applicationStore.applicationsForTenant(this.session.activeTenant()),
      EVAL_TYPE_CARDS.map((c) => c.key),
    ),
  );

  // EVAL_TYPE_CARDS.count (evaluations-data.ts) was a static count computed
  // once from that module's own EVAL_ROWS, independent of tenant — a latent
  // gap since Phase 6 (never live-tested against a non-Esperanza account
  // until now): every tenant saw the same "10" on every card regardless of
  // whether they had any data at all. Fixed here since this phase already
  // tenant-scopes this exact page's row data — everything except `count`
  // (title/description/icon/accent/tint) is still the same static, cosmetic
  // metadata from EVAL_TYPE_CARDS.
  protected readonly cards = computed<EvalTypeCard[]>(() =>
    EVAL_TYPE_CARDS.map((c) => ({ ...c, count: this.rows().filter((r) => r.evalType === c.key).length })),
  );

  protected readonly stageTabs = STAGE_TABS;

  protected readonly ringStats = computed(() => {
    const card = this.selectedCard();
    return card ? ringStatsFor(card.key) : [];
  });

  protected ringSegments(stat: ReturnType<typeof ringStatsFor>[number]): DonutSegment[] {
    return [
      { label: 'value', value: stat.pct, color: stat.color },
      { label: 'rest', value: 100 - stat.pct, color: stat.light },
    ];
  }

  // Phase 2 (Connect Work Queue Actions) — arriving with a valid ?evalType=
  // opens straight into that card (view 'detail') instead of the card menu;
  // activeStage/searchTerm/page/selectedRowIds below already default to
  // exactly what openCard() would set them to, so no extra wiring is
  // needed for those to match navigating in versus clicking a card by hand.
  protected readonly view = signal<View>(this.routeEvalCard ? 'detail' : 'list');
  protected readonly selectedCard = signal<EvalTypeCard | null>(this.routeEvalCard);

  protected readonly breadcrumbs = computed(() => {
    const card = this.selectedCard();
    if (this.view() !== 'detail' || !card) return [];
    return [
      { label: 'Evaluations', action: () => this.backToList() },
      { label: card.title },
    ];
  });
  protected readonly activeStage = signal<Stage>(this.routeStage ?? 'pending-review');
  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly searchTerm = signal(this.routeApplicationId ?? '');

  protected readonly stageRows = computed(() => {
    const card = this.selectedCard();
    if (!card) return [];
    const term = this.searchTerm().trim().toLowerCase();
    return this.rows().filter((r) => {
      if (r.evalType !== card.key) return false;
      if (r.stage !== this.activeStage()) return false;
      if (!term) return true;
      return (
        r.id.toLowerCase().includes(term) ||
        r.applicant.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term)
      );
    });
  });

  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.stageRows().slice(start, start + this.pageSize);
  });

  // --- Row selection + bulk/toolbar export ---
  protected readonly selectedRowIds = signal<Set<string>>(new Set());

  protected readonly allPagedSelected = computed(() => {
    const paged = this.pagedRows();
    if (paged.length === 0) return false;
    const selected = this.selectedRowIds();
    return paged.every((r) => selected.has(r.id));
  });

  toggleSelectAllPaged(): void {
    const paged = this.pagedRows();
    const allSelected = this.allPagedSelected();
    this.selectedRowIds.update((set) => {
      const next = new Set(set);
      for (const r of paged) {
        if (allSelected) next.delete(r.id);
        else next.add(r.id);
      }
      return next;
    });
  }

  toggleSelectRow(id: string): void {
    this.selectedRowIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isRowSelected(id: string): boolean {
    return this.selectedRowIds().has(id);
  }

  exportRows(): void {
    const count = this.selectedRowIds().size || this.stageRows().length;
    this.toast.show(`${count} evaluation${count === 1 ? '' : 's'} exported.`);
    this.selectedRowIds.set(new Set());
  }

  openCard(card: EvalTypeCard): void {
    this.selectedCard.set(card);
    this.activeStage.set('pending-review');
    // Preserves the route-provided applicationId filter across card
    // switches (unchanged '' reset for the normal, no-query-param case).
    this.searchTerm.set(this.routeApplicationId ?? '');
    this.page.set(1);
    this.selectedRowIds.set(new Set());
    this.view.set('detail');
  }

  selectStage(stage: Stage): void {
    this.activeStage.set(stage);
    this.page.set(1);
    this.selectedRowIds.set(new Set());
  }

  onSearchChange(): void {
    this.page.set(1);
  }

  backToList(): void {
    this.view.set('list');
    this.selectedCard.set(null);
  }

  // --- Review modal (mock example — no per-row detail data on this page) ---
  protected readonly reviewChecklist = MOCK_REVIEW_CHECKLIST;
  protected readonly reviewRow = signal<EvalRow | null>(null);

  openReview(row: EvalRow): void {
    this.reviewRow.set(row);
  }

  closeReview(): void {
    this.reviewRow.set(null);
  }

  approveReview(): void {
    const row = this.reviewRow();
    if (!row) return;

    const tenantId = this.session.activeTenant();
    const app = this.applicationStore.getApplicationById(row.id);
    if (!app) {
      this.closeReview();
      return;
    }

    const ok = this.applicationStore.updateEvaluation(row.id, row.evalType, { stage: 'passed' }, tenantId);
    if (!ok) {
      this.closeReview();
      return;
    }

    const actor = this.session.currentAccount().fullName;
    const actorRole = ROLES[this.session.currentRole()]?.label ?? 'Evaluator';
    const evalTitle = EVAL_TYPE_CARDS.find((c) => c.key === row.evalType)?.title ?? 'Evaluation';
    this.applicationStore.addTimelineEvent(
      row.id,
      { label: `${evalTitle} Approved`, date: 'Just now', who: actor, role: actorRole },
      tenantId,
    );

    // Only advance the pipeline if this application is actually at the
    // stage this evaluation type owns today — see EVAL_TYPE_OWNED_STAGE's
    // comment above. workflow.status (the overall Pending/Approved/Rejected
    // decision) is deliberately left untouched here — deciding when an
    // application becomes officially Approved is a business decision this
    // phase does not automate.
    const ownedStage = EVAL_TYPE_OWNED_STAGE[row.evalType];
    if (app.workflow.stage === ownedStage) {
      const next = nextStage(ownedStage);
      if (next) {
        this.applicationStore.updateWorkflow(row.id, { stage: next }, tenantId);
        this.applicationStore.addTimelineEvent(
          row.id,
          { label: `Forwarded to ${stageLabel(next)}`, date: 'Just now', who: actor, role: actorRole },
          tenantId,
        );
      }
    }

    this.toast.show(`${row.id} approved.`);
    this.closeReview();
  }

  returnReview(): void {
    const row = this.reviewRow();
    if (!row) return;

    const tenantId = this.session.activeTenant();
    const app = this.applicationStore.getApplicationById(row.id);
    if (!app) {
      this.closeReview();
      return;
    }

    const ok = this.applicationStore.updateEvaluation(row.id, row.evalType, { stage: 'returned' }, tenantId);
    if (!ok) {
      this.closeReview();
      return;
    }
    // 'Return for Revision' already exists precisely for this case
    // (core/application-model.ts's ApplicationDecisionStatus) — this
    // mirrors what this page's status column already showed pre-Phase-15,
    // just written to the shared store instead of a local-only signal.
    // workflow.stage is left unchanged: a return means revision is needed
    // at the current stage, not that the pipeline position resets.
    this.applicationStore.updateWorkflow(row.id, { status: 'Return for Revision' }, tenantId);

    const actor = this.session.currentAccount().fullName;
    const actorRole = ROLES[this.session.currentRole()]?.label ?? 'Evaluator';
    const evalTitle = EVAL_TYPE_CARDS.find((c) => c.key === row.evalType)?.title ?? 'Evaluation';
    this.applicationStore.addTimelineEvent(
      row.id,
      {
        label: `${evalTitle} Returned for Revision`,
        date: 'Just now',
        who: actor,
        role: actorRole,
        detail: 'Returned for revision',
      },
      tenantId,
    );

    this.toast.show(`${row.id} returned for revision.`);
    this.closeReview();
  }
}
