import { Component, computed, signal } from '@angular/core';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { Pagination } from '../../shared/pagination/pagination';
import {
  EVAL_TYPE_CARDS,
  EVAL_ROWS,
  EVAL_RING_STATS,
  STAGE_TABS,
  EvalTypeCard,
  Stage,
} from './evaluations-data';

type View = 'list' | 'detail';

@Component({
  selector: 'app-tenant-evaluations',
  imports: [Topbar, Icon, Avatar, DonutChart, Pagination],
  templateUrl: './tenant-evaluations.html',
  styleUrl: './tenant-evaluations.scss',
})
export class TenantEvaluations {
  protected readonly cards = EVAL_TYPE_CARDS;
  protected readonly rows = EVAL_ROWS;
  protected readonly ringStats = EVAL_RING_STATS;
  protected readonly stageTabs = STAGE_TABS;

  protected ringSegments(stat: (typeof EVAL_RING_STATS)[number]): DonutSegment[] {
    return [
      { label: 'value', value: stat.pct, color: stat.color },
      { label: 'rest', value: 100 - stat.pct, color: stat.light },
    ];
  }

  protected readonly view = signal<View>('list');
  protected readonly selectedCard = signal<EvalTypeCard | null>(null);
  protected readonly activeStage = signal<Stage>('pending-review');
  protected readonly page = signal(1);
  protected readonly pageSize = 10;

  protected readonly stageRows = computed(() =>
    this.rows.filter((r) => r.stage === this.activeStage()),
  );

  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.stageRows().slice(start, start + this.pageSize);
  });

  openCard(card: EvalTypeCard): void {
    this.selectedCard.set(card);
    this.activeStage.set('pending-review');
    this.page.set(1);
    this.view.set('detail');
  }

  selectStage(stage: Stage): void {
    this.activeStage.set(stage);
    this.page.set(1);
  }

  backToList(): void {
    this.view.set('list');
    this.selectedCard.set(null);
  }
}
