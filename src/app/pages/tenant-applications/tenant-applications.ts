import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Toast } from '../../core/toast';
import { Session } from '../../core/session';
import { RoleKey, ROLES } from '../../core/roles';
import { ApplicationStore } from '../../core/application-store';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DilgSeal } from '../../shared/dilg-seal/dilg-seal';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { Pagination } from '../../shared/pagination/pagination';
import { RoleGate } from '../../core/role-gate.directive';
import { FocusTrapDirective } from '../../core/focus-trap.directive';
import { MyQueueStrip, QueueTile } from '../../shared/my-queue-strip/my-queue-strip';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { SearchIndex } from '../../core/search-index';
import { EVAL_ROWS, EvalTypeKey } from '../tenant-evaluations/evaluations-data';
import {
  AppRow,
  AppStatus,
  AppDetail,
  buildDetailFor,
  DOCUMENTS,
  COMMENTS,
  TIMELINE,
  SHARED_TIMELINE,
  EVAL_CARDS,
  EVAL_DETAILS,
  EvalKey,
  ChecklistItem,
  EVALUATOR_ROSTER,
  UNASSIGNED_DAYS,
  STAGE_ORDER,
  AppStage,
} from './applications-data';
import { ApplicationDocumentRequirement, CanonicalApplication } from '../../core/application-model';
import { castillaGroupsForTrack } from './castilla-document-requirements';

// Phase 4 — Tenant Applications Migration (initial canonical read). Phase
// 21 — Canonical Application Detail Route later moved `rows` from a static
// snapshot to a live ApplicationStore projection — see that field's own
// comment below for why. The AppRow mapping stays lossless either way.
//
// Row edits (saveRow/confirmDeleteRow/confirmAssign below) still only
// mutate this page's own local overlay, never the shared store — writing
// changes back into the shared canonical dataset remains out of scope.
const APP_STAGE_KEYS = new Set<string>(STAGE_ORDER.map((s) => s.key));
const APP_STATUSES = new Set<AppStatus>(['Approved', 'Pending', 'Rejected']);

function toAppStage(stage: string): AppStage {
  return APP_STAGE_KEYS.has(stage) ? (stage as AppStage) : 'applicant';
}

function toAppStatus(status: string): AppStatus {
  return APP_STATUSES.has(status as AppStatus) ? (status as AppStatus) : 'Pending';
}

// Phase 6 (Connect Status Changes Between Modules) — mirrors tenant-
// evaluations.ts's own EVAL_TYPE_OWNED_STAGE/nextStage/stageLabel (that
// file's local copy, not shared, matching this codebase's existing
// convention of each page keeping its own view of the same stage<->evalType
// relationship — see also work-queue-data.ts's evalTypeForStage). Needed so
// this page's own "Forward to X" button can perform the same real
// transition Evaluations' approveReview() already does, instead of being a
// button with no (click) handler at all.
const EVAL_TYPE_OWNED_STAGE: Record<EvalKey, AppStage> = {
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

// Phase 4 (Separate Building Permit and Occupancy) — display labels for
// OccupancyWorkflowStage (core/application-model.ts), the stage sequence
// given directly in the phase brief: Documentary Review -> Inspection ->
// FSIC -> Final Review -> Payment -> Release.
const OCCUPANCY_STAGE_LABEL: Record<string, string> = {
  'documentary-review': 'Documentary Review',
  inspection: 'Inspection',
  fsic: 'FSIC',
  'final-review': 'Final Review',
  payment: 'Payment',
  releasing: 'Release',
};

function fromCanonical(app: CanonicalApplication): AppRow {
  return {
    id: app.applicationId,
    applicant: app.applicant.fullName,
    city: app.property.city,
    type: app.project.type,
    dateSubmitted: app.dateSubmitted,
    officer: app.assignment.assignedOfficer ?? '',
    status: toAppStatus(app.workflow.status),
    currentStage: toAppStage(app.workflow.stage),
    permitTrack: app.permitTrack,
    relatedApplicationId: app.relatedApplicationId,
    occupancyStage: app.permitTrack === 'occupancy' ? app.workflow.stage : undefined,
  };
}

function buildQrCells(): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  const size = 15;
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed / 0x7fffffff) % 1;
  };
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const inFinder =
        (row < 4 && col < 4) || (row < 4 && col > size - 5) || (row > size - 5 && col < 4);
      if (inFinder) {
        continue;
      }
      if (rand() > 0.55) {
        cells.push({ x: col * 6 + 4, y: row * 6 + 4 });
      }
    }
  }
  for (const [ox, oy] of [
    [0, 0],
    [size - 4, 0],
    [0, size - 4],
  ]) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (r === 0 || r === 3 || c === 0 || c === 3) {
          cells.push({ x: (ox + c) * 6 + 4, y: (oy + r) * 6 + 4 });
        }
      }
    }
  }
  return cells;
}

type View = 'list' | 'detail' | 'info' | 'evaluations' | 'evaluation-detail' | 'unavailable';
type DetailTab = 'timeline' | 'documents' | 'comments';
type InfoSection = 'meta' | 'project' | 'type' | 'govid' | 'professional' | 'ownership';
type ListTab = 'all' | 'unassigned';

interface RingStat {
  label: string;
  value: string;
  color: string;
  light: string;
  pct: number;
}

const EVALUATOR_EVAL_TYPE: Partial<Record<RoleKey, EvalTypeKey>> = {
  'initial-eval': 'initial',
  zoning: 'zoning',
  'fire-safety': 'fire',
  obo: 'obo',
};

const STAGE_WAITING_LABEL: Record<AppStage, string> = {
  applicant: 'Applicant — documents pending',
  zoning: 'Zoning Evaluator',
  'fire-safety': 'Fire Safety Evaluator',
  'obo-review': 'OBO Reviewer',
  'building-official': 'Building Official',
  payment: 'Cashier — payment verification',
  releasing: 'Releasing Officer',
};

@Component({
  selector: 'app-tenant-applications',
  imports: [Topbar, Icon, Avatar, DilgSeal, DonutChart, Pagination, FormsModule, RoleGate, MyQueueStrip, EmptyState, FocusTrapDirective, RouterLink],
  templateUrl: './tenant-applications.html',
  styleUrl: './tenant-applications.scss',
})
export class TenantApplications {
  private readonly toast = inject(Toast);
  private readonly session = inject(Session);
  private readonly searchIndex = inject(SearchIndex);
  private readonly applicationStore = inject(ApplicationStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // The four evaluator roles all land on this page (no separate dashboard) —
  // this is their own stage queue, using the same real, stage-scoped data
  // as the Evaluations page, not a fake "assigned to you" count.
  protected readonly evaluatorEvalType = computed(() => EVALUATOR_EVAL_TYPE[this.session.currentRole()]);

  protected readonly queueTiles = computed<QueueTile[]>(() => {
    const evalType = this.evaluatorEvalType();
    if (!evalType) return [];
    const rows = EVAL_ROWS.filter((r) => r.evalType === evalType);
    const pending = rows.filter((r) => r.stage === 'pending-review' || r.stage === 'under-review').length;
    const returned = rows.filter((r) => r.stage === 'returned').length;
    const passed = rows.filter((r) => r.stage === 'passed').length;
    return [
      { label: 'Pending Review', value: String(pending), tone: 'warn' },
      { label: 'Returned', value: String(returned) },
      { label: 'Passed', value: String(passed), tone: 'good' },
    ];
  });

  // Phase 21 — Canonical Application Detail Route. The list is now a live
  // projection of ApplicationStore, tenant-scoped, same pattern as
  // tenant-payments.ts's Phase 14 migration — deferred until this phase
  // because the detail route (below) resolves through the store, and a
  // list still reading a static snapshot would risk disagreeing with its
  // own detail view once another module (Payments/Evaluations) writes a
  // change this page didn't originate.
  //
  // saveRow()/confirmDeleteRow()/confirmAssign() still only mutate this
  // page's own state, not the shared store — same local-only write
  // boundary every other migrated page has kept (see Phase 8's payments
  // refunds for the same pattern). Since `rows` is now recomputed fresh
  // from the store rather than a stable mutable array, these overlays are
  // keyed by applicationId rather than object reference, which no longer
  // survives a recompute.
  private readonly localOverrides = signal<Record<string, AppRow>>({});
  private readonly localDeletedIds = signal<Set<string>>(new Set());

  protected readonly rows = computed<AppRow[]>(() => {
    // Phase 4 (Separate Building Permit and Occupancy) — this table/its
    // AppStage progress tracker is Building-Permit-shaped; a Certificate of
    // Occupancy record's own stage vocabulary (documentary-review/fsic/
    // final-review) doesn't fit it and would otherwise silently fall back
    // to a misleading 'applicant' stage via toAppStage()'s AppStage guard.
    // Still directly reachable at its own canonical route via the Related
    // Application link (see selectedDetail's relatedApplication below) —
    // this only scopes the list/table view.
    const base = this.applicationStore
      .applicationsForTenant(this.session.activeTenant())
      .filter((a) => a.permitTrack === 'building-permit')
      .map(fromCanonical);
    const overrides = this.localOverrides();
    const deleted = this.localDeletedIds();
    return base.filter((r) => !deleted.has(r.id)).map((r) => overrides[r.id] ?? r);
  });
  protected readonly documents = DOCUMENTS;
  protected readonly comments = COMMENTS;
  protected readonly timeline = TIMELINE;

  // Phase 4 (Separate Building Permit and Occupancy) — reads the selected
  // application's OWN canonical documents (same pattern as sharedTimeline
  // above), not the static `documents` fallback. Required so a Certificate
  // of Occupancy record shows its own Occupancy Requirements/FSIC
  // documents instead of the Building Permit mock every BP record shares.
  protected readonly selectedDocuments = computed(() => {
    const row = this.selectedRow();
    const canonical = row && this.applicationStore.getApplicationById(row.id);
    return canonical ? canonical.documents : this.documents;
  });

  // Phase 3 (Castilla Document Requirements) — groups the Documents tab by
  // the same structured categories as castilla-document-requirements.ts,
  // in that file's own group order, instead of one flat undifferentiated
  // list. Phase 4 — now reads the selected application's own permitTrack,
  // so a Building Permit record shows its groups and a Certificate of
  // Occupancy record shows its own (Occupancy Requirements/FSIC), never
  // the other track's.
  protected readonly documentGroups = computed(() => {
    const track = this.selectedRow()?.permitTrack ?? 'building-permit';
    const docs = this.selectedDocuments();
    return castillaGroupsForTrack(track)
      .map((g) => ({ key: g.key, label: g.label, items: docs.filter((d) => d.group === g.key) }))
      .filter((g) => g.items.length > 0);
  });

  // Phase 7 — Workflow + Timeline Integration. The "Shared Evaluation
  // Timeline" panel reads the selected application's own canonical
  // timeline instead of the flat, module-level SHARED_TIMELINE constant.
  // Falls back to SHARED_TIMELINE only if a selected row's id somehow has
  // no canonical match (not expected in practice).
  protected readonly sharedTimeline = computed(() => {
    const row = this.selectedRow();
    const canonical = row && this.applicationStore.getApplicationById(row.id);
    return canonical ? canonical.timeline : SHARED_TIMELINE;
  });

  // Phase 21 — Canonical Application Detail Route. :applicationId (if
  // present) drives whether this page shows the list or a specific
  // application's detail — reactive via toSignal() rather than a one-time
  // snapshot, since navigating directly between two application detail
  // URLs (e.g. clicking a different row while already on a detail view)
  // reuses this component instance rather than recreating it; a snapshot
  // read once at construction would miss that second navigation.
  private readonly routeParamMap = toSignal(this.route.paramMap);
  protected readonly routeApplicationId = computed(() => this.routeParamMap()?.get('applicationId') ?? null);

  // Phase 2 (Connect Work Queue Actions) — an optional ?tab= query param so
  // a caller that already knows which tab is relevant (e.g. Work Queue's
  // Returned Applications linking straight to the document checklist and
  // revision history) can land there directly instead of always opening on
  // Timeline. Reactive for the same reason routeApplicationId is: this
  // route can be re-navigated onto itself with a different id/tab without
  // the component being recreated.
  private readonly routeQueryParamMap = toSignal(this.route.queryParamMap);
  private readonly VALID_DETAIL_TABS: readonly DetailTab[] = ['timeline', 'documents', 'comments'];
  protected readonly routeDetailTab = computed<DetailTab>(() => {
    const tab = this.routeQueryParamMap()?.get('tab');
    return this.VALID_DETAIL_TABS.includes(tab as DetailTab) ? (tab as DetailTab) : 'timeline';
  });

  // 'ok' when the id resolves to a real application in the active tenant;
  // 'not-found'/'wrong-tenant' drive the empty-state block in the template
  // instead of ever rendering another tenant's data or a broken detail view.
  protected readonly routeAccessState = computed<'ok' | 'not-found' | 'wrong-tenant' | null>(() => {
    const id = this.routeApplicationId();
    if (!id) return null;
    const app = this.applicationStore.getApplicationById(id);
    if (!app) return 'not-found';
    if (app.tenant.tenantId !== this.session.activeTenant()) return 'wrong-tenant';
    return 'ok';
  });

  constructor() {
    // Single source of truth for "what does the route say to show" — both
    // openDetail() and backToList() below only navigate; this effect is
    // the one place that actually updates selectedRow/view in response,
    // so a direct URL, a row click, and the browser back button all end
    // up going through the exact same resolution logic.
    effect(() => {
      const id = this.routeApplicationId();
      if (!id) {
        if (this.view() !== 'list') {
          this.view.set('list');
          this.selectedRow.set(null);
        }
        return;
      }
      const app = this.applicationStore.getApplicationById(id);
      if (!app || app.tenant.tenantId !== this.session.activeTenant()) {
        this.selectedRow.set(null);
        this.view.set('unavailable');
        return;
      }
      this.selectedRow.set(fromCanonical(app));
      this.detailTab.set(this.routeDetailTab());
      this.view.set('detail');
    });
  }

  protected readonly evalCards = EVAL_CARDS;
  protected readonly evalDetails = EVAL_DETAILS;

  protected readonly ringStats: RingStat[] = [
    { label: 'Pending', value: '524', color: '#f59e0b', light: '#fef3c7', pct: 45 },
    { label: 'Approved', value: '849', color: '#16a34a', light: '#dcfce7', pct: 75 },
    { label: 'Rejected', value: '376', color: '#991b1b', light: '#fdeceb', pct: 30 },
    { label: 'Total Applications', value: '1,749', color: '#2563eb', light: '#dbeafe', pct: 85 },
  ];

  protected ringSegments(stat: RingStat): DonutSegment[] {
    return [
      { label: 'value', value: stat.pct, color: stat.color },
      { label: 'rest', value: 100 - stat.pct, color: stat.light },
    ];
  }

  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly searchTerm = signal('');

  protected readonly filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const rows = this.rows();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(term) ||
        r.applicant.toLowerCase().includes(term) ||
        r.city.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term),
    );
  });

  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredRows().slice(start, start + this.pageSize);
  });

  protected onSearchChange(): void {
    this.page.set(1);
  }

  // --- Row selection + bulk/toolbar export (the "All Applications" table) ---
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
    const count = this.selectedRowIds().size || this.filteredRows().length;
    this.toast.show(`${count} application${count === 1 ? '' : 's'} exported.`);
    this.selectedRowIds.set(new Set());
  }

  protected readonly view = signal<View>('list');
  protected readonly detailTab = signal<DetailTab>('timeline');
  protected readonly openSection = signal<InfoSection | null>('meta');
  protected readonly selectedRow = signal<AppRow | null>(null);
  protected readonly selectedEval = signal<EvalKey | null>(null);
  protected readonly newMessage = signal('');
  protected readonly previewItem = signal<ChecklistItem | null>(null);

  protected readonly qrCells = buildQrCells();

  protected readonly selectedDetail = computed<AppDetail | null>(() => {
    const row = this.selectedRow();
    return row ? buildDetailFor(row) : null;
  });

  protected readonly stageOrder = STAGE_ORDER;

  // Phase 4 (Separate Building Permit and Occupancy) — the related BP/CO
  // record, resolved from the SAME canonical store every other "View
  // Application" link already uses (never a second, locally-reconstructed
  // copy). Works in both directions: a Building Permit's detail page can
  // link to its Certificate of Occupancy, and vice versa.
  protected readonly relatedApplication = computed(() => {
    const row = this.selectedRow();
    if (!row?.relatedApplicationId) return null;
    const app = this.applicationStore.getApplicationById(row.relatedApplicationId);
    return app ?? null;
  });

  protected occupancyStageLabel(stage: string | undefined): string {
    return (stage && OCCUPANCY_STAGE_LABEL[stage]) ?? 'Documentary Review';
  }

  protected readonly progressStages = computed(() => {
    const row = this.selectedRow();
    if (!row) return [];
    const currentIndex = STAGE_ORDER.findIndex((s) => s.key === row.currentStage);
    return STAGE_ORDER.map((stage, i) => {
      let state: 'done' | 'current' | 'upcoming' | 'rejected';
      if (row.status === 'Rejected' && i === currentIndex) state = 'rejected';
      else if (i < currentIndex || (row.status === 'Approved' && row.currentStage === 'releasing')) state = 'done';
      else if (i === currentIndex) state = 'current';
      else state = 'upcoming';
      return { ...stage, state };
    });
  });

  protected readonly waitingOn = computed(() => {
    const row = this.selectedRow();
    if (!row) return '';
    if (row.status === 'Approved') return 'No one — released to the applicant';
    if (row.status === 'Rejected') return 'No one — application closed';
    return STAGE_WAITING_LABEL[row.currentStage] ?? 'Applicant';
  });

  protected readonly activeEvalDetail = computed(() => {
    const key = this.selectedEval();
    return key ? this.evalDetails[key] : null;
  });

  // Phase 3 (Castilla Document Requirements) — Initial Evaluation must
  // clearly distinguish Complete Documents vs Incomplete Documents. Only
  // meaningful for the 'initial' evalType, whose checklist above is
  // specifically the documentary-completeness check; the other stages'
  // checklists are their own domain reviews, not a completeness gate.
  protected readonly initialDocumentsComplete = computed(() => {
    if (this.selectedEval() !== 'initial') return null;
    const checklist = this.activeEvalDetail()?.checklist ?? [];
    if (checklist.length === 0) return null;
    return checklist.every((item) => item.status === 'Approved');
  });

  protected readonly breadcrumbs = computed(() => {
    const row = this.selectedRow();
    if (!row) return [];
    const trail: { label: string; action?: () => void }[] = [
      { label: 'Applications', action: () => this.backToList() },
    ];
    const v = this.view();
    if (v === 'detail') {
      trail.push({ label: row.id });
      return trail;
    }
    trail.push({ label: row.id, action: () => this.view.set('detail') });
    if (v === 'info') {
      trail.push({ label: 'Info' });
    } else if (v === 'evaluations') {
      trail.push({ label: 'Evaluations' });
    } else if (v === 'evaluation-detail') {
      trail.push({ label: 'Evaluations', action: () => this.backFromEvalDetail() });
      trail.push({ label: this.activeEvalDetail()?.title ?? 'Evaluation' });
    }
    return trail;
  });

  // Phase 21 — navigates to the canonical detail route rather than setting
  // selectedRow/view directly; the constructor effect above is what
  // actually applies that state once the route updates, so this and a
  // direct URL visit resolve through the exact same logic.
  openDetail(row: AppRow): void {
    this.router.navigate(['/tenant/applications', row.id]);
    // Phase 25 — route points at the canonical Application Detail (real
    // applicationId) rather than the bare list, and shares its `id`/
    // category with tenant-payments.ts's own recordView() call so viewing
    // the same application from either module collapses into one Recently
    // Viewed entry instead of two.
    this.searchIndex.recordView({
      id: `app-${row.id}`,
      title: row.applicant,
      subtitle: `${row.id} · ${row.type} · ${row.city}`,
      category: 'Application',
      route: `/tenant/applications/${encodeURIComponent(row.id)}`,
      icon: 'user',
    });
  }

  selectDetailTab(tab: DetailTab): void {
    this.detailTab.set(tab);
  }

  backToList(): void {
    this.router.navigate(['/tenant/applications']);
  }

  openInfo(): void {
    this.view.set('info');
  }

  backFromInfo(): void {
    this.view.set('detail');
  }

  exportApplicantInfo(detail: AppDetail): void {
    this.toast.show(`${detail.row.id} info sheet exported.`);
  }

  toggleSection(section: InfoSection): void {
    this.openSection.update((current) => (current === section ? null : section));
  }

  openEvaluations(): void {
    this.view.set('evaluations');
  }

  backFromEvaluations(): void {
    this.view.set('detail');
  }

  openEvalDetail(key: EvalKey): void {
    this.selectedEval.set(key);
    this.view.set('evaluation-detail');
  }

  backFromEvalDetail(): void {
    this.view.set('evaluations');
  }

  // Phase 6 (Connect Status Changes Between Modules) — the "Forward to X"
  // button (cfg.primaryActionLabel) previously had no (click) handler at
  // all: clicking it did nothing, on this page or anywhere else. This
  // performs the same real transition tenant-evaluations.ts's
  // approveReview() already does for the same evalType/canonical record —
  // writing through ApplicationStore so Work Queue, Evaluations, Workflow
  // Monitor, and Dashboard all reactively update, not just this page.
  //
  // Only the 10 original applications (applications-data.ts's APP_ROWS)
  // carry real evaluations data (evaluationsFor(), core/application-data.ts)
  // — the 35 promoted from Work Queue and the one Certificate of Occupancy
  // record don't, honestly, since none of those ever had real evaluation
  // rows to begin with (Phase 16's own finding). For those, this reports
  // that plainly instead of pretending a transition happened.
  advanceEvaluation(): void {
    const row = this.selectedRow();
    const key = this.selectedEval();
    if (!row || !key) return;

    const tenantId = this.session.activeTenant();
    const app = this.applicationStore.getApplicationById(row.id);
    if (!app) return;

    const ok = this.applicationStore.updateEvaluation(row.id, key, { stage: 'passed' }, tenantId);
    if (!ok) {
      this.toast.show(`${row.id} has no active ${EVAL_CARDS.find((c) => c.key === key)?.title ?? 'evaluation'} record to forward.`);
      return;
    }

    const actor = this.session.currentAccount().fullName;
    const actorRole = ROLES[this.session.currentRole()]?.label ?? 'Evaluator';
    const evalTitle = EVAL_CARDS.find((c) => c.key === key)?.title ?? 'Evaluation';
    this.applicationStore.addTimelineEvent(row.id, { label: `${evalTitle} Approved`, date: 'Just now', who: actor, role: actorRole }, tenantId);

    const ownedStage = EVAL_TYPE_OWNED_STAGE[key];
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

    this.toast.show(`${row.id} forwarded.`);
    this.backFromEvalDetail();
  }

  // Phase 6 — mirrors tenant-evaluations.ts's returnReview(): workflow.stage
  // is left unchanged (a return means revision is needed at the current
  // stage, not that the pipeline position resets), only the evaluation
  // record and overall decision status change, plus a timeline event.
  returnEvaluationForRevision(): void {
    const row = this.selectedRow();
    const key = this.selectedEval();
    if (!row || !key) return;

    const tenantId = this.session.activeTenant();
    const app = this.applicationStore.getApplicationById(row.id);
    if (!app) return;

    const ok = this.applicationStore.updateEvaluation(row.id, key, { stage: 'returned' }, tenantId);
    if (!ok) {
      this.toast.show(`${row.id} has no active ${EVAL_CARDS.find((c) => c.key === key)?.title ?? 'evaluation'} record to return.`);
      return;
    }
    this.applicationStore.updateWorkflow(row.id, { status: 'Return for Revision' }, tenantId);

    const actor = this.session.currentAccount().fullName;
    const actorRole = ROLES[this.session.currentRole()]?.label ?? 'Evaluator';
    const evalTitle = EVAL_CARDS.find((c) => c.key === key)?.title ?? 'Evaluation';
    this.applicationStore.addTimelineEvent(
      row.id,
      { label: `${evalTitle} Returned for Revision`, date: 'Just now', who: actor, role: actorRole, detail: 'Returned for revision' },
      tenantId,
    );

    this.toast.show(`${row.id} returned for revision.`);
    this.backFromEvalDetail();
  }

  openDocPreview(item: ChecklistItem): void {
    if (!item.filename) return;
    this.previewItem.set(item);
  }

  closeDocPreview(): void {
    this.previewItem.set(null);
  }

  // --- Documents tab preview (mock document sheet) ---
  // Phase 4 — ApplicationDocumentRequirement (not DocumentItem) since
  // selectedDocuments()/documentGroups() now read the selected
  // application's own canonical documents, which may be a Building Permit
  // or a Certificate of Occupancy record.
  protected readonly previewDocument = signal<ApplicationDocumentRequirement | null>(null);

  openDocumentPreview(doc: ApplicationDocumentRequirement): void {
    this.previewDocument.set(doc);
  }

  closeDocumentPreview(): void {
    this.previewDocument.set(null);
  }

  // --- Row actions (edit / delete) — the eye/view button already opens the detail page ---
  protected readonly rowModal = signal<'edit' | 'delete' | null>(null);
  protected readonly modalRow = signal<AppRow | null>(null);
  protected editRowForm: AppRow = {
    id: '',
    applicant: '',
    city: '',
    type: '',
    dateSubmitted: '',
    officer: '',
    status: 'Pending',
    currentStage: 'applicant',
  };

  editRow(row: AppRow): void {
    this.modalRow.set(row);
    this.editRowForm = { ...row };
    this.rowModal.set('edit');
  }

  deleteRow(row: AppRow): void {
    this.modalRow.set(row);
    this.rowModal.set('delete');
  }

  closeRowModal(): void {
    this.rowModal.set(null);
    this.modalRow.set(null);
  }

  saveRow(): void {
    const original = this.modalRow();
    if (!original) return;
    const updated = { ...this.editRowForm };
    this.localOverrides.update((map) => ({ ...map, [original.id]: updated }));
    this.closeRowModal();
  }

  confirmDeleteRow(): void {
    const original = this.modalRow();
    if (!original) return;
    this.localDeletedIds.update((set) => new Set(set).add(original.id));
    this.closeRowModal();
  }

  // --- Application Assignment (Volume III §01-20) ---
  // Kept as an "Unassigned" tab inside Applications rather than a separate
  // sidebar module — the request that owns this application already lives
  // here, and a second top-level nav entry would duplicate this list.
  protected readonly listTab = signal<ListTab>('all');
  protected readonly evaluatorRoster = EVALUATOR_ROSTER;

  protected readonly unassignedRows = computed(() => this.rows().filter((r) => !r.officer));

  protected daysUnassigned(row: AppRow): number {
    return UNASSIGNED_DAYS[row.id] ?? 0;
  }

  protected workloadFor(officer: string): number {
    return this.rows().filter((r) => r.officer === officer).length;
  }

  protected readonly suggestedEvaluator = computed(() => {
    const roster = this.evaluatorRoster;
    return roster.reduce((least, name) =>
      this.workloadFor(name) < this.workloadFor(least) ? name : least,
    );
  });

  setListTab(tab: ListTab): void {
    this.listTab.set(tab);
    this.selectedUnassignedIds.set(new Set());
  }

  protected readonly selectedUnassignedIds = signal<Set<string>>(new Set());

  toggleUnassignedSelect(id: string): void {
    this.selectedUnassignedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isUnassignedSelected(id: string): boolean {
    return this.selectedUnassignedIds().has(id);
  }

  protected readonly assignTargetRows = signal<AppRow[]>([]);
  protected readonly assignChoice = signal<string | null>(null);

  openAssignSingle(row: AppRow): void {
    this.assignTargetRows.set([row]);
    this.assignChoice.set(this.suggestedEvaluator());
  }

  openAssignSelected(): void {
    const ids = this.selectedUnassignedIds();
    const rows = this.unassignedRows().filter((r) => ids.has(r.id));
    if (rows.length === 0) return;
    this.assignTargetRows.set(rows);
    this.assignChoice.set(this.suggestedEvaluator());
  }

  closeAssignDrawer(): void {
    this.assignTargetRows.set([]);
    this.assignChoice.set(null);
  }

  chooseAssignee(name: string): void {
    this.assignChoice.set(name);
  }

  confirmAssign(): void {
    const targets = new Set(this.assignTargetRows().map((r) => r.id));
    const officer = this.assignChoice();
    if (!officer || targets.size === 0) return;
    this.localOverrides.update((map) => {
      const next = { ...map };
      for (const row of this.rows()) {
        if (targets.has(row.id)) next[row.id] = { ...row, officer };
      }
      return next;
    });
    this.selectedUnassignedIds.set(new Set());
    this.closeAssignDrawer();
  }
}
