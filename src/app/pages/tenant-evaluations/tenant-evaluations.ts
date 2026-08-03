import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { Pagination } from '../../shared/pagination/pagination';
import { RoleGate } from '../../core/role-gate.directive';
import { Toast } from '../../core/toast';
import { EmptyState } from '../../shared/empty-state/empty-state';
import {
  EVAL_TYPE_CARDS,
  EVAL_ROWS,
  ringStatsFor,
  STAGE_TABS,
  MOCK_REVIEW_CHECKLIST,
  EvalTypeCard,
  EvalRow,
  Stage,
} from './evaluations-data';

type View = 'list' | 'detail';

@Component({
  selector: 'app-tenant-evaluations',
  imports: [Topbar, Icon, Avatar, DonutChart, Pagination, FormsModule, RoleGate, EmptyState],
  templateUrl: './tenant-evaluations.html',
  styleUrl: './tenant-evaluations.scss',
})
export class TenantEvaluations {
  private readonly toast = inject(Toast);

  protected readonly cards = EVAL_TYPE_CARDS;
  protected readonly rows = signal<EvalRow[]>([...EVAL_ROWS]);
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

  protected readonly view = signal<View>('list');
  protected readonly selectedCard = signal<EvalTypeCard | null>(null);

  protected readonly breadcrumbs = computed(() => {
    const card = this.selectedCard();
    if (this.view() !== 'detail' || !card) return [];
    return [
      { label: 'Evaluations', action: () => this.backToList() },
      { label: card.title },
    ];
  });
  protected readonly activeStage = signal<Stage>('pending-review');
  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly searchTerm = signal('');

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
    this.searchTerm.set('');
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
    this.rows.update((list) =>
      list.map((r) => (r === row ? { ...r, stage: 'passed', status: 'Approved' } : r)),
    );
    this.toast.show(`${row.id} approved.`);
    this.closeReview();
  }

  returnReview(): void {
    const row = this.reviewRow();
    if (!row) return;
    this.rows.update((list) =>
      list.map((r) => (r === row ? { ...r, stage: 'returned', status: 'Return for Revision' } : r)),
    );
    this.toast.show(`${row.id} returned for revision.`);
    this.closeReview();
  }
}
