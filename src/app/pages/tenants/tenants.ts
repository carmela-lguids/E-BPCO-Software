import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { DonutChart, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { Pagination } from '../../shared/pagination/pagination';

type SubTab = 'analytics' | 'modules' | 'recent-activity';
type ViewMode = 'list' | 'create';

interface RingStat {
  label: string;
  value: string;
  color: string;
  light: string;
  pct: number;
}

interface TenantRow {
  id: string;
  code: string;
  city: string;
  contactName: string;
  contactPhone: string;
  subdomain: string;
  dateCreated: string;
  userCount: number;
  status: 'Active' | 'Inactive';
}

interface ModuleUsage {
  name: string;
  tenantCount: number;
  pct: number;
  color: string;
}

interface ActivityItem {
  name: string;
  text: string;
  dateLabel: string;
  agoLabel: string;
  color: string;
}

const CITIES = [
  'Taguig',
  'Quezon',
  'Makati',
  'Pasig',
  'Pasay',
  'Laguna',
  'Dasma',
  'Bulacan',
  'Paranaque',
  'Pateros',
  'Antipolo',
  'Cavite',
];

const NAMES = [
  'Daniel Cruz',
  'Maria Santos',
  'Jose Reyes',
  'Ana Garcia',
  'Mark Lopez',
  'Grace Tan',
  'Paolo Ramos',
  'Liza Dela Cruz',
  'Ramon Torres',
  'Carmen Diaz',
  'Victor Bautista',
  'Rosa Mendoza',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildTenantRows(count: number): TenantRow[] {
  return Array.from({ length: count }, (_, i) => {
    const city = CITIES[i % CITIES.length];
    return {
      id: `#WA-${2026 - i}`,
      code: `LGU${city.toUpperCase()}`,
      city: `${city} City`,
      contactName: NAMES[i % NAMES.length],
      contactPhone: `63 9${(10 + (i % 89)).toString().padStart(2, '0')} ${(100 + i * 7).toString().padStart(3, '0')} ${(1000 + i * 37).toString().padStart(4, '0')}`,
      subdomain: `${city.toLowerCase()}city.yourapp.gov.ph`,
      dateCreated: `${(i % 27) + 1} ${MONTHS[i % 12]} 2024`,
      userCount: 8 + ((i * 3) % 16),
      status: i % 5 === 4 ? 'Inactive' : ('Active' as 'Active' | 'Inactive'),
    };
  });
}

interface GrowthPoint {
  label: string;
  value: number;
}

const GROWTH_POINTS: GrowthPoint[] = [
  { label: 'Jan', value: 8 },
  { label: 'Feb', value: 38 },
  { label: 'Mar', value: 52 },
  { label: 'Apr', value: 28 },
  { label: 'May', value: 40 },
  { label: 'Jun', value: 22 },
  { label: 'Jul', value: 46 },
  { label: 'Aug', value: 34 },
  { label: 'Sep', value: 58 },
  { label: 'Oct', value: 54 },
  { label: 'Nov', value: 64 },
  { label: 'Dec', value: 90 },
];

@Component({
  selector: 'app-tenants',
  imports: [Topbar, Icon, Avatar, DonutChart, Pagination, FormsModule],
  templateUrl: './tenants.html',
  styleUrl: './tenants.scss',
})

export class Tenants {
  protected readonly view = signal<ViewMode>('list');
  protected readonly activeSubTab = signal<SubTab>('analytics');

  protected readonly ringStats: RingStat[] = [
    { label: 'Total Users', value: '1,524', color: '#f59e0b', light: '#fef3c7', pct: 65 },
    { label: 'Active Tenants', value: '849', color: '#16a34a', light: '#dcfce7', pct: 70 },
    { label: 'Inactive Tenants', value: '376', color: '#991b1b', light: '#fdeceb', pct: 30 },
    { label: 'Total Tenants', value: '196', color: '#2563eb', light: '#dbeafe', pct: 55 },
  ];

  protected ringSegments(stat: RingStat): DonutSegment[] {
    return [
      { label: 'value', value: stat.pct, color: stat.color },
      { label: 'rest', value: 100 - stat.pct, color: stat.light },
    ];
  }

  protected readonly tenantRows = signal<TenantRow[]>(buildTenantRows(12));
  protected readonly page = signal(1);
  protected readonly pageSize = 10;

  protected readonly pagedTenantRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.tenantRows().slice(start, start + this.pageSize);
  });

  protected readonly moduleUsage: ModuleUsage[] = [
    { name: 'Initial Evaluation', tenantCount: 122, pct: 30, color: '#7c3aed' },
    { name: 'Zoning Evaluation', tenantCount: 122, pct: 50, color: '#f59e0b' },
    { name: 'Fire Safety Evaluation', tenantCount: 75, pct: 60, color: '#2563eb' },
    { name: 'OBO Evaluation', tenantCount: 32, pct: 80, color: '#16a34a' },
    { name: 'Localization evaluation', tenantCount: 22, pct: 30, color: '#991b1b' },
  ];

  protected readonly recentActivity: ActivityItem[] = [
    {
      name: 'Quezon City LGU',
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      dateLabel: 'May 20, 2028 - 10:30 AM',
      agoLabel: '3 hours ago',
      color: '#a78bfa',
    },
    {
      name: 'Taguig City LGU',
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      dateLabel: 'May 20, 2028 - 8:30 AM',
      agoLabel: '5 hours ago',
      color: '#a78bfa',
    },
    {
      name: 'Pasay City LGU',
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      dateLabel: 'May 20, 2028 - 8:30 AM',
      agoLabel: '5 hours ago',
      color: '#a78bfa',
    },
    {
      name: 'Makati City LGU',
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      dateLabel: 'May 20, 2028 - 7:30 AM',
      agoLabel: '3 hours ago',
      color: '#a78bfa',
    },
  ];

  protected readonly growthPoints = GROWTH_POINTS;

  protected readonly growthPath = computed(() => {
    const pts = this.growthPoints;
    const maxVal = 100;
    const w = 1000;
    const h = 260;
    const stepX = w / (pts.length - 1);
    const coords = pts.map((p, i) => ({
      x: i * stepX,
      y: h - (p.value / maxVal) * h,
    }));
    return coords.map((c, i) => (i === 0 ? `M${c.x},${c.y}` : `L${c.x},${c.y}`)).join(' ');
  });

  protected readonly growthMarkers = computed(() => {
    const pts = this.growthPoints;
    const maxVal = 100;
    const w = 1000;
    const h = 260;
    const stepX = w / (pts.length - 1);
    return pts.map((p, i) => ({
      x: i * stepX,
      y: h - (p.value / maxVal) * h,
      label: p.label,
    }));
  });

  private readonly growthChartWrap = viewChild<ElementRef<HTMLDivElement>>('growthChartWrap');
  protected readonly hoveredGrowthIndex = signal<number | null>(null);

  protected readonly hoveredGrowthPoint = computed(() => {
    const i = this.hoveredGrowthIndex();
    if (i === null) return null;
    const marker = this.growthMarkers()[i];
    // Anchor the tooltip above the dot, but never let it rise past this
    // floor — otherwise a near-top point (a high growth value) floats the
    // tooltip up into the card header and behind the range filter.
    const tooltipY = Math.max(marker.y, 60);
    return { ...marker, tooltipY, value: this.growthPoints[i].value };
  });

  protected onGrowthPointerMove(event: MouseEvent): void {
    const el = this.growthChartWrap()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const n = this.growthPoints.length;
    const idx = Math.round(ratio * (n - 1));
    this.hoveredGrowthIndex.set(Math.min(Math.max(idx, 0), n - 1));
  }

  protected onGrowthPointerLeave(): void {
    this.hoveredGrowthIndex.set(null);
  }

  protected readonly metricTiles = [
    { label: 'Applications Processed', value: '2,032', delta: '12.5%', direction: 'up' as const },
    { label: 'Avg. Processing Time', value: '3.6 days', delta: '8.3%', direction: 'down' as const },
    { label: 'Active Users', value: '1,524', delta: '9.7%', direction: 'up' as const },
    { label: 'Storage Used', value: '245 GB', delta: '15.2%', direction: 'up' as const },
  ];

  protected readonly newTenant = {
    tenantName: '',
    type: '',
    contactName: '',
    contactPhone: '',
    region: '',
    province: '',
    cityMunicipality: '',
    barangay: '',
    userName: '',
    password: '',
    confirmPassword: '',
    slug: '',
    modules: {
      initialEvaluation: false,
      zoningEvaluation: false,
      fireSafetyEvaluation: false,
      locationalClearance: false,
    },
  };

  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  selectSubTab(tab: SubTab): void {
    this.activeSubTab.set(tab);
  }

  openCreate(): void {
    this.view.set('create');
  }

  backToList(): void {
    this.view.set('list');
  }

  createTenant(): void {
    const name = this.newTenant.tenantName.trim() || 'New Tenant';
    const code = name.toUpperCase().replace(/\s+/g, '');
    const nextIdNum = Math.max(...this.tenantRows().map((r) => parseInt(r.id.replace('#WA-', ''), 10))) + 1;

    this.tenantRows.update((rows) => [
      {
        id: `#WA-${nextIdNum}`,
        code: `LGU${code.slice(0, 10)}`,
        city: name,
        contactName: this.newTenant.contactName.trim() || 'N/A',
        contactPhone: this.newTenant.contactPhone.trim() || 'N/A',
        subdomain: `${(this.newTenant.slug.trim() || code.toLowerCase())}.yourapp.gov.ph`,
        dateCreated: 'Just now',
        userCount: 1,
        status: 'Active',
      },
      ...rows,
    ]);

    this.view.set('list');
    this.page.set(1);
  }
}
