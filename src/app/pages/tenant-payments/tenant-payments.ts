import { Component, computed, signal } from '@angular/core';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { Pagination } from '../../shared/pagination/pagination';

type PayStatus = 'Paid' | 'Unpaid' | 'Pending';
type VerifyResult = 'success' | 'incomplete' | 'no-authority';
type ModalKind = 'confirm' | 'incomplete' | 'no-authority' | null;

interface HistoryEntry {
  ref: string;
  amount: string;
  date: string;
  status: 'Paid' | 'Unsuccessful';
  method: string;
  verifiedBy: string;
}

interface PaymentRow {
  id: string;
  applicant: string;
  city: string;
  region: string;
  type: string;
  dateSubmitted: string;
  amount: string;
  status: PayStatus;
  verified: boolean;
  verifyResult: VerifyResult;
  refNo: string;
  paymentMethod: string;
  fees: { processing: string; zoning: string; fire: string; obo: string; total: string };
  history: HistoryEntry[];
}

interface RingStat {
  label: string;
  value: string;
  color: string;
  light: string;
  pct: number;
}

const BASE_ROWS: Array<{
  id: string;
  applicant: string;
  city: string;
  type: string;
  dateSubmitted: string;
  status: PayStatus;
  verifyResult: VerifyResult;
  method: string;
}> = [
  { id: '#WA-2026', applicant: 'Raul Villa', city: 'Taguig City', type: 'Residential', dateSubmitted: '12 Apr 2024', status: 'Paid', verifyResult: 'success', method: 'Onsite' },
  { id: '#WA-2025', applicant: 'Fea Sims', city: 'Quezon City', type: 'Commercial', dateSubmitted: '24 Apr 2024', status: 'Pending', verifyResult: 'success', method: 'GCash' },
  { id: '#WA-2024', applicant: 'David Roderick', city: 'Pasig City', type: 'Renovation', dateSubmitted: '25 Apr 2024', status: 'Paid', verifyResult: 'success', method: 'Maya' },
  { id: '#WA-2023', applicant: 'James Zavel', city: 'Pasay City', type: 'Renovation', dateSubmitted: '14 Dec 2024', status: 'Paid', verifyResult: 'success', method: 'E-wallet' },
  { id: '#WA-2022', applicant: 'Denese Martin', city: 'Makati City', type: 'Renovation', dateSubmitted: '14 Jan 2024', status: 'Unpaid', verifyResult: 'incomplete', method: 'Maya' },
  { id: '#WA-2021', applicant: 'Jack Nunnally', city: 'Paranaque City', type: 'Renovation', dateSubmitted: '2 Dec 2024', status: 'Pending', verifyResult: 'no-authority', method: 'GCash' },
  { id: '#WA-2020', applicant: 'James Zavel', city: 'Bulacan City', type: 'Residential', dateSubmitted: '14 Dec 2024', status: 'Paid', verifyResult: 'success', method: 'Onsite' },
  { id: '#WA-2019', applicant: 'Anthony Williams', city: 'Mandaluyong City', type: 'Commercial', dateSubmitted: '1 Jul 2024', status: 'Unpaid', verifyResult: 'success', method: 'Maya' },
  { id: '#WA-2018', applicant: 'Axie Barnes', city: 'Marikina City', type: 'Commercial', dateSubmitted: '28 Aug 2024', status: 'Paid', verifyResult: 'success', method: 'E-wallet' },
  { id: '#WA-2017', applicant: 'Glen Morning', city: 'Caloocan City', type: 'Commercial', dateSubmitted: '30 Aug 2024', status: 'Pending', verifyResult: 'incomplete', method: 'Maya' },
];

function buildRows(): PaymentRow[] {
  return BASE_ROWS.map((r, i) => {
    const refNo = `0122${8300 + i * 40}`;
    const history: HistoryEntry[] =
      r.status === 'Paid'
        ? [
            { ref: refNo, amount: '1,400', date: r.dateSubmitted, status: 'Paid', method: r.method, verifiedBy: 'Engr. Doe' },
            { ref: `0122${8456 + i * 3}`, amount: '1,400', date: r.dateSubmitted, status: 'Unsuccessful', method: 'Maya', verifiedBy: '' },
            { ref: `0122${8329 + i * 2}`, amount: '1,400', date: r.dateSubmitted, status: 'Unsuccessful', method: 'Maya', verifiedBy: '' },
          ]
        : [{ ref: `0122${8100 + i * 5}`, amount: '1,400', date: r.dateSubmitted, status: 'Unsuccessful', method: r.method, verifiedBy: '' }];

    return {
      id: r.id,
      applicant: r.applicant,
      city: r.city,
      region: 'National Capital Region',
      type: r.type,
      dateSubmitted: r.dateSubmitted,
      amount: 'P1,400',
      status: r.status,
      verified: r.status === 'Paid',
      verifyResult: r.verifyResult,
      refNo,
      paymentMethod: r.method,
      fees: { processing: 'P250', zoning: 'P 150', fire: 'P500', obo: 'P500', total: 'P1,400' },
      history,
    };
  });
}

@Component({
  selector: 'app-tenant-payments',
  imports: [Topbar, Icon, Avatar, DonutChart, Pagination],
  templateUrl: './tenant-payments.html',
  styleUrl: './tenant-payments.scss',
})
export class TenantPayments {
  protected readonly view = signal<'list' | 'detail'>('list');
  protected readonly rows = signal<PaymentRow[]>(buildRows());
  protected readonly selectedId = signal<string | null>(null);

  protected readonly selectedRow = computed(
    () => this.rows().find((r) => r.id === this.selectedId()) ?? null,
  );

  protected readonly page = signal(1);
  protected readonly pageSize = 10;

  protected readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.rows().slice(start, start + this.pageSize);
  });

  protected readonly ringStats: RingStat[] = [
    { label: 'Pending', value: '524', color: '#f5c518', light: '#fdf1c7', pct: 45 },
    { label: 'Paid', value: '849', color: '#22c55e', light: '#d7f5df', pct: 75 },
    { label: 'Unpaid', value: '376', color: '#ef4444', light: '#fbdada', pct: 30 },
    { label: 'Total Payments', value: '196', color: '#3b82f6', light: '#dbe8fd', pct: 85 },
  ];

  protected ringSegments(stat: RingStat): DonutSegment[] {
    return [
      { label: 'value', value: stat.pct, color: stat.color },
      { label: 'rest', value: 100 - stat.pct, color: stat.light },
    ];
  }

  protected readonly modal = signal<ModalKind>(null);
  protected readonly pendingVerifyId = signal<string | null>(null);

  openDetail(row: PaymentRow): void {
    this.selectedId.set(row.id);
    this.view.set('detail');
  }

  backToList(): void {
    this.view.set('list');
  }

  requestVerify(row: PaymentRow): void {
    this.pendingVerifyId.set(row.id);
    this.modal.set('confirm');
  }

  confirmVerify(): void {
    const id = this.pendingVerifyId();
    const row = this.rows().find((r) => r.id === id);
    if (!row) {
      this.modal.set(null);
      return;
    }

    if (row.verifyResult === 'incomplete') {
      this.modal.set('incomplete');
      return;
    }
    if (row.verifyResult === 'no-authority') {
      this.modal.set('no-authority');
      return;
    }

    this.rows.update((rows) =>
      rows.map((r) => (r.id === id ? { ...r, status: 'Paid', verified: true } : r)),
    );
    this.modal.set(null);
  }

  closeModal(): void {
    this.modal.set(null);
    this.pendingVerifyId.set(null);
  }
}
