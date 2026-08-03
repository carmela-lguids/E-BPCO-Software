import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Toast } from '../../core/toast';
import { Session } from '../../core/session';
import { RoleKey } from '../../core/roles';
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
  APP_ROWS,
  AppRow,
  AppDetail,
  buildDetailFor,
  DOCUMENTS,
  DocumentItem,
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

type View = 'list' | 'detail' | 'info' | 'evaluations' | 'evaluation-detail';
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
  imports: [Topbar, Icon, Avatar, DilgSeal, DonutChart, Pagination, FormsModule, RoleGate, MyQueueStrip, EmptyState, FocusTrapDirective],
  templateUrl: './tenant-applications.html',
  styleUrl: './tenant-applications.scss',
})
export class TenantApplications {
  private readonly toast = inject(Toast);
  private readonly session = inject(Session);
  private readonly searchIndex = inject(SearchIndex);

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

  protected readonly rows = signal<AppRow[]>([...APP_ROWS]);
  protected readonly documents = DOCUMENTS;
  protected readonly comments = COMMENTS;
  protected readonly timeline = TIMELINE;
  protected readonly sharedTimeline = SHARED_TIMELINE;
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

  openDetail(row: AppRow): void {
    this.selectedRow.set(row);
    this.detailTab.set('timeline');
    this.view.set('detail');
    this.searchIndex.recordView({
      id: `app-${row.id}`,
      title: row.applicant,
      subtitle: `${row.id} · ${row.type} · ${row.city}`,
      category: 'Application',
      route: '/tenant/applications',
      icon: 'user',
    });
  }

  selectDetailTab(tab: DetailTab): void {
    this.detailTab.set(tab);
  }

  backToList(): void {
    this.view.set('list');
    this.selectedRow.set(null);
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

  openDocPreview(item: ChecklistItem): void {
    if (!item.filename) return;
    this.previewItem.set(item);
  }

  closeDocPreview(): void {
    this.previewItem.set(null);
  }

  // --- Documents tab preview (mock document sheet) ---
  protected readonly previewDocument = signal<DocumentItem | null>(null);

  openDocumentPreview(doc: DocumentItem): void {
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
    this.rows.update((list) => list.map((r) => (r === original ? updated : r)));
    this.closeRowModal();
  }

  confirmDeleteRow(): void {
    const original = this.modalRow();
    if (!original) return;
    this.rows.update((list) => list.filter((r) => r !== original));
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
    this.rows.update((list) =>
      list.map((r) => (targets.has(r.id) ? { ...r, officer } : r)),
    );
    this.selectedUnassignedIds.set(new Set());
    this.closeAssignDrawer();
  }
}
