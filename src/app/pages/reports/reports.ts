import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { StackedBarChart } from '../../shared/stacked-bar-chart/stacked-bar-chart';
import { AreaChart } from '../../shared/area-chart/area-chart';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { Session } from '../../core/session';
import { ROLES } from '../../core/roles';
import {
  REPORT_DEFS,
  DATE_RANGES,
  REPORT_TENANTS,
  DateRange,
  ReportDef,
  applicationVolumeRows,
  processingTimeSeries,
  revenueSeries,
  inspectionOutcomeSegments,
  staffWorkloadRows,
  summaryFor,
} from './reports-data';

interface SavedReport {
  title: string;
  dateRange: DateRange;
  tenant: string;
  generatedAt: string;
}

@Component({
  selector: 'app-reports',
  imports: [Topbar, Icon, FormsModule, StackedBarChart, AreaChart, DonutChart],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports {
  private readonly session = inject(Session);

  protected readonly reportDefs = REPORT_DEFS;
  protected readonly dateRanges = DATE_RANGES;
  protected readonly reportTenants = REPORT_TENANTS;

  // Only national roles evaluate more than one tenant — a tenant role's own
  // data is already scoped, so the tenant filter would be a no-op for them.
  protected readonly isNationalRole = computed(
    () => ROLES[this.session.currentAccount().role].group === 'super-admin',
  );

  protected readonly activeReport = signal<ReportDef | null>(null);
  protected readonly dateRange = signal<DateRange>('This Month');
  protected readonly tenantFilter = signal<string>('All Tenants');
  protected readonly savedReports = signal<SavedReport[]>([]);
  protected readonly exportToast = signal<string | null>(null);

  protected readonly stackedBarRows = computed(() => {
    const report = this.activeReport();
    if (report?.key === 'application-volume') return applicationVolumeRows();
    if (report?.key === 'staff-workload') return staffWorkloadRows();
    return [];
  });

  protected readonly areaSeries = computed(() => {
    const report = this.activeReport();
    if (report?.key === 'processing-time') return processingTimeSeries();
    if (report?.key === 'revenue') return revenueSeries();
    return [];
  });

  protected readonly donutSegments = computed<DonutSegment[]>(() => {
    const report = this.activeReport();
    return report?.key === 'inspection-outcomes' ? inspectionOutcomeSegments() : [];
  });

  protected readonly summaryRows = computed(() => {
    const report = this.activeReport();
    return report ? summaryFor(report.key) : [];
  });

  selectReport(report: ReportDef): void {
    this.activeReport.set(report);
  }

  backToPicker(): void {
    this.activeReport.set(null);
  }

  setDateRange(range: DateRange): void {
    this.dateRange.set(range);
  }

  setTenantFilter(tenant: string): void {
    this.tenantFilter.set(tenant);
  }

  exportReport(): void {
    const report = this.activeReport();
    if (!report) return;
    const filename = `${report.key}-${this.dateRange().toLowerCase().replace(/\s+/g, '-')}.csv`;
    this.savedReports.update((list) => [
      { title: report.title, dateRange: this.dateRange(), tenant: this.tenantFilter(), generatedAt: 'just now' },
      ...list,
    ]);
    this.exportToast.set(`${filename} ready`);
    setTimeout(() => this.exportToast.set(null), 3000);
  }
}
