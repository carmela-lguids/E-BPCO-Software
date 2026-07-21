import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DilgSeal } from '../../shared/dilg-seal/dilg-seal';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { Pagination } from '../../shared/pagination/pagination';
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

interface RingStat {
  label: string;
  value: string;
  color: string;
  light: string;
  pct: number;
}

@Component({
  selector: 'app-tenant-applications',
  imports: [Topbar, Icon, Avatar, DilgSeal, DonutChart, Pagination, FormsModule],
  templateUrl: './tenant-applications.html',
  styleUrl: './tenant-applications.scss',
})
export class TenantApplications {
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

  protected readonly activeEvalDetail = computed(() => {
    const key = this.selectedEval();
    return key ? this.evalDetails[key] : null;
  });

  openDetail(row: AppRow): void {
    this.selectedRow.set(row);
    this.detailTab.set('timeline');
    this.view.set('detail');
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
}
