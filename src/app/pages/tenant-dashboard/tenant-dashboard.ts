import { Component } from '@angular/core';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { LollipopChart, LollipopCategory } from '../../shared/lollipop-chart/lollipop-chart';
import { HBarChart, HBarRow } from '../../shared/h-bar-chart/h-bar-chart';
import { buildPermitQueue } from '../../shared/permit-queue/permit-queue';

interface RingStat {
  label: string;
  value: string;
  color: string;
  light: string;
  pct: number;
}

interface OverdueItem {
  severity: 'Low' | 'Medium' | 'High';
  color: string;
  text: string;
  agoLabel: string;
}

interface ApplicationRow {
  id: string;
  applicant: string;
  location: string;
  type: string;
  dateSubmitted: string;
  officer: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

@Component({
  selector: 'app-tenant-dashboard',
  imports: [Topbar, Icon, Avatar, DonutChart, LollipopChart, HBarChart],
  templateUrl: './tenant-dashboard.html',
  styleUrl: './tenant-dashboard.scss',
})
export class TenantDashboard {
  protected readonly ringStats: RingStat[] = [
    { label: 'Pending', value: '524', color: '#f5c518', light: '#fdf1c7', pct: 45 },
    { label: 'Approved', value: '849', color: '#22c55e', light: '#d7f5df', pct: 75 },
    { label: 'Rejected', value: '376', color: '#ef4444', light: '#fbdada', pct: 30 },
    { label: 'Total Applications', value: '1,749', color: '#3b82f6', light: '#dbe8fd', pct: 85 },
  ];

  protected ringSegments(stat: RingStat): DonutSegment[] {
    return [
      { label: 'value', value: stat.pct, color: stat.color },
      { label: 'rest', value: 100 - stat.pct, color: stat.light },
    ];
  }

  protected readonly queueCategories: LollipopCategory[] = buildPermitQueue();

  protected readonly pendingRows: HBarRow[] = [
    { label: 'Initial Evaluation', value: 130 },
    { label: 'Zoning Review', value: 340 },
    { label: 'Fire Review', value: 380 },
    { label: 'OBO Review', value: 270 },
    { label: 'Final Approval', value: 650 },
  ];

  protected readonly overdueItems: OverdueItem[] = [
    {
      severity: 'High',
      color: '#ef4444',
      text: "Fea Sim's application is waiting for you in Zoning review for 8 days",
      agoLabel: '1 day ago',
    },
    {
      severity: 'Medium',
      color: '#f59e0b',
      text: "Jack Nunnally's application is waiting for you in Fire review for 4 days",
      agoLabel: '1 day ago',
    },
    {
      severity: 'Low',
      color: '#f5c518',
      text: "Glen Morning's application is waiting for you in OBO review for 2 days",
      agoLabel: '1 day ago',
    },
  ];

  protected readonly applications: ApplicationRow[] = [
    {
      id: '#WA-2026',
      applicant: 'Raul Villa',
      location: 'Taguig City',
      type: 'Residential',
      dateSubmitted: '12 Apr 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
    {
      id: '#WA-2025',
      applicant: 'Fea Sims',
      location: 'Quezon City',
      type: 'Commercial',
      dateSubmitted: '24 Apr 2024',
      officer: 'Engr. Doe',
      status: 'Pending',
    },
    {
      id: '#WA-2024',
      applicant: 'David Roderick',
      location: 'Pasig City',
      type: 'Renovation',
      dateSubmitted: '25 Apr 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
    {
      id: '#WA-2023',
      applicant: 'James Zavel',
      location: 'Pasay City',
      type: 'Renovation',
      dateSubmitted: '14 Dec 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
    {
      id: '#WA-2022',
      applicant: 'Denese Martin',
      location: 'Makati City',
      type: 'Renovation',
      dateSubmitted: '14 Jan 2024',
      officer: 'Engr. Doe',
      status: 'Rejected',
    },
    {
      id: '#WA-2021',
      applicant: 'Jack Nunnally',
      location: 'Paranaque City',
      type: 'Renovation',
      dateSubmitted: '2 Dec 2024',
      officer: 'Engr. Doe',
      status: 'Pending',
    },
    {
      id: '#WA-2020',
      applicant: 'James Zavel',
      location: 'Bulacan City',
      type: 'Residential',
      dateSubmitted: '14 Dec 2024',
      officer: 'Engr. Doe',
      status: 'Approved',
    },
  ];
}
