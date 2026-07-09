import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { FlowChart } from '../../shared/flow-chart/flow-chart';
import { buildAllFlows, FlowDef } from '../workflow/workflow-flows';

@Component({
  selector: 'app-tenant-workflow',
  imports: [Topbar, Icon, FlowChart],
  templateUrl: './tenant-workflow.html',
  styleUrl: '../workflow/workflow.scss',
})
export class TenantWorkflow {
  private readonly flows = buildAllFlows();

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

  protected readonly activeFilter = signal('overall');
  protected readonly filterMenuOpen = signal(false);

  protected readonly activeFlow = computed<FlowDef>(() => this.flows[this.activeFilter()]);

  protected readonly activeLabel = computed(
    () => this.filters.find((f) => f.key === this.activeFilter())?.label ?? 'Overall',
  );

  constructor(private readonly router: Router) {}

  toggleFilterMenu(): void {
    this.filterMenuOpen.update((v) => !v);
  }

  selectFilter(key: string): void {
    this.activeFilter.set(key);
    this.filterMenuOpen.set(false);
  }

  backToList(): void {
    this.router.navigateByUrl('/tenant/dashboard');
  }
}
