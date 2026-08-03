import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Topbar } from '../topbar/topbar';
import { Icon } from '../icon/icon';
import { FlowChart } from '../flow-chart/flow-chart';
import { buildAllFlows, FlowDef } from './workflow-flows';
import { STAGE_STATS, StageStat, isBottleneck } from './stage-summary-data';

@Component({
  selector: 'app-workflow-monitor',
  imports: [Topbar, Icon, FlowChart],
  templateUrl: './workflow-monitor.html',
  styleUrl: './workflow-monitor.scss',
})
export class WorkflowMonitor {
  private readonly route = inject(ActivatedRoute);
  private readonly flows = buildAllFlows();
  private readonly homeRoute = this.route.snapshot.data['homeRoute'] as string | undefined;

  protected readonly filters: { key: string; label: string }[] = [
    { key: 'overall', label: 'Overall' },
    { key: 'applicant', label: 'Applicant' },
    { key: 'zoning', label: 'Zoning' },
    { key: 'fire-safety', label: 'Fire Safety' },
    { key: 'obo-review', label: 'OBO Review' },
    { key: 'building-official', label: 'Building Official' },
    { key: 'payment', label: 'Payment' },
    { key: 'releasing', label: 'Releasing' },
  ];

  protected readonly stageStats: StageStat[] = STAGE_STATS;

  protected readonly activeFilter = signal('overall');
  protected readonly filterMenuOpen = signal(false);

  protected readonly activeFlow = computed<FlowDef>(() => this.flows[this.activeFilter()]);

  protected readonly activeLabel = computed(
    () => this.filters.find((f) => f.key === this.activeFilter())?.label ?? 'Overall',
  );

  constructor(private readonly router: Router) {}

  protected isBottleneck(stat: StageStat): boolean {
    return isBottleneck(stat);
  }

  toggleFilterMenu(): void {
    this.filterMenuOpen.update((v) => !v);
  }

  selectFilter(key: string): void {
    this.activeFilter.set(key);
    this.filterMenuOpen.set(false);
  }

  backToList(): void {
    this.router.navigateByUrl(this.homeRoute ?? '/dashboard');
  }
}
